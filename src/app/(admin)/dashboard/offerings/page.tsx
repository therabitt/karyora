import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function AdminOfferingsPage() {
  return (
    <div className="space-y-8">
      <AdminHeader
        title="Commission Offerings"
        description="Configure advertised commission types, starting prices, and availability status."
        actions={
          <Link href="/dashboard/offerings/new">
            <Button variant="primary">New Offering</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted border-b border-border text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="p-4">Offering Title</th>
                <th className="p-4">Starting Price</th>
                <th className="p-4">Status</th>
                <th className="p-4">Order</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  id: "off-1",
                  title: "Character Portrait / Bust",
                  price: "IDR 500,000",
                  active: true,
                  order: 1,
                },
                {
                  id: "off-2",
                  title: "Half-Body Illustration",
                  price: "IDR 900,000",
                  active: true,
                  order: 2,
                },
                {
                  id: "off-3",
                  title: "Full Illustration & Environment",
                  price: "IDR 1,500,000",
                  active: true,
                  order: 3,
                },
              ].map((offering) => (
                <tr key={offering.id} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-ink">{offering.title}</p>
                  </td>
                  <td className="p-4 text-text-muted">{offering.price}</td>
                  <td className="p-4">
                    <Badge variant={offering.active ? "open" : "closed"}>
                      {offering.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4 text-text-muted font-mono">{offering.order}</td>
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
        </CardContent>
      </Card>
    </div>
  );
}
