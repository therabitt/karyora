import Link from "next/link";
import { EditorialPageHeader } from "@/components/layout/EditorialPageHeader";
import { getPublicProfile } from "@/lib/data/profile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write to Karyora about collaborations, licensing, exhibitions, and artwork inquiries.",
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
    twitter: "X", instagram: "Instagram", artstation: "ArtStation",
    cara: "Cara", behance: "Behance", tumblr: "Tumblr", bluesky: "Bluesky",
    youtube: "YouTube", pinterest: "Pinterest",
  };
  return knownNames[platform.toLowerCase()] ||
    platform.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SocialIcon({ platform }: { platform: string }) {
  const name = platform.toLowerCase();

  if (name === "instagram") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" stroke="currentColor" strokeWidth="1.6">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.7" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === "twitter" || name === "x") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
        <path d="M18.9 3H21l-6.9 7.9L22.2 21h-6.4l-5-6.5L5.1 21H3l7.4-8.5L2.8 3h6.6l4.5 6L18.9 3Zm-1.1 16h1.2L7.3 4.9H6L17.8 19Z" />
      </svg>
    );
  }

  if (name === "youtube") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
        <path d="M21.3 7.1a2.8 2.8 0 0 0-2-2C17.6 4.6 12 4.6 12 4.6s-5.6 0-7.3.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.2 12a29 29 0 0 0 .5 4.9 2.8 2.8 0 0 0 2 2c1.7.5 7.3.5 7.3.5s5.6 0 7.3-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-4.9 29 29 0 0 0-.5-4.9ZM9.9 15.5v-7l6 3.5-6 3.5Z" />
      </svg>
    );
  }

  if (name === "artstation") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <path d="m4 16 5.8-10h4.4L20 16H4Z" />
        <path d="M3.5 18.5h17M8.5 14h7" />
      </svg>
    );
  }

  if (name === "behance") {
    return <span aria-hidden="true" className="font-sans text-[15px] font-bold tracking-[-0.08em]">Bē</span>;
  }

  if (name === "pinterest") {
    return <span aria-hidden="true" className="font-serif text-[19px] font-bold italic leading-none">P</span>;
  }

  if (name === "cara") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8 14c1.2-2.8 2.5-4 4-4s2.8 1.2 4 4M9 8.5h.01M15 8.5h.01" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4M12 3.5c2.2 2.4 3.2 5.2 3.2 8.5s-1 6.1-3.2 8.5c-2.2-2.4-3.2-5.2-3.2-8.5s1-6.1 3.2-8.5Z" />
    </svg>
  );
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
    ? "Commissions are open"
    : profile.commission_availability === "waitlist"
      ? "The waitlist is open"
      : "Commissions are closed";

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <EditorialPageHeader />
      <main className="flex flex-1 items-center px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
        <section
          aria-labelledby="contact-title"
          className="mx-auto grid w-full max-w-[1260px] grid-cols-1 items-center gap-14 sm:gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.82fr)] lg:gap-[8vw]"
        >
          <div className="min-w-0">
            <h1
              id="contact-title"
              className="text-[clamp(4.7rem,9.5vw,9.5rem)] leading-[0.72] tracking-[-0.075em] sm:text-[clamp(5.5rem,8vw,8.5rem)]"
              style={{ fontFamily: "var(--font-cormorant-garamond)" }}
            >
              <span className="block font-medium">Want to</span>
              <span className="block font-medium italic">start a new</span>
              <span className="block font-medium">project?</span>
            </h1>
            {contactEmail ? (
              <a
                href={"mailto:" + contactEmail}
                className="mt-9 inline-flex text-base tracking-tight text-ink-soft underline decoration-border-strong underline-offset-4 transition-colors motion-transition-micro hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:mt-11 sm:text-lg"
              >
                Or just say hello.
              </a>
            ) : (
              <p className="mt-9 text-base tracking-tight text-ink-soft sm:mt-11 sm:text-lg">
                Or just say hello.
              </p>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-10 sm:gap-12 lg:gap-14 lg:pb-2">
            <section aria-label="Email contact">
              {contactEmail ? (
                <a
                  href={"mailto:" + contactEmail}
                  className="group inline-flex max-w-full items-start gap-3 text-[clamp(1.15rem,2vw,1.9rem)] leading-snug tracking-[-0.035em] text-ink underline decoration-border-strong underline-offset-[7px] transition-colors motion-transition-micro hover:text-accent hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="break-all">{contactEmail}</span>
                  <span aria-hidden="true" className="pt-1 text-xs text-accent">↗</span>
                </a>
              ) : (
                <p className="max-w-md text-base leading-relaxed text-text-muted">A public email address is not listed just yet.</p>
              )}
            </section>

            {socialEntries.length > 0 ? (
              <nav aria-label="Social profiles" className="grid max-w-md grid-cols-2 gap-x-7 gap-y-4 sm:gap-x-10">
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex min-h-7 items-center gap-2.5 text-sm text-ink transition-colors motion-transition-micro hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={"Open Karyora's " + formatPlatformName(platform) + " profile in a new tab"}
                  >
                    <span className="flex h-5 w-5 items-center justify-center transition-transform motion-transition-micro group-hover:-translate-y-0.5">
                      <SocialIcon platform={platform} />
                    </span>
                    <span>{formatPlatformName(platform)}</span>
                  </a>
                ))}
              </nav>
            ) : null}

            <section aria-label="Commission inquiries" className="max-w-md space-y-3">
              <p className="text-base tracking-tight">{availabilityLabel}</p>
              {availabilityMessage ? (
                <p className="max-w-sm text-sm leading-relaxed text-text-muted">{availabilityMessage}</p>
              ) : null}
              <Link
                href="/commission"
                className="inline-flex items-center gap-2 pt-1 text-sm text-accent underline decoration-border-strong underline-offset-4 transition-colors motion-transition-micro hover:text-accent-hover hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Commission details <span aria-hidden="true">↗</span>
              </Link>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
