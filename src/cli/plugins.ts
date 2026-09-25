import { pluginRegistry } from "../lib/plugins/registry";

export function formatPluginsCliOutput(): string {
  const plugins = pluginRegistry.listPlugins();
  const lines: string[] = [];

  lines.push("================================================================================");
  lines.push(` DUESORA REGISTERED PLUGINS (${plugins.length} active)`);
  lines.push("================================================================================\n");

  if (plugins.length === 0) {
    lines.push("No plugins currently registered.");
    return lines.join("\n");
  }

  for (const plugin of plugins) {
    lines.push(`• [${plugin.category.toUpperCase()}] ${plugin.name} (v${plugin.version})`);
    lines.push(`  ID:          ${plugin.id}`);
    lines.push(`  Description: ${plugin.description}`);
    lines.push("");
  }

  lines.push("================================================================================");
  return lines.join("\n");
}
