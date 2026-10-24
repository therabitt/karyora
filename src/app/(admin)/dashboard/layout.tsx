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
    <div className="min-h-screen bg-paper text-ink">
      <AdminSidebar />
      {/* Desktop: offset by sidebar width. Mobile: offset by top bar height */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1400px]">
          {children}
        </main>
      </div>
    </div>
  );
}
