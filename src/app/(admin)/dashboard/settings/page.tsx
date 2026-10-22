import { AdminHeader } from "@/components/layout/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <AdminHeader
        title="Studio Settings"
        description="Manage artist identity, public profile details, and commission availability."
      />

      <form className="space-y-8">
        {/* Commission Availability Settings */}
        <Card>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-serif text-lg text-ink">Commission Availability</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Controls whether visitors can submit new inquiries on the commission page.
                </p>
              </div>
              <Badge variant="open">Currently Open</Badge>
            </div>

            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider font-semibold text-text-muted">
                Availability Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-border-strong bg-surface cursor-pointer hover:bg-surface-muted/50">
                  <input
                    type="radio"
                    name="commission_availability"
                    value="open"
                    defaultChecked
                    className="mt-1"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-ink">Open</span>
                    <span className="block text-xs text-text-muted mt-0.5">
                      Accepting new inquiries directly.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface cursor-pointer hover:bg-surface-muted/50">
                  <input
                    type="radio"
                    name="commission_availability"
                    value="waitlist"
                    className="mt-1"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-ink">Waitlist</span>
                    <span className="block text-xs text-text-muted mt-0.5">
                      Queued for future consideration.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface cursor-pointer hover:bg-surface-muted/50">
                  <input
                    type="radio"
                    name="commission_availability"
                    value="closed"
                    className="mt-1"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-ink">Closed</span>
                    <span className="block text-xs text-text-muted mt-0.5">
                      Inquiry submission disabled.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <Input
              label="Public Availability Message (Optional)"
              id="availability_message"
              placeholder="Leave blank to use default: Commissions are currently open."
              helperText="State-safe default is used if left blank (max 300 characters)."
            />
          </CardContent>
        </Card>

        {/* Public Artist Profile Settings */}
        <Card>
          <CardContent className="space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="font-serif text-lg text-ink">Public Artist Profile</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Exhibited on the public portfolio home and contact pages.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Display Name *"
                id="display_name"
                defaultValue="Karyora Artist"
                required
              />
              <Input
                label="Public Contact Email"
                id="contact_email"
                type="email"
                defaultValue="artist@karyora.internal"
              />
            </div>

            <Textarea
              label="Biography"
              id="bio"
              rows={4}
              defaultValue="Independent digital painter and illustrator focusing on character design, worldbuilding, and traditional art studies."
              helperText="Maximum 2,000 characters."
            />

            <div className="space-y-4 border-t border-border pt-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                Social & Portfolio Links (JSONB / HTTPS)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Twitter / X"
                  id="social_twitter"
                  placeholder="https://x.com/username"
                />
                <Input
                  label="Instagram"
                  id="social_instagram"
                  placeholder="https://instagram.com/username"
                />
                <Input
                  label="ArtStation"
                  id="social_artstation"
                  placeholder="https://artstation.com/username"
                />
                <Input
                  label="Cara"
                  id="social_cara"
                  placeholder="https://cara.app/username"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button variant="primary" size="lg" type="button">
            Save Profile & Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
