import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/Button";
import { InquiryDetailCard } from "@/components/dashboard/InquiryDetailCard";
import { getAdminInquiryById } from "@/lib/data/inquiries";

interface InquiryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InquiryDetailPage({
  params,
}: InquiryDetailPageProps) {
  const { id } = await params;
  const inquiry = await getAdminInquiryById(id);

  if (!inquiry) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <AdminHeader
        title={`Inquiry: ${inquiry.client_name}`}
        description={`Review project brief and update status for ${inquiry.offering_title_snapshot}`}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/dashboard/commissions">
              <Button variant="ghost">Back to Inbox</Button>
            </Link>
          </div>
        }
      />

      <InquiryDetailCard inquiry={inquiry} />
    </div>
  );
}
