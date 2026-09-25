import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an Account",
  description: "Create your free Duesora account to start tracking recurring commitments.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
