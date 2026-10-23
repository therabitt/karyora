import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/Button";
import { OfferingNewForm } from "@/components/dashboard/OfferingNewForm";

export default function NewOfferingPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <AdminHeader
        title="Create Commission Offering"
        description="Add a new commission offering type to the public portfolio."
        actions={
          <Link href="/dashboard/offerings">
            <Button variant="ghost">Cancel</Button>
          </Link>
        }
      />

      <OfferingNewForm />
    </div>
  );
}
