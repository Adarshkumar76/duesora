import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import nodemailer from "nodemailer";

export interface DoctorCheckResult {
  name: string;
  category: "runtime" | "environment" | "database" | "redis" | "smtp" | "storage";
  status: "ok" | "warn" | "error";
  message: string;
  detail?: string;
}

export interface DoctorReport {
  timestamp: string;
  checks: DoctorCheckResult[];
  success: boolean;
  warnings: number;
  errors: number;
}

/**
 * Checks the Node.js runtime version.
 */
export function checkNodeRuntime(): DoctorCheckResult {
  const version = process.version;
  const major = parseInt(version.replace(/^v/, "").split(".")[0], 10);

  if (major >= 20) {
    return {
      name: "Node.js Runtime",
      category: "runtime",
      status: "ok",
      message: `Running on Node.js ${version} (meets >= v20 requirement)`,
    };
  }

  return {
    name: "Node.js Runtime",
    category: "runtime",
    status: "warn",
    message: `Running on Node.js ${version}. Duesora recommends Node.js v20.0.0 or higher.`,
  };
}

/**
 * Checks critical and optional environment configuration.
 */
export function checkEnvironmentVariables(
  env: Record<string, string | undefined> = process.env
): DoctorCheckResult {
  const missingCritical: string[] = [];
  const missingRecommended: string[] = [];

  const dbUrl = env.DATABASE_URL;
  if (!dbUrl) {
    missingCritical.push("DATABASE_URL");
  }

  const authSecret = env.NEXTAUTH_SECRET || env.AUTH_SECRET;
  if (!authSecret) {
    missingCritical.push("NEXTAUTH_SECRET");
  }

  const appUrl = env.NEXTAUTH_URL || env.APP_URL;
  if (!appUrl) {
    missingRecommended.push("NEXTAUTH_URL");
  }

  if (missingCritical.length > 0) {
    return {
      name: "Environment Variables",
      category: "environment",
      status: "error",
      message: `Missing critical environment variables: ${missingCritical.join(", ")}`,
      detail: "Set these variables in your .env.local file or deployment environment.",
    };
  }

  if (missingRecommended.length > 0) {
    return {
      name: "Environment Variables",
      category: "environment",
      status: "warn",
      message: `Configured with recommended defaults. Optional missing: ${missingRecommended.join(", ")}`,
    };
  }

  return {
    name: "Environment Variables",
    category: "environment",
    status: "ok",
    message: "Critical secrets and URLs configured properly",
  };
}

/**
 * Checks PostgreSQL connectivity and table initialization.
 */
export async function checkDatabase(connectionString?: string): Promise<DoctorCheckResult> {
  const dbUrl =
    connectionString ||
    process.env.DATABASE_URL ||
    "postgresql://duesora:duesora@localhost:5432/duesora";

  let sql: ReturnType<typeof postgres> | null = null;
  try {
    sql = postgres(dbUrl, {
      max: 1,
      connect_timeout: 4,
      idle_timeout: 2,
    });

    const [ping] = await sql`SELECT 1 as connected;`;
    if (!ping || ping.connected !== 1) {
      throw new Error("Unexpected response from database query");
    }

    const tableRows = await sql`
      SELECT count(*)::int as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;

    const count = tableRows[0]?.count ?? 0;

    return {
      name: "PostgreSQL Database",
      category: "database",
      status: "ok",
      message: `Connected successfully (${count} tables found in public schema)`,
      detail: count === 0 ? "Schema may need migrations. Run drizzle-kit push." : undefined,
    };
  } catch (err: unknown) {
    return {
      name: "PostgreSQL Database",
      category: "database",
      status: "error",
      message: `Database connection failed: ${err instanceof Error ? err.message : String(err)}`,
      detail: `Attempted connection to ${dbUrl.replace(/:[^:@]+@/, ":****@")}`,
    };
  } finally {
    if (sql) {
      await sql.end({ timeout: 2 }).catch(() => {});
    }
  }
}

/**
 * Checks Redis connectivity via TCP probe.
 */
export async function checkRedis(redisUrl = process.env.REDIS_URL): Promise<DoctorCheckResult> {
  if (!redisUrl) {
    return {
      name: "Redis Cache / Queue",
      category: "redis",
      status: "ok",
      message: "REDIS_URL not configured (optional for basic standalone operations)",
    };
  }

  return new Promise((resolve) => {
    try {
      const parsed = new URL(redisUrl);
      const host = parsed.hostname || "127.0.0.1";
      const port = parseInt(parsed.port || "6379", 10);

      const socket = net.createConnection({ host, port, timeout: 3000 });

      socket.on("connect", () => {
        socket.destroy();
        resolve({
          name: "Redis Cache / Queue",
          category: "redis",
          status: "ok",
          message: `Reachable at ${host}:${port}`,
        });
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve({
          name: "Redis Cache / Queue",
          category: "redis",
          status: "warn",
          message: `Connection timed out to ${host}:${port}`,
        });
      });

      socket.on("error", (err) => {
        socket.destroy();
        resolve({
          name: "Redis Cache / Queue",
          category: "redis",
          status: "warn",
          message: `Could not connect to Redis at ${host}:${port}: ${err.message}`,
        });
      });
    } catch (err: unknown) {
      resolve({
        name: "Redis Cache / Queue",
        category: "redis",
        status: "warn",
        message: `Invalid REDIS_URL format: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  });
}

/**
 * Checks SMTP transport configuration if configured.
 */
export async function checkSmtp(
  env: Record<string, string | undefined> = process.env
): Promise<DoctorCheckResult> {
  const host = env.SMTP_HOST || env.EMAIL_SERVER_HOST;
  const port = parseInt(env.SMTP_PORT || env.EMAIL_SERVER_PORT || "587", 10);
  const user = env.SMTP_USER || env.EMAIL_SERVER_USER;
  const pass = env.SMTP_PASS || env.EMAIL_SERVER_PASSWORD;

  if (!host) {
    return {
      name: "SMTP Mailer",
      category: "smtp",
      status: "ok",
      message: "SMTP not configured (optional; in-app and push channels active)",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
      connectionTimeout: 4000,
    });

    await transporter.verify();

    return {
      name: "SMTP Mailer",
      category: "smtp",
      status: "ok",
      message: `Connected & authenticated successfully to ${host}:${port}`,
    };
  } catch (err: unknown) {
    return {
      name: "SMTP Mailer",
      category: "smtp",
      status: "warn",
      message: `SMTP verification warning: ${err instanceof Error ? err.message : String(err)}`,
      detail: `Host: ${host}:${port}, User: ${user || "none"}`,
    };
  }
}

/**
 * Checks local upload/storage write permissions.
 */
export function checkStorage(storagePath = "./uploads"): DoctorCheckResult {
  const resolved = path.resolve(process.cwd(), storagePath);
  try {
    if (!fs.existsSync(resolved)) {
      fs.mkdirSync(resolved, { recursive: true });
    }

    const testFile = path.join(resolved, `.duesora-doctor-test-${Date.now()}`);
    fs.writeFileSync(testFile, "duesora-doctor-probe", "utf8");
    fs.unlinkSync(testFile);

    return {
      name: "Attachment Storage",
      category: "storage",
      status: "ok",
      message: `Read/write permissions verified at ${storagePath}`,
    };
  } catch (err: unknown) {
    return {
      name: "Attachment Storage",
      category: "storage",
      status: "error",
      message: `Storage permission error at ${storagePath}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Runs all diagnostic checks and compiles a DoctorReport.
 */
export async function runDoctorDiagnostics(options?: {
  dbUrl?: string;
  storagePath?: string;
}): Promise<DoctorReport> {
  const checks: DoctorCheckResult[] = [];

  checks.push(checkNodeRuntime());
  checks.push(checkEnvironmentVariables());
  checks.push(await checkDatabase(options?.dbUrl));
  checks.push(await checkRedis());
  checks.push(await checkSmtp());
  checks.push(checkStorage(options?.storagePath));

  const errors = checks.filter((c) => c.status === "error").length;
  const warnings = checks.filter((c) => c.status === "warn").length;

  return {
    timestamp: new Date().toISOString(),
    checks,
    success: errors === 0,
    errors,
    warnings,
  };
}

/**
 * Formats doctor results into user-friendly CLI terminal output.
 */
export function formatDoctorCliOutput(report: DoctorReport): string {
  const lines: string[] = [];
  lines.push("══════════════════════════════════════════════════════════════");
  lines.push("               DUESORA SYSTEM HEALTH REPORT                   ");
  lines.push("══════════════════════════════════════════════════════════════");
  lines.push(`Generated: ${report.timestamp}\n`);

  for (const check of report.checks) {
    let icon = "✓";
    let statusText = "PASS";
    if (check.status === "warn") {
      icon = "⚠";
      statusText = "WARN";
    } else if (check.status === "error") {
      icon = "✗";
      statusText = "FAIL";
    }

    lines.push(`[${icon} ${statusText}] ${check.name}`);
    lines.push(`       ${check.message}`);
    if (check.detail) {
      lines.push(`       Detail: ${check.detail}`);
    }
    lines.push("");
  }

  lines.push("──────────────────────────────────────────────────────────────");
  if (report.success) {
    lines.push(
      report.warnings > 0
        ? `Status: HEALTHY WITH WARNINGS (${report.warnings} warnings, 0 errors)`
        : "Status: ALL CHECKS PASSED (System is ready for production)"
    );
  } else {
    lines.push(`Status: UNHEALTHY (${report.errors} critical errors detected)`);
  }
  lines.push("══════════════════════════════════════════════════════════════");

  return lines.join("\n");
}
