import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface EditOfferingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOfferingPage({
  params,
}: EditOfferingPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-8 max-w-3xl">
      <AdminHeader
        title="Edit Offering"
        description={`Update offering details for ID: ${id}`}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/dashboard/offerings">
              <Button variant="ghost">Cancel</Button>
            </Link>
            <Button variant="danger" size="md">
              Deactivate Offering
            </Button>
          </div>
        }
      />

      <form className="space-y-8">
        <Card>
          <CardContent className="space-y-6">
            <Input
              label="Offering Title *"
              id="title"
              defaultValue="Character Portrait / Bust"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Starting Price"
                id="price_from"
                type="number"
                defaultValue={500000}
              />
              <Input
                label="Currency Code"
                id="price_currency"
                defaultValue="IDR"
                maxLength={3}
              />
            </div>

            <Textarea
              label="Description *"
              id="description"
              rows={4}
              defaultValue="Detailed character portrait with lighting, expression, and textured render on abstract or solid backdrop."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Display Order"
                id="display_order"
                type="number"
                defaultValue={1}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <Link href="/dashboard/offerings">
            <Button variant="ghost">Back</Button>
          </Link>
          <Button variant="primary" type="button">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
