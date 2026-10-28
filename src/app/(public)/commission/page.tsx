import Link from "next/link";
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
    return "Price on inquiry";
  }
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return currency + " " + amount.toLocaleString();
  }
}

function formatStartingPrice(amount: number | null, currency: string = "IDR"): string {
  return amount === null || amount === undefined
    ? "Price on inquiry"
    : "From " + formatPrice(amount, currency);
}

export default async function CommissionPage({ searchParams }: CommissionPageProps) {
  const params = searchParams ? await searchParams : {};
  const selectedOfferingSlug = params.offering || "";

  const [profile, offeringsResult] = await Promise.all([
    getPublicProfile(),
    getActiveCommissionOfferings(),
  ]);

  const offerings = offeringsResult.offerings;
  const isClosed = profile.commission_availability === "closed";
  const isWaitlist = profile.commission_availability === "waitlist";
  const availabilityMessage = profile.availability_message?.trim();
  const defaultOfferingId =
    offerings.find((offering) => offering.slug === selectedOfferingSlug)?.id || "";

  const availabilityLabel =
    profile.commission_availability === "open"
      ? "Commissions Open"
      : isWaitlist
        ? "Waitlist Only"
        : "Currently Closed";

  return (
    <main className="mx-auto w-full max-w-6xl space-y-16 px-4 py-12 sm:px-6 md:space-y-20 md:py-16 lg:px-8">
      <section
        aria-labelledby="commission-title"
        className="grid grid-cols-1 gap-8 border-b border-border pb-10 md:gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end"
      >
        <div className="max-w-3xl space-y-4">
          <span className="block text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-accent">
            Commission / Project Inquiries
          </span>
          <h1
            id="commission-title"
            className="font-sans text-4xl leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            Commission Inquiries
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-ink-soft">
            Explore the available offerings, then tell me about the artwork you have in mind.
            Every submission is a non-binding inquiry for consideration, not a confirmed booking.
          </p>
        </div>

        <aside className="min-w-0 lg:justify-self-end lg:pb-1">
          <div className="space-y-3 border-l-2 border-accent pl-4">
            <Badge variant={profile.commission_availability}>
              {availabilityLabel}
            </Badge>
            {availabilityMessage ? (
              <p className="max-w-sm text-sm leading-relaxed text-text-muted">
                {availabilityMessage}
              </p>
            ) : null}
          </div>
        </aside>
      </section>

      <section aria-labelledby="offerings-title" className="space-y-6 md:space-y-8">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <span className="block text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-accent">
              01 / Offerings
            </span>
            <h2 id="offerings-title" className="font-sans text-2xl tracking-tight text-ink sm:text-3xl">
              Commission Offerings
            </h2>
          </div>
          {offerings.length > 0 ? (
            <span className="text-xs text-text-muted">Starting prices in IDR unless noted</span>
          ) : null}
        </div>

        {offeringsResult.state === "available" ? (
          <div>
            {offerings.map((offering, index) => (
              <article
                key={offering.id}
                className="grid grid-cols-1 gap-4 border-b border-border py-6 first:border-t-0 sm:py-7 md:grid-cols-[2rem_minmax(0,1fr)_12rem] md:gap-6 lg:gap-8"
              >
                <span className="pt-1 text-xs font-mono tabular-nums text-text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 space-y-2">
                  <h3 className="font-sans text-xl leading-snug text-ink sm:text-2xl">
                    {offering.title}
                  </h3>
                  <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-text-muted">
                    {offering.description}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between md:flex-col md:items-start md:justify-center md:border-t-0 md:pt-0">
                  <p className="text-sm font-medium text-ink">
                    {formatStartingPrice(offering.price_from, offering.price_currency)}
                  </p>
                  {!isClosed ? (
                    <Link
                      href={"/commission?offering=" + encodeURIComponent(offering.slug) + "#inquiry"}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-accent underline-offset-4 transition-colors hover:text-accent-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                      aria-label={"Choose " + offering.title + " and continue to the inquiry form"}
                    >
                      Choose this offering <span aria-hidden="true">↗</span>
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border-y border-border py-7 sm:py-8">
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
              {offeringsResult.state === "unavailable"
                ? "The current offering list could not be loaded. Please check back later for confirmed services and pricing."
                : "No standard offerings are currently listed."}
            </p>
            {!isClosed && offeringsResult.state === "empty" ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
                You can still describe a custom project in the inquiry form below.
              </p>
            ) : null}
            {!isClosed && offeringsResult.state === "unavailable" ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
                You can still submit a custom project inquiry below while commission intake is open.
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section
        id="inquiry"
        aria-labelledby="inquiry-title"
        className="scroll-mt-8 border-t border-border pt-12 md:pt-16"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(15rem,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
          <div className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            <span className="block text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-accent">
              02 / Project Brief
            </span>
            <h2 id="inquiry-title" className="font-sans text-2xl leading-tight tracking-tight text-ink sm:text-3xl">
              Tell Me About Your Project
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-text-muted">
              Share the essential details and choose a listed offering or describe a custom project.
              The brief helps the artist assess your request before any booking is confirmed.
            </p>
            <p className="border-l border-border-strong pl-3 text-xs leading-relaxed text-text-muted">
              Non-binding inquiry. No payment is collected through this form.
            </p>
          </div>

          <div className="min-w-0">
            {isClosed ? (
              <div className="space-y-3 border-y border-border py-8" role="status">
                <h3 className="font-sans text-xl text-ink">Commissions Are Currently Closed</h3>
                <p className="max-w-xl text-sm leading-relaxed text-text-muted">
                  New commission inquiries are not being accepted at this time. Please check back later for availability updates.
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
      </section>
    </main>
  );
}
