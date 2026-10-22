import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export default function NewOfferingPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <AdminHeader
        title="Create Commission Offering"
        description="Add a new offering type to the public commission page."
        actions={
          <Link href="/dashboard/offerings">
            <Button variant="ghost">Cancel</Button>
          </Link>
        }
      />

      <form className="space-y-8">
        <Card>
          <CardContent className="space-y-6">
            <Input
              label="Offering Title *"
              id="title"
              placeholder="e.g. Chibi Character Illustration"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Starting Price (Optional)"
                id="price_from"
                type="number"
                placeholder="e.g. 400000"
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
              placeholder="Describe deliverables, canvas dimensions, resolution, and what the client receives..."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Display Order"
                id="display_order"
                type="number"
                defaultValue={0}
                helperText="Lower numbers appear first on the public commission page."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <Link href="/dashboard/offerings">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button variant="primary" type="button">
            Save Offering
          </Button>
        </div>
      </form>
    </div>
  );
}
