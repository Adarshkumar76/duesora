"use client";

import { useState } from "react";
import {
  Globe,
  CreditCard,
  Cloud,
  Server,
  Shield,
  FileCode,
  FileText,
  KeyRound,
} from "lucide-react";

const VENDOR_DOMAINS: Record<string, string> = {
  github: "github.com",
  slack: "slack.com",
  google: "google.com",
  gsuite: "google.com",
  aws: "aws.amazon.com",
  amazon: "aws.amazon.com",
  azure: "azure.microsoft.com",
  microsoft: "microsoft.com",
  office: "microsoft.com",
  figma: "figma.com",
  notion: "notion.so",
  vercel: "vercel.com",
  stripe: "stripe.com",
  openai: "openai.com",
  chatgpt: "openai.com",
  supabase: "supabase.com",
  cloudflare: "cloudflare.com",
  zoom: "zoom.us",
  datadog: "datadoghq.com",
  atlassian: "atlassian.com",
  jira: "atlassian.com",
  confluence: "atlassian.com",
  linear: "linear.app",
  dropbox: "dropbox.com",
  hubspot: "hubspot.com",
  salesforce: "salesforce.com",
  digitalocean: "digitalocean.com",
  heroku: "heroku.com",
  mailchimp: "mailchimp.com",
  adobe: "adobe.com",
  canva: "canva.com",
  sentry: "sentry.io",
  mongodb: "mongodb.com",
  docker: "docker.com",
  postman: "postman.com",
  loom: "loom.com",
  miro: "miro.com",
  resend: "resend.com",
  twilio: "twilio.com",
  gitlab: "gitlab.com",
  bitbucket: "bitbucket.org",
  auth0: "auth0.com",
  clerk: "clerk.com",
  render: "render.com",
  fly: "fly.io",
  netlify: "netlify.com",
};

interface VendorLogoProps {
  name: string;
  type?: string;
  domain?: string | null;
  className?: string;
  size?: number;
}

export function VendorLogo({
  name,
  type = "subscription",
  domain,
  className = "w-7 h-7 rounded-lg",
  size = 16,
}: VendorLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Extract or infer domain
  let targetDomain = domain?.trim();

  if (!targetDomain) {
    const lowerName = name.toLowerCase().trim();
    // Check if name is already a domain
    if (lowerName.includes(".") && !lowerName.includes(" ")) {
      targetDomain = lowerName.replace(/^https?:\/\//, "").split("/")[0];
    } else {
      // Check known brand keywords
      for (const [key, brandDomain] of Object.entries(VENDOR_DOMAINS)) {
        if (lowerName.includes(key)) {
          targetDomain = brandDomain;
          break;
        }
      }
    }
  }

  // Render Fallback Icon
  const renderFallbackIcon = () => {
    switch (type) {
      case "domain":
        return <Globe className="text-emerald-600 dark:text-emerald-400" style={{ width: size, height: size }} />;
      case "ssl_certificate":
        return <Shield className="text-emerald-600 dark:text-emerald-400" style={{ width: size, height: size }} />;
      case "cloud_service":
        return <Cloud className="text-sky-600 dark:text-sky-400" style={{ width: size, height: size }} />;
      case "hosting":
        return <Server className="text-indigo-600 dark:text-indigo-400" style={{ width: size, height: size }} />;
      case "software_license":
        return <KeyRound className="text-amber-600 dark:text-amber-400" style={{ width: size, height: size }} />;
      case "contract":
        return <FileText className="text-purple-600 dark:text-purple-400" style={{ width: size, height: size }} />;
      case "document":
        return <FileCode className="text-muted-foreground" style={{ width: size, height: size }} />;
      case "subscription":
      default:
        return <CreditCard className="text-blue-600 dark:text-blue-400" style={{ width: size, height: size }} />;
    }
  };

  if (targetDomain && !imageError) {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(targetDomain)}&sz=128`;
    return (
      <div
        className={`flex items-center justify-center bg-card border border-border/70 shrink-0 overflow-hidden shadow-2xs ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faviconUrl}
          alt={name}
          className="w-full h-full object-contain p-1 rounded-sm"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-muted/60 border border-border/60 shrink-0 shadow-2xs ${className}`}
    >
      {renderFallbackIcon()}
    </div>
  );
}
