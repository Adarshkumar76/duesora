"use client";

import React, { useState, useEffect } from "react";

export type SettingsTabId =
  | "general"
  | "billing"
  | "team"
  | "notifications"
  | "security"
  | "integrations";

interface SettingsTabsViewProps {
  generalContent: React.ReactNode;
  billingContent: React.ReactNode;
  teamContent: React.ReactNode;
  notificationsContent: React.ReactNode;
  securityContent: React.ReactNode;
  integrationsContent: React.ReactNode;
}

const TABS: { id: SettingsTabId; label: string; description: string }[] = [
  {
    id: "general",
    label: "General",
    description: "Manage workspace details, account information, and workspace preferences",
  },
  {
    id: "billing",
    label: "Billing",
    description: "Manage monthly budget ceilings, currency sync, and spend thresholds",
  },
  {
    id: "team",
    label: "Team",
    description: "Manage team members, roles, and pending workspace invitations",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Configure renewal horizons, SMTP email delivery, and automated checks",
  },
  {
    id: "security",
    label: "Security",
    description: "Manage your password, authentication, and security preferences",
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Configure webhook dispatchers, chat alerts, and developer API keys",
  },
];

export function SettingsTabsView({
  generalContent,
  billingContent,
  teamContent,
  notificationsContent,
  securityContent,
  integrationsContent,
}: SettingsTabsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("general");

  useEffect(() => {
    // Read hash if available (e.g. #security, #team, #billing)
    const hash = window.location.hash.replace("#", "") as SettingsTabId;
    if (hash && TABS.some((t) => t.id === hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tabId}`);
    }
  };

  const currentTabInfo = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          {currentTabInfo.description}
        </p>
      </div>

      {/* Top Horizontal Tabs Bar */}
      <div className="border-b border-border/70 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-6 sm:gap-8 min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`pb-3 text-sm transition-all relative cursor-pointer font-medium ${
                  isActive
                    ? "text-emerald-700 dark:text-emerald-300 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "general" && <div className="space-y-6">{generalContent}</div>}
        {activeTab === "billing" && <div className="space-y-6">{billingContent}</div>}
        {activeTab === "team" && <div className="space-y-6">{teamContent}</div>}
        {activeTab === "notifications" && (
          <div className="space-y-6">{notificationsContent}</div>
        )}
        {activeTab === "security" && (
          <div className="space-y-6">{securityContent}</div>
        )}
        {activeTab === "integrations" && (
          <div className="space-y-6">{integrationsContent}</div>
        )}
      </div>
    </div>
  );
}
