import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service & Commission Agreement",
  description: "Terms governing artwork rights, commission inquiries, revisions, and usage.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 w-full space-y-12">
      <div className="space-y-3 border-b border-border pb-8">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
          Policies & Rights
        </span>
        <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight">
          Commission Terms
        </h1>
        <p className="text-xs font-mono text-text-muted">
          Last revised: October 2026 · Standard terms applicable to personal and editorial commissions.
        </p>
      </div>

      <div className="space-y-10 text-sm text-ink-soft leading-relaxed max-w-prose">
        <section className="space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
            01 / CONSIDERATION
          </span>
          <h2 className="font-sans text-2xl text-ink">Nature of Submission</h2>
          <p>
            Submitting a commission inquiry through Karyora is a request for consideration. It does not constitute a guaranteed acceptance or binding contract. The artist reviews every inquiry based on scope, availability, and creative alignment.
          </p>
        </section>

        <section className="space-y-3 border-t border-border pt-8">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
            02 / INTELLECTUAL PROPERTY
          </span>
          <h2 className="font-sans text-2xl text-ink">Copyright and Rights</h2>
          <p>
            The artist retains full copyright and intellectual property rights over all artwork created, including sketches, work-in-progress files, and final renders, unless a written commercial buyout agreement is explicitly executed.
          </p>
          <p>
            Personal commission clients receive a non-exclusive license to display the completed work for personal, non-commercial purposes.
          </p>
        </section>

        <section className="space-y-3 border-t border-border pt-8">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
            03 / COLLABORATION PROCESS
          </span>
          <h2 className="font-sans text-2xl text-ink">Revisions & Approvals</h2>
          <p>
            Standard commissions include up to two review milestones: thumbnail/sketch review and final rendering review. Significant structural adjustments requested after sketch approval may incur additional revision fees.
          </p>
        </section>

        <section className="space-y-3 border-t border-border pt-8">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent font-semibold block">
            04 / SCHEDULE & DELIVERY
          </span>
          <h2 className="font-sans text-2xl text-ink">Turnaround & Deadlines</h2>
          <p>
            Estimated turnaround times are communicative targets. While deadlines requested in inquiries are respected whenever possible, completion dates depend on prompt client feedback and active queue volume.
          </p>
        </section>
      </div>
    </div>
  );
}