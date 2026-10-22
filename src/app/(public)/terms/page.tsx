import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service & Commission Agreement",
  description: "Terms governing artwork rights, commission inquiries, revisions, and usage.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 w-full space-y-12">
      <div className="space-y-4 max-w-2xl border-b border-border pb-8">
        <h1 className="font-serif text-4xl sm:text-5xl text-ink">
          Commission Terms
        </h1>
        <p className="text-sm text-text-muted">
          Last updated: October 2026. Please review these terms before submitting a commission inquiry.
        </p>
      </div>

      <div className="space-y-10 text-sm text-ink-soft leading-relaxed max-w-prose">
        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-ink">1. Nature of Submission</h2>
          <p>
            Submitting a commission inquiry through Karyora is a request for consideration. It does not constitute a guaranteed acceptance or binding contract. The artist reviews every inquiry based on scope, availability, and creative alignment.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-ink">2. Copyright and Rights</h2>
          <p>
            The artist retains full copyright and intellectual property rights over all artwork created, including sketches, work-in-progress files, and final renders, unless a written commercial buyout agreement is explicitly executed.
          </p>
          <p>
            Personal commission clients receive a non-exclusive license to display the completed work for personal, non-commercial purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-ink">3. Revisions & Approvals</h2>
          <p>
            Standard commissions include up to two review milestones: thumbnail/sketch review and final rendering review. Significant structural adjustments requested after sketch approval may incur additional revision fees.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-ink">4. Turnaround & Deadlines</h2>
          <p>
            Estimated turnaround times are communicative targets. While deadlines requested in inquiries are respected whenever possible, completion dates depend on prompt client feedback and active queue volume.
          </p>
        </section>
      </div>
    </div>
  );
}
