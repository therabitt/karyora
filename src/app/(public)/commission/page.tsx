import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commissions",
  description: "Commission offerings, pricing guide, and inquiry submission.",
};

const offerings = [
  {
    id: "offering-1",
    title: "Character Portrait / Bust",
    price: "IDR 500,000",
    description: "Detailed character portrait with lighting, expression, and textured render on abstract or solid backdrop.",
  },
  {
    id: "offering-2",
    title: "Half-Body Illustration",
    price: "IDR 900,000",
    description: "Dynamic half-body framing including costume design, props, and thematic atmosphere.",
  },
  {
    id: "offering-3",
    title: "Full Illustration & Environment",
    price: "IDR 1,500,000",
    description: "Complete key-visual or book illustration with integrated perspective environment and narrative lighting.",
  },
];

export default function CommissionPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 w-full space-y-16">
      {/* Commission Header & Availability */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2">
          <Badge variant="open">Currently Open</Badge>
          <span className="text-xs text-text-muted">Estimated turnaround: 2–4 weeks</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl text-ink">
          Commission Inquiries
        </h1>
        <p className="text-base text-ink-soft leading-relaxed">
          I accept personal character commissions, editorial illustrations, and custom visual projects. Please review the offerings below and submit an inquiry with your project details.
        </p>
      </div>

      {/* Offerings Section */}
      <div className="space-y-6">
        <h2 className="font-serif text-2xl text-ink">Commission Offerings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {offerings.map((offering) => (
            <Card key={offering.id} className="flex flex-col justify-between">
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                    Starting from {offering.price}
                  </span>
                  <h3 className="font-serif text-xl text-ink">{offering.title}</h3>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">
                  {offering.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Commission Inquiry Form Shell */}
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-10 max-w-3xl space-y-8">
        <div className="space-y-2 border-b border-border pb-6">
          <h2 className="font-serif text-2xl text-ink">Submit an Inquiry</h2>
          <p className="text-sm text-text-muted">
            Submitting this form is a request for consideration. It does not constitute a confirmed booking or payment obligation.
          </p>
        </div>

        <form className="space-y-6">
          {/* Honeypot field for bot suppression (hidden from humans) */}
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              name="hp_website_contact"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Your Name *"
              id="client_name"
              placeholder="e.g. Maya Lin"
              required
            />
            <Input
              label="Email Address *"
              id="client_email"
              type="email"
              placeholder="e.g. maya@example.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="offering_id" className="block text-sm font-medium text-ink">
              Selected Offering (Optional)
            </label>
            <select
              id="offering_id"
              className="w-full px-3.5 py-2 text-sm bg-surface rounded-lg border border-border-strong text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            >
              <option value="">Custom project / Not listed</option>
              {offerings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title} — from {o.price}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            label="Project Brief & Description *"
            id="description"
            rows={5}
            placeholder="Describe your character, desired mood, composition ideas, references, or intended usage..."
            helperText="Minimum 20 characters. Be as specific as helpful."
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Budget (IDR, Optional)"
              id="budget_amount"
              type="number"
              placeholder="e.g. 1000000"
            />
            <Input
              label="Desired Completion Date (Optional)"
              id="desired_deadline"
              type="date"
            />
          </div>

          {/* Privacy & Notice */}
          <div className="p-4 rounded-xl bg-surface-muted text-xs text-text-muted leading-relaxed space-y-1">
            <p className="font-medium text-ink">Privacy & Terms Notice</p>
            <p>
              Your contact details will only be used by the artist to evaluate and respond to your inquiry. Inquiries are subject to artist availability.
            </p>
          </div>

          <div>
            <Button variant="primary" size="lg" type="button">
              Send Commission Inquiry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
