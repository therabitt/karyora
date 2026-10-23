import { requireAdmin, AuthorizationError } from "@/lib/auth/admin";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await requireAdmin();
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }

    if (err instanceof AuthorizationError) {
      redirect("/login");
    }

    // Default fail closed redirect for unconfigured/unauthenticated access
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-paper text-ink">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
