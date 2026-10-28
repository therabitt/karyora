import Link from "next/link";
import { CommissionInquiryForm } from "@/components/commissions/CommissionInquiryForm";
import { getPublicProfile } from "@/lib/data/profile";
import { getActiveCommissionOfferings } from "@/lib/data/offerings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commissions",
  description: "Commission offerings, pricing, and project inquiry form.",
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
      ? "Commissions open"
      : isWaitlist
        ? "Waitlist inquiries"
        : "Commissions closed";

  return (
    <main className="w-full px-5 py-8 sm:px-8 sm:py-10 lg:px-14 lg:py-12 xl:px-20">
      <header className="space-y-5 border-b border-border pb-8 sm:pb-10">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-text-muted">
          Karyora / Commissions
        </p>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:gap-12">
          <div className="min-w-0 space-y-4">
            <h1
              id="commission-title"
              className="text-[clamp(2.8rem,5.6vw,5.8rem)] leading-[0.94] tracking-[-0.06em] text-ink"
            >
              Commission inquiries
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-ink-soft sm:text-base">
              Choose an offering, then share the brief for the artwork you have in mind.
              Every submission is an inquiry for consideration, not a confirmed booking.
            </p>
          </div>

          <div className="flex max-w-sm shrink-0 flex-col gap-2 sm:w-64 sm:pb-1 lg:w-72">
            <p className="flex items-center gap-2 text-xs font-medium text-ink">
              <span
                aria-hidden="true"
                className={isClosed ? "text-text-muted" : "text-success"}
              >
                ●
              </span>
              {availabilityLabel}
            </p>
            {availabilityMessage ? (
              <p className="text-sm leading-relaxed text-text-muted">{availabilityMessage}</p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12 pt-8 sm:pt-10 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.5fr)] lg:gap-12 xl:gap-20">
        <section aria-labelledby="offerings-title" className="min-w-0">
          <div className="space-y-2 pb-4">
            <h2 id="offerings-title" className="text-2xl tracking-tight text-ink sm:text-3xl">
              Available offerings
            </h2>
            {offerings.length > 0 ? (
              <p className="text-xs leading-relaxed text-text-muted">
                Select an offering to add it to your inquiry.
              </p>
            ) : null}
          </div>

          {offeringsResult.state === "available" ? (
            <div>
              {offerings.map((offering) => (
                <article
                  key={offering.id}
                  className="grid grid-cols-1 gap-4 border-t border-border py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6"
                >
                  <div className="min-w-0 space-y-2">
                    <h3 className="text-lg leading-snug text-ink sm:text-xl">{offering.title}</h3>
                    {offering.description ? (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">
                        {offering.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:flex-col sm:items-end sm:justify-start">
                    <p className="text-sm font-medium text-ink">
                      {formatStartingPrice(offering.price_from, offering.price_currency)}
                    </p>
                    {!isClosed ? (
                      <Link
                        href={"/commission?offering=" + encodeURIComponent(offering.slug) + "#inquiry"}
                        className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-accent underline decoration-border-strong underline-offset-4 transition-colors hover:text-accent-hover hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        aria-label={"Select " + offering.title + " for your inquiry"}
                      >
                        Select offering <span aria-hidden="true">↗</span>
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border-t border-border py-5">
              <p className="max-w-lg text-sm leading-relaxed text-text-muted">
                {offeringsResult.state === "unavailable"
                  ? "The current offering list could not be loaded. Please check back later for confirmed services and pricing."
                  : "No standard offerings are currently listed."}
              </p>
              {!isClosed ? (
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-muted">
                  You can still describe a custom project in the inquiry form.
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section
          id="inquiry"
          aria-labelledby="inquiry-title"
          className="min-w-0 scroll-mt-8 border-t border-border pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0 xl:pl-14"
        >
          <div className="mb-6 space-y-2">
            <h2 id="inquiry-title" className="text-2xl tracking-tight text-ink sm:text-3xl">
              Project inquiry
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
              Tell me what you need, what you have in mind, and any details that will help shape the work.
            </p>
          </div>

          {isClosed ? (
            <div className="space-y-3 border-y border-border py-6" role="status">
              <h3 className="text-lg text-ink">New inquiries are currently closed</h3>
              <p className="max-w-xl text-sm leading-relaxed text-text-muted">
                The form is unavailable while commission intake is closed. Please check back for updates.
              </p>
            </div>
          ) : (
            <CommissionInquiryForm
              offerings={offerings}
              defaultOfferingId={defaultOfferingId}
              isWaitlist={isWaitlist}
            />
          )}
        </section>
      </div>
    </main>
  );
}
