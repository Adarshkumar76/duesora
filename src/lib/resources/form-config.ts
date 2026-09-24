export interface ResourceTypeConfig {
  typeLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  nameHelp?: string;
  urlLabel: string;
  urlPlaceholder: string;
  urlHelper: string;
  urlRequiredForHealthChecks?: boolean;
  providerLabel: string;
  providerPlaceholder: string;
  categoryPlaceholder: string;
  isDomainOrCert: boolean;
  costLabel?: string;
}

export function getResourceTypeConfig(type: string): ResourceTypeConfig {
  switch (type) {
    case "domain":
      return {
        typeLabel: "Domain",
        nameLabel: "Domain Name",
        namePlaceholder: "e.g. duesora.com or google.com",
        nameHelp: "The apex or subdomain being tracked.",
        urlLabel: "Website URL / Hostname to Monitor & Test",
        urlPlaceholder: "e.g. google.com or https://google.com",
        urlHelper: "Used for automated SSL/TLS certificate, DNS resolution, and HTTP uptime health checks. Supports google.com or https://google.com.",
        urlRequiredForHealthChecks: true,
        providerLabel: "Domain Registrar / DNS Provider",
        providerPlaceholder: "e.g. GoDaddy, Namecheap, Cloudflare, Route 53",
        categoryPlaceholder: "e.g. Infrastructure, Marketing Domains",
        isDomainOrCert: true,
        costLabel: "Renewal Cost",
      };

    case "ssl_certificate":
      return {
        typeLabel: "SSL Certificate",
        nameLabel: "Certificate Common Name / Domain",
        namePlaceholder: "e.g. duesora.com or *.duesora.com",
        nameHelp: "Primary domain or wildcard name covered by the certificate.",
        urlLabel: "Target Hostname to Probe & Verify",
        urlPlaceholder: "e.g. duesora.com or https://duesora.com",
        urlHelper: "The target endpoint probed for SSL handshake, expiration alerting, and TLS cipher verification.",
        urlRequiredForHealthChecks: true,
        providerLabel: "Certificate Authority / Issuer",
        providerPlaceholder: "e.g. Let's Encrypt, DigiCert, Sectigo, Cloudflare",
        categoryPlaceholder: "e.g. Security, SSL/TLS",
        isDomainOrCert: true,
        costLabel: "Certificate Fee",
      };

    case "subscription":
      return {
        typeLabel: "Subscription",
        nameLabel: "Subscription / Product Name",
        namePlaceholder: "e.g. GitHub Enterprise, Slack Pro, Figma Org",
        urlLabel: "Service URL / Login Portal",
        urlPlaceholder: "e.g. https://slack.com or app.figma.com",
        urlHelper: "Web address or admin portal for quick access and tracking.",
        providerLabel: "Vendor / Service Provider",
        providerPlaceholder: "e.g. Slack Technologies, GitHub Inc., Figma",
        categoryPlaceholder: "e.g. SaaS, Collaboration, Dev Tools",
        isDomainOrCert: false,
        costLabel: "Subscription Cost",
      };

    case "hosting":
      return {
        typeLabel: "Hosting",
        nameLabel: "Server / Hosting Name",
        namePlaceholder: "e.g. Production Web Cluster, US-East VPS",
        urlLabel: "Server Hostname or Console URL",
        urlPlaceholder: "e.g. server1.duesora.com or https://cloud.digitalocean.com",
        urlHelper: "Server hostname, IP, or hosting management portal URL.",
        providerLabel: "Hosting Provider",
        providerPlaceholder: "e.g. DigitalOcean, Hetzner, AWS, Linode",
        categoryPlaceholder: "e.g. Hosting, Compute, Production",
        isDomainOrCert: false,
        costLabel: "Hosting Cost",
      };

    case "cloud_service":
      return {
        typeLabel: "Cloud Service",
        nameLabel: "Service / Account Name",
        namePlaceholder: "e.g. AWS Production Account, GCP BigQuery Cluster",
        urlLabel: "Management Console URL / Endpoint",
        urlPlaceholder: "e.g. https://console.aws.amazon.com or https://console.cloud.google.com",
        urlHelper: "Cloud management console or API service endpoint URL.",
        providerLabel: "Cloud Provider",
        providerPlaceholder: "e.g. Amazon Web Services (AWS), Google Cloud, Microsoft Azure",
        categoryPlaceholder: "e.g. Cloud Infrastructure, Data Engineering",
        isDomainOrCert: false,
        costLabel: "Estimated Spend",
      };

    case "software_license":
      return {
        typeLabel: "Software License",
        nameLabel: "Software / Tool Name",
        namePlaceholder: "e.g. JetBrains All Products, Windows Server CAL",
        urlLabel: "License Portal / Download URL",
        urlPlaceholder: "e.g. https://account.jetbrains.com or https://admin.microsoft.com",
        urlHelper: "Customer licensing portal or vendor account management page.",
        providerLabel: "Software Publisher / Vendor",
        providerPlaceholder: "e.g. JetBrains, Microsoft, Adobe",
        categoryPlaceholder: "e.g. Development Tools, Desktop Licenses",
        isDomainOrCert: false,
        costLabel: "License Fee",
      };

    default:
      return {
        typeLabel: "Resource",
        nameLabel: "Resource Name",
        namePlaceholder: "e.g. Office Lease Contract, AppleCare Warranty",
        urlLabel: "Website URL / Reference Link",
        urlPlaceholder: "e.g. https://portal.example.com",
        urlHelper: "Associated website URL or reference link for documentation.",
        providerLabel: "Provider / Vendor",
        providerPlaceholder: "e.g. Vendor name or organization",
        categoryPlaceholder: "e.g. Operations, Legal, Hardware",
        isDomainOrCert: false,
        costLabel: "Renewal Cost",
      };
  }
}
