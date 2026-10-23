import { AdminHeader } from "@/components/layout/AdminHeader";
import { ProfileSettingsForm } from "@/components/dashboard/ProfileSettingsForm";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminProfile } from "@/lib/data/profile";

export default async function AdminSettingsPage() {
  const adminContext = await requireAdmin();
  const profile = await getAdminProfile(adminContext.adminUserId);

  return (
    <div className="space-y-8 max-w-4xl">
      <AdminHeader
        title="Studio Settings"
        description="Manage artist identity, public profile details, and commission availability mode."
      />

      <ProfileSettingsForm profile={profile} />
    </div>
  );
}
