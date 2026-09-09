"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface ResourceData {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  status: string;
  description: string | null;
  provider: string | null;
  websiteUrl: string | null;
  amountMinor: number | null;
  currency: string;
  billingCycle: string;
  renewalDate: Date | string | null;
  autoRenew: boolean;
}

interface ResourceDetailsActionsProps {
  resource: ResourceData;
  workspaceId: string;
}

export function ResourceDetailsActions({
  resource,
  workspaceId,
}: ResourceDetailsActionsProps) {
  const router = useRouter();

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form states for edit
  const [name, setName] = useState(resource.name);
  const [type, setType] = useState(resource.type);
  const [provider, setProvider] = useState(resource.provider || "");
  const [websiteUrl, setWebsiteUrl] = useState(resource.websiteUrl || "");
  const [amount, setAmount] = useState(
    resource.amountMinor !== null ? (resource.amountMinor / 100).toString() : ""
  );
  const [currency, setCurrency] = useState(resource.currency || "USD");
  const [billingCycle, setBillingCycle] = useState(resource.billingCycle || "yearly");
  const [status, setStatus] = useState(resource.status || "active");
  const [renewalDate, setRenewalDate] = useState(
    resource.renewalDate
      ? new Date(resource.renewalDate).toISOString().split("T")[0]
      : ""
  );
  const [autoRenew, setAutoRenew] = useState(resource.autoRenew ?? true);
  const [description, setDescription] = useState(resource.description || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
  };
  const activeCurrencySymbol = currencySymbols[currency] || "$";

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const parsedAmountMinor =
        amount.trim() !== "" ? Math.round(parseFloat(amount) * 100) : null;

      const payload = {
        name,
        type,
        provider: provider.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        amountMinor: parsedAmountMinor,
        currency,
        billingCycle,
        status,
        renewalDate: renewalDate ? new Date(renewalDate).toISOString() : null,
        autoRenew,
        description: description.trim() || null,
      };

      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resource.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to update resource");
      }

      setEditModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resource.id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to delete resource");
      }

      router.push("/resources");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete resource");
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Top Action Buttons matching 07_resource_details_page.jpg */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditModalOpen(true)}
          className="rounded-xl border-border/80 shadow-2xs gap-1.5 text-xs font-semibold hover:bg-muted/70 cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteModalOpen(true)}
          className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/60 shadow-2xs gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
          <span>Delete</span>
        </Button>
      </div>

      {/* Edit Resource Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-foreground">Edit Resource</h3>
                <p className="text-xs text-muted-foreground">
                  Update renewal terms, pricing, or provider details for {resource.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resource Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Resource Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                {/* Resource Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="domain">Domain</option>
                    <option value="subscription">Subscription</option>
                    <option value="ssl_certificate">SSL Certificate</option>
                    <option value="hosting">Hosting</option>
                    <option value="cloud_service">Cloud Service</option>
                    <option value="software_license">Software License</option>
                    <option value="custom">Other</option>
                  </select>
                </div>

                {/* Provider */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Provider / Registrar
                  </label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="e.g. GoDaddy, AWS, Google"
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      {activeCurrencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="12.99"
                      className="w-full pl-8 pr-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="USD">USD - $</option>
                    <option value="INR">INR - ₹</option>
                    <option value="EUR">EUR - €</option>
                    <option value="GBP">GBP - £</option>
                  </select>
                </div>

                {/* Billing Cycle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Billing Cycle
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="yearly">Yearly / Annual</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="one_time">One-time</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>

                {/* Next Renewal Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Next Renewal Date
                  </label>
                  <input
                    type="date"
                    value={renewalDate}
                    onChange={(e) => setRenewalDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Website URL / Nameservers */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Website URL or Host Nameserver
                </label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://duesora.com or ns1.godaddy.com"
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Auto Renew Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoRenewEdit"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-border text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="autoRenewEdit" className="text-xs font-medium text-foreground cursor-pointer">
                  Auto-renew enabled for this asset
                </label>
              </div>

              {/* Description / Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Notes / Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add internal notes, purpose or owner details..."
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-md bg-card border border-border/80 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">
                Delete &ldquo;{resource.name}&rdquo;?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to permanently delete this resource from your workspace? This action cannot be undone and will remove all scheduled renewal notifications.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="rounded-xl text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
