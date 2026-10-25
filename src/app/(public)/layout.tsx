import { PublicLayoutShell } from "@/components/layout/PublicLayoutShell";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicLayoutShell>{children}</PublicLayoutShell>;
}
