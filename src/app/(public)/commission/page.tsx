import { Badge } from "@/components/ui/Badge";
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 w-full space-y-16">
      {/* Commission Editorial Header */}
      <div className="border-b border-border pb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
              Bespoke Works & Inquiries
            </span>
            <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight">
              Commission Inquiries
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={profile.commission_availability}>
              {profile.commission_availability === "open"
                ? "● Commissions Open"
                : isWaitlist
                ? "● Waitlist Only"
                : "○ Currently Closed"}
            </Badge>
          </div>
        </div>
        <p className="text-base text-ink-soft leading-relaxed max-w-2xl font-normal">
          {profile.bio
            ? `${profile.display_name} accepts personal character illustrations, key visuals, and custom artwork projects. Explore the cataloged offerings below and submit an inquiry for consideration.`
            : "I accept personal character commissions, editorial illustrations, and custom visual projects. Please review the offerings below and submit an inquiry with your project details."}
        </p>
      </div>

      {/* Offerings Section */}
      <div className="space-y-8">
        <div className="flex items-baseline justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
              01 / Standard Catalog
            </span>
            <h2 className="font-sans text-2xl sm:text-3xl text-ink">Commission Offerings</h2>
          </div>
          <span className="text-xs font-mono text-text-muted">
            Starting Baselines
          </span>
        </div>

        {offerings.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-border">
            <p className="text-sm text-text-muted">
              No specific offerings are currently cataloged. You may still submit a custom project inquiry below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {offerings.map((offering) => {
              const formattedStartingPrice = formatPrice(offering.price_from, offering.price_currency);
              return (
                <div
                  key={offering.id}
                  className="bg-surface border border-border p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-ink/40 transition-colors shadow-xs"
                >
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-accent font-semibold block">
                      From {formattedStartingPrice}
                    </span>
                    <h3 className="font-sans text-2xl text-ink">{offering.title}</h3>
                    <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line pt-1">
                      {offering.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border/80 flex items-center justify-between text-[11px] font-mono text-text-muted">
                    <span>Base Tier</span>
                    <span className="text-accent font-semibold">Available</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Commission Inquiry Form Section */}
      <div className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
              02 / Consideration Form
            </span>
            <h2 className="font-sans text-2xl sm:text-3xl text-ink">Submit an Inquiry</h2>
          </div>
          <span className="text-xs font-mono text-text-muted">
            Strictly Non-Binding
          </span>
        </div>

        <div className="bg-surface border border-border p-6 sm:p-12 max-w-3xl shadow-xs">
          {isClosed ? (
            <div className="p-8 border border-border bg-surface-muted text-center space-y-3">
              <p className="font-sans text-xl text-ink">Commissions Are Currently Closed</p>
              <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
                The artist is not currently accepting new commission inquiries. Please check back later or follow social announcements for upcoming queue reopenings.
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
    </div>
  );
}