import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/Button";
import { OfferingEditForm } from "@/components/dashboard/OfferingEditForm";
import { getAdminOfferingById } from "@/lib/data/offerings";

interface EditOfferingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOfferingPage({
  params,
}: EditOfferingPageProps) {
  const { id } = await params;
  const offering = await getAdminOfferingById(id);

  if (!offering) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <AdminHeader
        title={`Edit Offering: ${offering.title}`}
        description={`Update baseline pricing, description, and status for slug: ${offering.slug}`}
        actions={
          <Link href="/dashboard/offerings">
            <Button variant="ghost">Back to Offerings</Button>
          </Link>
        }
      />

      <OfferingEditForm offering={offering} />
    </div>
  );
}
