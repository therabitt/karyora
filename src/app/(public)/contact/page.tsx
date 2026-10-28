import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { getPublicProfile } from "@/lib/data/profile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the artist for exhibition opportunities, licensing, collaborations, and general inquiries.",
};

function isUsableSocialProfile(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.pathname.replace(/\/+$/, "") !== "";
  } catch {
    return false;
  }
}

function formatPlatformName(platform: string): string {
  const knownNames: Record<string, string> = {
    twitter: "X / Twitter",
    instagram: "Instagram",
    artstation: "ArtStation",
    cara: "Cara",
    behance: "Behance",
    tumblr: "Tumblr",
    bluesky: "Bluesky",
    youtube: "YouTube",
    pinterest: "Pinterest",
  };

  return knownNames[platform.toLowerCase()] ||
    platform.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getAvailabilityLabel(availability: string): string {
  switch (availability) {
    case "open":
      return "Commissions Open";
    case "waitlist":
      return "Waitlist Only";
    default:
      return "Currently Closed";
  }
}

export default async function ContactPage() {
  const profile = await getPublicProfile();

  // Never present an internal fallback address as a real public contact.
  const contactEmail =
    profile.contact_email && !profile.contact_email.trim().toLowerCase().endsWith(".internal")
      ? profile.contact_email.trim()
      : null;

  const socialEntries = Object.entries(profile.social_links || {})
    .filter(([platform, url]) => platform.trim().length > 0 && isUsableSocialProfile(url))
    .sort(([platformA], [platformB]) => platformA.localeCompare(platformB));

  const availabilityMessage = profile.availability_message?.trim();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-16 px-4 py-12 sm:px-6 md:space-y-20 md:py-16 lg:px-8">
      <section
        aria-labelledby="contact-title"
        className="grid grid-cols-1 gap-8 border-b border-border pb-10 md:gap-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-end"
      >
        <div className="max-w-3xl space-y-4">
          <span className="block text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-accent">
            Correspondence / Studio Contact
          </span>
          <h1
            id="contact-title"
            className="font-sans text-4xl leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            Get in Touch
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-ink-soft">
            For exhibition opportunities, print inquiries, commercial licensing, collaborations,
            or general questions, choose the contact route that best fits your message.
          </p>
        </div>

        <div className="border-l border-border-strong pl-4 lg:justify-self-end lg:pb-1">
          <span className="block text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted">
            Karyora / Contact
          </span>
          <span className="mt-2 block text-sm leading-relaxed text-ink">
            A direct line to the studio, with commission details kept separate.
          </span>
        </div>
      </section>

      <section
        aria-labelledby="direct-contact-title"
        className="grid grid-cols-1 gap-6 border-b border-border pb-10 sm:gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12"
      >
        <div className="space-y-3">
          <span className="block text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-accent">
            01 / Direct Correspondence
          </span>
          <h2 id="direct-contact-title" className="font-sans text-2xl tracking-tight text-ink sm:text-3xl">
            Start with a note.
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-text-muted">
            Use direct email for exhibition opportunities, licensing, print inquiries, collaborations,
            and other questions outside the standard commission process.
          </p>
        </div>

        <div className="min-w-0 self-center md:border-l md:border-border md:pl-8 lg:pl-12">
          <p className="mb-3 text-xs font-mono uppercase tracking-[0.14em] text-text-muted">
            Email / Studio
          </p>
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex max-w-full items-start gap-3 break-words text-lg font-medium leading-snug text-ink underline decoration-border-strong underline-offset-8 transition-colors hover:text-accent hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 sm:text-2xl"
            >
              <span className="break-all">{contactEmail}</span>
              <span aria-hidden="true" className="shrink-0 text-sm text-accent">↗</span>
            </a>
          ) : (
            <p className="max-w-lg text-base leading-relaxed text-text-muted">
              Direct email is not currently listed. For artwork requests, you can use the commission
              inquiry page when intake is open.
            </p>
          )}
        </div>
      </section>

      <section
        aria-labelledby="commission-contact-title"
        className="grid grid-cols-1 gap-6 border-b border-border pb-10 sm:gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12"
      >
        <div className="space-y-3">
          <span className="block text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-accent">
            02 / Commission Requests
          </span>
          <h2 id="commission-contact-title" className="font-sans text-2xl tracking-tight text-ink sm:text-3xl">
            Have a project in mind?
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-text-muted">
            For personal commissions, character artwork, and custom visual projects, use the dedicated
            inquiry form so the project details arrive together.
          </p>
        </div>

        <div className="min-w-0 self-center md:border-l md:border-border md:pl-8 lg:pl-12">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={profile.commission_availability}>
              {getAvailabilityLabel(profile.commission_availability)}
            </Badge>
          </div>
          {availabilityMessage ? (
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-text-muted">
              {availabilityMessage}
            </p>
          ) : null}
          <Link
            href="/commission"
            className="mt-5 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-accent underline decoration-border-strong underline-offset-4 transition-colors hover:text-accent-hover hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4"
          >
            View commission details
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      {socialEntries.length > 0 ? (
        <section aria-labelledby="social-contact-title" className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <span className="block text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-accent">
                03 / Elsewhere
              </span>
              <h2 id="social-contact-title" className="font-sans text-2xl tracking-tight text-ink sm:text-3xl">
                Social & Art Archives
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-text-muted">
              Follow the work or explore more of the artist&apos;s public portfolio.
            </p>
          </div>

          <div className="border-t border-border">
            {socialEntries.map(([platform, url], index) => (
              <a
                key={platform}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid min-h-14 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-3 text-sm text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:gap-5"
                aria-label={`Open Karyora's ${formatPlatformName(platform)} profile in a new tab`}
              >
                <span className="text-xs font-mono tabular-nums text-text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-medium">{formatPlatformName(platform)}</span>
                <span className="text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" aria-hidden="true">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
