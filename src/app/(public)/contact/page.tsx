import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { getPublicProfile } from "@/lib/data/profile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the artist for inquiries, collaborations, and questions.",
};

export default async function ContactPage() {
  const profile = await getPublicProfile();
  const socialEntries = Object.entries(profile.social_links || {});

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 w-full space-y-12">
      <div className="border-b border-border pb-8 space-y-3">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
          Communications & Inquiries
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight">
          Get in Touch
        </h1>
        <p className="text-base text-ink-soft leading-relaxed max-w-xl font-normal">
          For exhibition opportunities, print inquiries, commercial licensing, or general questions, feel free to reach out via direct correspondence or verified profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="bg-surface border border-border p-6 sm:p-8 space-y-4 shadow-xs">
          <span className="text-[10px] font-mono font-semibold text-accent uppercase tracking-[0.18em] block">
            Direct Communication
          </span>
          <p className="font-serif text-2xl text-ink">{profile.display_name}</p>
          <p className="text-xs text-text-muted leading-relaxed">
            For direct inquiries outside the standard commission intake workflow:
          </p>
          {profile.contact_email ? (
            <a
              href={`mailto:${profile.contact_email}`}
              className="inline-block text-xs font-mono font-medium text-accent hover:underline pt-2"
            >
              {profile.contact_email} →
            </a>
          ) : (
            <p className="text-xs text-text-muted italic pt-2">
              Direct email is not currently listed.
            </p>
          )}
        </div>

        <div className="bg-surface border border-border p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-accent uppercase tracking-[0.18em] block">
              Bespoke Projects
            </span>
            <Badge variant={profile.commission_availability}>
              {profile.commission_availability === "open"
                ? "Open"
                : profile.commission_availability === "waitlist"
                ? "Waitlist"
                : "Closed"}
            </Badge>
          </div>
          <p className="font-serif text-2xl text-ink">Commission Requests</p>
          <p className="text-xs text-text-muted leading-relaxed">
            For personal commissions, character artwork, and commercial briefs:
          </p>
          <div className="pt-2">
            <Link
              href="/commission"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              <span>Go to Commission Intake</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {socialEntries.length > 0 && (
        <div className="space-y-4 border-t border-border pt-8">
          <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-[0.18em] block">
            Verified Profiles & Archives
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {socialEntries.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-sm bg-surface border border-border text-xs font-mono uppercase tracking-wider text-ink hover:border-accent hover:text-accent transition-colors capitalize"
              >
                {platform} ↗
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}