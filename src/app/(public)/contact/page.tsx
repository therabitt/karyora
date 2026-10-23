import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 w-full space-y-12">
      <div className="space-y-4 text-center max-w-xl mx-auto">
        <h1 className="font-serif text-4xl sm:text-5xl text-ink">Get in Touch</h1>
        <p className="text-base text-text-muted leading-relaxed">
          For exhibition opportunities, print inquiries, commercial licensing, or general questions, feel free to reach out via email or verified social profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Direct Communication
            </h2>
            <p className="font-serif text-xl text-ink">{profile.display_name}</p>
            <p className="text-sm text-text-muted">
              For direct communication outside the commission inquiry workflow:
            </p>
            {profile.contact_email ? (
              <a
                href={`mailto:${profile.contact_email}`}
                className="inline-block text-sm font-medium text-accent hover:underline pt-1"
              >
                {profile.contact_email}
              </a>
            ) : (
              <p className="text-sm text-text-muted italic pt-1">
                Direct email is not currently listed.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Bespoke Projects
              </h2>
              <Badge variant={profile.commission_availability}>
                {profile.commission_availability === "open"
                  ? "Open"
                  : profile.commission_availability === "waitlist"
                  ? "Waitlist"
                  : "Closed"}
              </Badge>
            </div>
            <p className="font-serif text-xl text-ink">Commission Requests</p>
            <p className="text-sm text-text-muted">
              For personal commissions, character artwork, and commercial briefs:
            </p>
            <Link
              href="/commission"
              className="inline-block text-sm font-medium text-accent hover:underline pt-1"
            >
              Go to Commission Form →
            </Link>
          </CardContent>
        </Card>
      </div>

      {socialEntries.length > 0 && (
        <div className="space-y-4 border-t border-border pt-8 text-center sm:text-left">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Verified Social & Portfolio Links
          </h2>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
            {socialEntries.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-surface border border-border text-sm text-ink hover:border-border-strong hover:text-accent transition-colors capitalize font-medium"
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
