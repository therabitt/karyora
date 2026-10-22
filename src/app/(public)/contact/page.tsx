import { Card, CardContent } from "@/components/ui/Card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the artist for inquiries, questions, and collaborations.",
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 w-full space-y-12">
      <div className="space-y-4 text-center max-w-xl mx-auto">
        <h1 className="font-serif text-4xl sm:text-5xl text-ink">Get in Touch</h1>
        <p className="text-base text-text-muted leading-relaxed">
          For exhibition opportunities, print inquiries, or general questions, feel free to reach out via email or social platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardContent className="space-y-2">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Direct Inquiries
            </h2>
            <p className="font-serif text-xl text-ink">Artist Email</p>
            <p className="text-sm text-text-muted">
              For direct communication outside the commission workflow:
            </p>
            <p className="text-sm font-medium text-accent pt-2">
              artist@karyora.internal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Commissions
            </h2>
            <p className="font-serif text-xl text-ink">Commission Requests</p>
            <p className="text-sm text-text-muted">
              For bespoke artwork, character illustration, and commercial briefs:
            </p>
            <a
              href="/commission"
              className="inline-block text-sm font-medium text-accent hover:underline pt-2"
            >
              Go to Commission Form →
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
