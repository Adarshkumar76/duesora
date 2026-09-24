import {
  createResource,
  getResourceById,
  listResources,
  deleteResource,
  updateResource,
  type CreateResourceInput,
  type UpdateResourceInput,
  type ListResourcesOptions,
} from "./repository";

import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { emitWorkspaceWebhook } from "@/lib/webhooks/dispatcher";
import { recordAuditEvent } from "@/lib/audit/service";
import { recordResourceCostChange } from "./cost-history";
import { dispatchPriceIncreaseChatAlert } from "@/lib/integrations/chat/dispatcher";

export { getResourceById };

export async function getWorkspaceResource(
  userId: string,
  workspaceId: string,
  resourceId: string
) {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  return getResourceById(workspaceId, resourceId);
}

export async function listWorkspaceResources(
  userId: string,
  workspaceId: string,
  options?: ListResourcesOptions
) {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  return options !== undefined
    ? listResources(workspaceId, options)
    : listResources(workspaceId);
}

export async function createWorkspaceResource(
  userId: string,
  input: CreateResourceInput
) {
  await requireWorkspaceRole(
    userId,
    input.workspaceId,
    "member"
  );

  const resource = await createResource(input);

  // Emit outbound webhook event asynchronously
  emitWorkspaceWebhook(input.workspaceId, "resource.created", resource as unknown as Record<string, unknown>).catch(() => {});

  // Record audit log entry
  if (resource) {
    recordAuditEvent({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "resource.created",
      entityType: "resource",
      entityId: resource.id,
      entityName: resource.name,
      details: { type: resource.type, category: resource.category, amountMinor: resource.amountMinor },
    }).catch(() => {});
  }

  return resource;
}

export async function deleteWorkspaceResource(
  userId: string,
  workspaceId: string,
  resourceId: string
) {
  await requireWorkspaceRole(userId, workspaceId, "member");

  const success = await deleteResource(workspaceId, resourceId);

  if (success) {
    emitWorkspaceWebhook(workspaceId, "resource.deleted", { resourceId, deleted: true }).catch(() => {});

    recordAuditEvent({
      workspaceId,
      actorId: userId,
      action: "resource.deleted",
      entityType: "resource",
      entityId: resourceId,
    }).catch(() => {});
  }

  return success;
}

export async function updateWorkspaceResource(
  userId: string,
  workspaceId: string,
  resourceId: string,
  input: UpdateResourceInput
) {
  await requireWorkspaceRole(userId, workspaceId, "member");

  const previous = await getResourceById(workspaceId, resourceId);

  const updated = await updateResource(workspaceId, resourceId, input);

  if (updated) {
    emitWorkspaceWebhook(workspaceId, "resource.updated", updated as unknown as Record<string, unknown>).catch(() => {});

    recordAuditEvent({
      workspaceId,
      actorId: userId,
      action: "resource.updated",
      entityType: "resource",
      entityId: resourceId,
      entityName: updated.name,
      details: { changes: Object.keys(input) },
    }).catch(() => {});

    if (previous) {
      const amountChanged =
        input.amountMinor !== undefined && input.amountMinor !== previous.amountMinor;
      const cadenceChanged =
        input.billingCycle !== undefined && input.billingCycle !== previous.billingCycle;
      const currencyChanged =
        input.currency !== undefined &&
        input.currency.toUpperCase() !== (previous.currency || "USD").toUpperCase();

      if (amountChanged || cadenceChanged || currencyChanged) {
        const newAmountMinor =
          input.amountMinor !== undefined ? (input.amountMinor ?? 0) : (previous.amountMinor ?? 0);
        const newBillingCycle =
          input.billingCycle !== undefined ? input.billingCycle : previous.billingCycle;
        const currency = (input.currency || previous.currency || "USD").toUpperCase();

        recordResourceCostChange({
          resourceId,
          workspaceId,
          previousAmountMinor: previous.amountMinor,
          newAmountMinor,
          currency,
          previousBillingCycle: previous.billingCycle,
          newBillingCycle,
          changedByUserId: userId,
          changeReason: input.changeReason || null,
        })
          .then((costEntry) => {
            if (costEntry.changePercentage > 0) {
              recordAuditEvent({
                workspaceId,
                actorId: userId,
                action: "resource.price_increased",
                entityType: "resource",
                entityId: resourceId,
                entityName: updated.name,
                details: {
                  previousAmountMinor: previous.amountMinor,
                  newAmountMinor,
                  previousBillingCycle: previous.billingCycle,
                  newBillingCycle,
                  changePercentage: costEntry.changePercentage,
                  changePercentageBps: costEntry.changePercentageBps,
                  reason: input.changeReason || null,
                },
              }).catch(() => {});

              emitWorkspaceWebhook(workspaceId, "resource.price_changed", {
                resourceId,
                resourceName: updated.name,
                previousAmountMinor: previous.amountMinor,
                newAmountMinor,
                currency,
                previousBillingCycle: previous.billingCycle,
                newBillingCycle,
                changePercentage: costEntry.changePercentage,
                changeReason: input.changeReason || null,
              }).catch(() => {});

              dispatchPriceIncreaseChatAlert(workspaceId, {
                resourceId,
                resourceName: updated.name,
                previousAmountMinor: previous.amountMinor,
                newAmountMinor,
                currency,
                previousBillingCycle: previous.billingCycle,
                newBillingCycle,
                changePercentage: costEntry.changePercentage,
                changeReason: input.changeReason || null,
                appUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
              }).catch(() => {});
            }
          })
          .catch((err) => {
            console.error("Failed to record resource cost change:", err);
          });
      }
    }
  }

  return updated;
}