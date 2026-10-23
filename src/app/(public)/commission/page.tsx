import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { CommissionInquiryForm } from "@/components/commissions/CommissionInquiryForm";
import { getPublicProfile } from "@/lib/data/profile";
import { getActiveCommissionOfferings } from "@/lib/data/offerings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commissions",
  description: "Commission offerings, pricing guide, and inquiry submission.",
};

interface CommissionPageProps {
  searchParams?: Promise<{ offering?: string }>;
}

function formatPrice(amount: number | null, currency: string = "IDR"): string {
  if (amount === null || amount === undefined) {
    return "Price on Inquiry";
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

export default async function CommissionPage({ searchParams }: CommissionPageProps) {
  const params = searchParams ? await searchParams : {};
  const selectedOfferingSlug = params.offering || "";

  const profile = await getPublicProfile();
  const offerings = await getActiveCommissionOfferings();

  const isClosed = profile.commission_availability === "closed";
  const isWaitlist = profile.commission_availability === "waitlist";
  const defaultOfferingId =
    offerings.find((o) => o.slug === selectedOfferingSlug)?.id || "";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 w-full space-y-16">
      {/* Commission Header & Availability */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2">
          <Badge variant={profile.commission_availability}>
            {profile.commission_availability === "open"
              ? "Commissions Open"
              : isWaitlist
              ? "Waitlist Only"
              : "Commissions Closed"}
          </Badge>
          <span className="text-xs text-text-muted">
            {profile.availability_message ||
              (isClosed
                ? "New commission requests are currently paused."
                : isWaitlist
                ? "Accepting inquiries for upcoming scheduling queues."
                : "Accepting new inquiries for personal and commercial projects.")}
          </span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl text-ink">
          Commission Inquiries
        </h1>
        <p className="text-base text-ink-soft leading-relaxed">
          {profile.bio
            ? `${profile.display_name} accepts personal character illustrations, key visuals, and custom artwork projects. Explore the offerings below and submit an inquiry with your project details.`
            : "I accept personal character commissions, editorial illustrations, and custom visual projects. Please review the offerings below and submit an inquiry with your project details."}
        </p>
      </div>

      {/* Offerings Section */}
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h2 className="font-serif text-2xl text-ink">Commission Offerings</h2>
          <p className="text-xs text-text-muted mt-1">
            Standard offering types and starting baseline pricing. Custom briefs are welcome.
          </p>
        </div>

        {offerings.length === 0 ? (
          <div className="p-8 text-center bg-surface-muted rounded-2xl border border-border">
            <p className="text-sm text-text-muted">
              No specific offerings are currently cataloged. You may still submit a custom project inquiry below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offerings.map((offering) => {
              const formattedStartingPrice = formatPrice(offering.price_from, offering.price_currency);
              return (
                <Card key={offering.id} className="flex flex-col justify-between hover:border-border-strong transition-all">
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                        Starting from {formattedStartingPrice}
                      </span>
                      <h3 className="font-serif text-xl text-ink">{offering.title}</h3>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                      {offering.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Commission Inquiry Form Section */}
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-10 max-w-3xl space-y-8">
        <div className="space-y-2 border-b border-border pb-6">
          <h2 className="font-serif text-2xl text-ink">Submit an Inquiry</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Submitting this inquiry is a request for artist consideration. It does not constitute a confirmed booking, agreement, or payment obligation.
          </p>
        </div>

        {isClosed ? (
          <div className="p-6 rounded-xl bg-surface-muted border border-border text-center space-y-2">
            <p className="font-medium text-ink">Commissions Are Currently Closed</p>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              The artist is not currently accepting new commission inquiries. Please check back later or subscribe to social announcements for reopening notices.
            </p>
          </div>
        ) : (
          <CommissionInquiryForm
            offerings={offerings}
            defaultOfferingId={defaultOfferingId}
            isWaitlist={isWaitlist}
          />
        )}
      </div>
    </div>
  );
}
