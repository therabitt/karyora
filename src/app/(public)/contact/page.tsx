import Link from "next/link";
import { EditorialPageHeader } from "@/components/layout/EditorialPageHeader";
import { getPublicProfile } from "@/lib/data/profile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the artist for collaborations, print inquiries, licensing, exhibitions, and general messages.",
};

function isUsableSocialProfile(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.pathname.replace(/\/+$/, "") !== "";
  } catch {
    return false;
  }
}

function formatPlatformName(platform: string): string {
  const knownNames: Record<string, string> = {
    twitter: "X / Twitter", instagram: "Instagram", artstation: "ArtStation",
    cara: "Cara", behance: "Behance", tumblr: "Tumblr", bluesky: "Bluesky",
    youtube: "YouTube", pinterest: "Pinterest",
  };
  return knownNames[platform.toLowerCase()] ||
    platform.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function ContactPage() {
  const profile = await getPublicProfile();
  const contactEmail =
    profile.contact_email && !profile.contact_email.trim().toLowerCase().endsWith(".internal")
      ? profile.contact_email.trim()
      : null;
  const socialEntries = Object.entries(profile.social_links || {})
    .filter(([platform, url]) => platform.trim().length > 0 && isUsableSocialProfile(url))
    .sort(([a], [b]) => a.localeCompare(b));
  const availabilityMessage = profile.availability_message?.trim();
  const availabilityLabel = profile.commission_availability === "open"
    ? "Inquiries open"
    : profile.commission_availability === "waitlist"
      ? "Waitlist open"
      : "Inquiries closed";

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <EditorialPageHeader />
      <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col justify-center px-5 pb-16 pt-8 sm:px-8 sm:pb-20 lg:px-14">
        <section aria-labelledby="contact-title" className="mx-auto w-full max-w-6xl">
          <div className="grid grid-cols-1 gap-7 border-b border-border pb-8 sm:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.65fr)] sm:items-end sm:gap-12 lg:gap-20 lg:pb-10">
            <div>
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">Correspondence</p>
              <h1 id="contact-title" className="max-w-4xl text-[clamp(3.2rem,8vw,7.5rem)] leading-[0.88] tracking-[-0.065em]" style={{ fontFamily: '"Bodoni MT", Didot, "Times New Roman", serif' }}>
                Get in touch.
              </h1>
            </div>
            <p className="max-w-md pb-1 text-sm leading-relaxed text-text-muted sm:text-base">
              For collaborations, print inquiries, licensing, exhibitions, or a note about the work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
            <section aria-labelledby="email-title" className="border-b border-border py-7 sm:border-r sm:pr-8 lg:py-10 lg:pr-14">
              <h2 id="email-title" className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">Direct email</h2>
              {contactEmail ? (
                <a href={"mailto:" + contactEmail} className="mt-4 inline-flex max-w-full items-start gap-2 break-words text-xl leading-snug tracking-[-0.035em] underline decoration-border-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-2xl lg:text-3xl">
                  <span className="break-all">{contactEmail}</span><span aria-hidden="true" className="pt-1 text-xs text-accent">↗</span>
                </a>
              ) : (
                <p className="mt-4 max-w-md text-sm leading-relaxed text-text-muted">A public email address is not currently listed.</p>
              )}
            </section>

            <section aria-labelledby="commission-title" className="border-b border-border py-7 sm:pl-8 lg:py-10 lg:pl-14">
              <h2 id="commission-title" className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">Commission inquiries</h2>
              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
                <p className="text-xl tracking-tight sm:text-2xl">{availabilityLabel}</p>
                <Link href="/commission" className="text-sm font-medium text-accent underline decoration-border-strong underline-offset-4 transition-colors hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">View offerings ↗</Link>
              </div>
              {availabilityMessage ? <p className="mt-3 max-w-lg text-sm leading-relaxed text-text-muted">{availabilityMessage}</p> : null}
            </section>
          </div>

          {socialEntries.length > 0 ? (
            <section aria-labelledby="social-title" className="flex flex-col gap-4 pt-7 sm:flex-row sm:items-start sm:justify-between lg:pt-9">
              <h2 id="social-title" className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">Elsewhere</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {socialEntries.map(([platform, url]) => (
                  <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer" className="text-sm underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={"Open Karyora's " + formatPlatformName(platform) + " profile in a new tab"}>
                    {formatPlatformName(platform)} <span aria-hidden="true" className="text-accent">↗</span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </main>
    </div>
  );
}
