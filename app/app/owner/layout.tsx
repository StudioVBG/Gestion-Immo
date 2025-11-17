"use client";

import { OwnerAppLayout } from "@/components/layout/owner-app-layout";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerAppLayout>{children}</OwnerAppLayout>;
}

