import Link from "next/link";
import { getPublicProfile } from "@/lib/data/profile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the artist for collaborations, print inquiries, licensing, exhibitions, and general messages.",
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
      return "Accepting commission inquiries";
    case "waitlist":
      return "Accepting waitlist inquiries";
    default:
      return "Commission inquiries are closed";
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
    <main className="w-full px-5 py-8 sm:px-8 sm:py-12 lg:px-14 lg:py-16 xl:px-20">
      <section
        aria-labelledby="contact-title"
        className="grid grid-cols-1 gap-12 border-b border-border pb-10 sm:pb-14 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.72fr)] lg:gap-12 xl:gap-20"
      >
        <div className="space-y-7 sm:space-y-9">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-text-muted">
            Karyora / Contact
          </p>
          <h1
            id="contact-title"
            className="max-w-full text-[clamp(4.1rem,8.6vw,9rem)] leading-[0.82] tracking-[-0.065em] text-ink sm:text-[clamp(5rem,8.6vw,9rem)]"
            style={{ fontFamily: '"Bodoni MT", Didot, "Times New Roman", serif' }}
          >
            Let&apos;s make
            <br />
            something.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            For collaborations, print inquiries, licensing, exhibitions, or a note just to say hello.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-9 lg:pt-32 xl:pt-44">
          <section aria-labelledby="direct-contact-title" className="space-y-3">
            <h2
              id="direct-contact-title"
              className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted"
            >
              Direct correspondence
            </h2>
            {contactEmail ? (
              <a
                href={"mailto:" + contactEmail}
                className="group inline-flex max-w-full items-start gap-2 break-words text-lg leading-snug text-ink underline decoration-border-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 sm:text-xl lg:text-2xl"
              >
                <span className="break-all">{contactEmail}</span>
                <span aria-hidden="true" className="shrink-0 text-xs text-accent">↗</span>
              </a>
            ) : (
              <p className="max-w-md text-sm leading-relaxed text-text-muted">
                Direct email is not currently listed. For artwork requests, use the commission inquiry page when intake is open.
              </p>
            )}
          </section>

          <section aria-labelledby="commission-contact-title" className="space-y-3 border-t border-border pt-5">
            <h2
              id="commission-contact-title"
              className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted"
            >
              Commissions
            </h2>
            <p className="text-sm text-ink">{getAvailabilityLabel(profile.commission_availability)}</p>
            {availabilityMessage ? (
              <p className="max-w-md text-sm leading-relaxed text-text-muted">{availabilityMessage}</p>
            ) : null}
            <Link
              href="/commission"
              className="inline-flex min-h-10 items-center gap-2 pt-1 text-sm font-medium text-accent underline decoration-border-strong underline-offset-4 transition-colors hover:text-accent-hover hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4"
            >
              Project inquiries <span aria-hidden="true">↗</span>
            </Link>
          </section>

          {socialEntries.length > 0 ? (
            <section aria-labelledby="social-contact-title" className="space-y-3 border-t border-border pt-5">
              <h2
                id="social-contact-title"
                className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted"
              >
                Elsewhere
              </h2>
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-ink underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-3"
                    aria-label={"Open Karyora's " + formatPlatformName(platform) + " profile in a new tab"}
                  >
                    {formatPlatformName(platform)}
                    <span aria-hidden="true" className="text-[10px] text-text-muted">↗</span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
