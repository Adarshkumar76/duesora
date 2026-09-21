import crypto from "crypto";
import {
  listWebhookEndpoints,
  getWebhookEndpointById,
  recordWebhookDelivery,
  type WebhookEndpointItem,
} from "./repository";
import { signWebhookPayload } from "./signer";

export interface WebhookPayload<T = Record<string, unknown>> {
  id: string;
  event: string;
  timestamp: string;
  workspaceId: string;
  data: T;
}

export interface DispatchResult {
  endpointId: string;
  url: string;
  status: "success" | "failed";
  statusCode?: number;
  durationMs: number;
  error?: string;
}

const TIMEOUT_MS = 5000;

async function deliverToEndpoint(
  endpoint: WebhookEndpointItem,
  payloadString: string,
  event: string
): Promise<DispatchResult> {
  const deliveryId = `del_${crypto.randomUUID()}`;
  const startTime = performance.now();
  const timestampSec = Math.floor(Date.now() / 1000);

  const { signatureHeader } = signWebhookPayload(
    payloadString,
    endpoint.secret,
    timestampSec
  );

  let statusCode: number | undefined;
  let responseBody: string | undefined;
  let errorMessage: string | undefined;
  let deliveryStatus: "success" | "failed" = "failed";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Duesora-Webhook/0.1",
        "X-Duesora-Event": event,
        "X-Duesora-Delivery": deliveryId,
        "X-Duesora-Signature-256": signatureHeader,
        "X-Duesora-Timestamp": String(timestampSec),
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    statusCode = response.status;
    responseBody = await response.text();

    if (response.ok) {
      deliveryStatus = "success";
    } else {
      errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
    }
  } catch (err) {
    if (err instanceof Error) {
      errorMessage = err.name === "AbortError" ? "Delivery timed out (5s limit)" : err.message;
    } else {
      errorMessage = "Network request failed";
    }
  }

  const durationMs = Math.round(performance.now() - startTime);

  // Record delivery attempt asynchronously in database
  await recordWebhookDelivery({
    webhookEndpointId: endpoint.id,
    workspaceId: endpoint.workspaceId,
    event,
    payload: payloadString,
    statusCode,
    responseBody,
    durationMs,
    error: errorMessage,
    status: deliveryStatus,
  }).catch(() => {});

  return {
    endpointId: endpoint.id,
    url: endpoint.url,
    status: deliveryStatus,
    statusCode,
    durationMs,
    error: errorMessage,
  };
}

/**
 * Emits an event to all subscribed webhook endpoints in a workspace.
 * Non-blocking: executes deliveries in parallel and logs attempts.
 */
export async function emitWorkspaceWebhook(
  workspaceId: string,
  event: string,
  data: Record<string, unknown>
): Promise<DispatchResult[]> {
  try {
    const endpoints = await listWebhookEndpoints(workspaceId);
    const activeSubscribers = endpoints.filter(
      (ep) =>
        ep.active &&
        (ep.events.includes("*") || ep.events.includes(event))
    );

    if (activeSubscribers.length === 0) return [];

    const payloadObj: WebhookPayload = {
      id: `evt_${crypto.randomUUID()}`,
      event,
      timestamp: new Date().toISOString(),
      workspaceId,
      data,
    };

    const payloadString = JSON.stringify(payloadObj);

    // Dispatch in parallel
    const results = await Promise.all(
      activeSubscribers.map((ep) => deliverToEndpoint(ep, payloadString, event))
    );

    return results;
  } catch {
    return [];
  }
}

/**
 * Sends an immediate test ping event ("endpoint.test") to a specific webhook endpoint.
 */
export async function sendWebhookPing(
  workspaceId: string,
  endpointId: string
): Promise<DispatchResult> {
  const endpoint = await getWebhookEndpointById(workspaceId, endpointId);
  if (!endpoint) {
    throw new Error("Webhook endpoint not found");
  }

  const event = "endpoint.test";
  const payloadObj: WebhookPayload = {
    id: `evt_${crypto.randomUUID()}`,
    event,
    timestamp: new Date().toISOString(),
    workspaceId,
    data: {
      message: "This is a test webhook event from Duesora.",
      endpointId: endpoint.id,
      url: endpoint.url,
      testedAt: new Date().toISOString(),
    },
  };

  const payloadString = JSON.stringify(payloadObj);
  return deliverToEndpoint(endpoint, payloadString, event);
}
