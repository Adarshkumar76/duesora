import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation",
  description: "Interactive OpenAPI 3.1 REST API documentation and developer playground for Duesora.",
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
