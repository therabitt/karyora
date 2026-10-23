import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { getAdminOfferings } from "@/lib/data/offerings";

function formatPrice(amount: number | null, currency: string = "IDR"): string {
  if (amount === null || amount === undefined) {
    return "On Inquiry";
  }
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export default async function AdminOfferingsPage() {
  const offerings = await getAdminOfferings();

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Commission Offerings"
        description="Configure advertised commission types, baseline pricing, and active status."
        actions={
          <Link href="/dashboard/offerings/new">
            <Button variant="primary">New Offering</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {offerings.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface-muted flex items-center justify-center text-text-muted">
                ✦
              </div>
              <div className="space-y-1">
                <p className="font-serif text-lg text-ink">No commission offerings found</p>
                <p className="text-xs text-text-muted">
                  Create your first commission offering to display on the public portfolio.
                </p>
              </div>
              <Link href="/dashboard/offerings/new">
                <Button variant="primary" size="sm">
                  Create First Offering
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead className="bg-surface-muted border-b border-border text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="p-4">Offering Title</th>
                  <th className="p-4">Starting Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Inquiries</th>
                  <th className="p-4 text-center">Order</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {offerings.map((offering) => (
                  <tr key={offering.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-ink">{offering.title}</p>
                      <p className="text-xs text-text-muted font-mono">{offering.slug}</p>
                    </td>
                    <td className="p-4 text-ink font-medium">
                      {formatPrice(offering.price_from, offering.price_currency)}
                    </td>
                    <td className="p-4">
                      <Badge variant={offering.is_active ? "open" : "closed"}>
                        {offering.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 text-center text-text-muted font-mono">
                      {offering.inquiry_count ?? 0}
                    </td>
                    <td className="p-4 text-center text-text-muted font-mono">
                      {offering.display_order}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/dashboard/offerings/${offering.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
