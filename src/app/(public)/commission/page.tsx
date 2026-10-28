import Link from "next/link";
import { CommissionInquiryForm } from "@/components/commissions/CommissionInquiryForm";
import { EditorialPageHeader } from "@/components/layout/EditorialPageHeader";
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

function formatPrice(amount: number | null, currency = "IDR"): string {
  if (amount === null || amount === undefined) return "Price on inquiry";
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

function formatStartingPrice(amount: number | null, currency = "IDR"): string {
  return amount === null || amount === undefined ? "Price on inquiry" : "From " + formatPrice(amount, currency);
}

export default async function CommissionPage({ searchParams }: CommissionPageProps) {
  const params = searchParams ? await searchParams : {};
  const [profile, offeringsResult] = await Promise.all([
    getPublicProfile(),
    getActiveCommissionOfferings(),
  ]);
  const offerings = offeringsResult.offerings;
  const isClosed = profile.commission_availability === "closed";
  const isWaitlist = profile.commission_availability === "waitlist";
  const availabilityMessage = profile.availability_message?.trim();
  const defaultOfferingId = offerings.find((offering) => offering.slug === (params.offering || ""))?.id || "";
  const availabilityLabel = isClosed ? "Inquiries closed" : isWaitlist ? "Waitlist open" : "Inquiries open";

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <EditorialPageHeader />
      <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col px-5 pb-16 pt-5 sm:px-8 sm:pb-20 lg:px-14">
        <section aria-labelledby="commission-title" className="mx-auto w-full max-w-6xl">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-b border-border pb-5">
            <h1 id="commission-title" className="text-3xl leading-tight tracking-[-0.045em] sm:text-4xl lg:text-5xl">
              Commissions
            </h1>
            <p className="text-xs text-text-muted">
              <span className={isClosed ? "mr-2 text-text-muted" : "mr-2 text-success"} aria-hidden="true">●</span>
              {availabilityLabel}
            </p>
          </div>
          {availabilityMessage ? (
            <p className="max-w-2xl py-4 text-sm leading-relaxed text-text-muted">{availabilityMessage}</p>
          ) : null}
        </section>

        <section aria-labelledby="offerings-title" className="mx-auto mt-8 w-full max-w-6xl">
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
            <h2 id="offerings-title" className="text-xl tracking-tight sm:text-2xl">Offerings</h2>
            {offerings.length > 0 ? <span className="text-[11px] text-text-muted">{String(offerings.length).padStart(2, "0")} listed</span> : null}
          </div>
          {offeringsResult.state === "available" ? (
            <div>
              {offerings.map((offering, index) => (
                <article key={offering.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 gap-y-3 border-b border-border py-4 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center sm:gap-x-5 sm:py-5">
                  <span className="pt-1 font-mono text-[10px] text-text-muted">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <h3 className="text-lg leading-snug tracking-tight sm:text-xl">{offering.title}</h3>
                    {offering.description ? <p className="mt-1.5 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-text-muted">{offering.description}</p> : null}
                  </div>
                  <div className="col-start-2 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 sm:col-start-auto sm:flex-col sm:items-end sm:justify-center">
                    <p className="text-sm">{formatStartingPrice(offering.price_from, offering.price_currency)}</p>
                    {!isClosed ? <Link href={"/commission?offering=" + encodeURIComponent(offering.slug) + "#inquiry"} className="text-xs font-medium text-accent underline decoration-border-strong underline-offset-4 transition-colors hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={"Choose " + offering.title}>Choose offering ↗</Link> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border-b border-border py-5">
              <p className="text-sm text-text-muted">{offeringsResult.state === "unavailable" ? "Offerings are temporarily unavailable." : "No standard offerings are listed at the moment."}</p>
              {!isClosed ? <p className="mt-1 text-sm text-text-muted">You can still describe a custom project below.</p> : null}
            </div>
          )}
        </section>

        <section id="inquiry" aria-labelledby="inquiry-title" className="mx-auto mt-12 w-full max-w-6xl scroll-mt-6">
          <div className="grid grid-cols-1 gap-5 border-b border-border pb-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:items-end sm:gap-10">
            <h2 id="inquiry-title" className="text-2xl tracking-[-0.035em] sm:text-3xl">Project brief</h2>
            <p className="max-w-xl text-sm leading-relaxed text-text-muted">Share the details needed to consider your inquiry. Submitting this form does not confirm a booking.</p>
          </div>
          {isClosed ? (
            <div className="py-6" role="status">
              <p className="text-lg">New inquiries are currently closed.</p>
              <p className="mt-2 text-sm text-text-muted">Please check back for updates.</p>
            </div>
          ) : (
            <div className="pt-6">
              <CommissionInquiryForm offerings={offerings} defaultOfferingId={defaultOfferingId} isWaitlist={isWaitlist} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
