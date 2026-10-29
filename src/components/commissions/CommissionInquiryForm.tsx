"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { submitInquiryAction, type InquiryActionResult } from "@/app/actions/inquiry";
import type { PublicOffering } from "@/lib/data/offerings";

interface CommissionInquiryFormProps {
  offerings: PublicOffering[];
  defaultOfferingId?: string;
  isWaitlist?: boolean;
}

function formatPrice(amount: number, currency: string = "IDR"): string {
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

function formatStartingPrice(amount: number | null, currency: string = "IDR"): string {
  return amount === null || amount === undefined
    ? "Price on inquiry"
    : "From " + formatPrice(amount, currency);
}

export function CommissionInquiryForm({
  offerings,
  defaultOfferingId = "",
  isWaitlist = false,
}: CommissionInquiryFormProps) {
  const [state, formAction, isPending] = useActionState<InquiryActionResult | null, FormData>(
    submitInquiryAction,
    null
  );

  const [dismissedTimestamp, setDismissedTimestamp] = useState<number | null>(null);

  // If rate limit triggered, hide form and show dedicated cooldown notice
  if (state?.isRateLimited) {
    return (
      <div className="p-8 sm:p-12 text-center space-y-6 bg-surface border border-accent/30 shadow-xs">
        <div className="w-16 h-16 mx-auto rounded-full bg-accent-soft text-accent flex items-center justify-center text-2xl font-serif">
          ⏱
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="font-serif text-2xl sm:text-3xl text-ink">
            Submission Cooldown Active
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            {state.error ||
              "The current attempt was not submitted because the submission limit was reached. Please wait for the current 15-minute window to reset before trying again."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/gallery"
            className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-sm border border-border-strong text-ink hover:bg-surface-muted transition-colors motion-transition-micro"
          >
            Browse Gallery
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-sm text-ink-soft hover:text-ink transition-colors motion-transition-micro"
          >
            Contact Information
          </Link>
        </div>
      </div>
    );
  }

  // If action succeeded and hasn't been dismissed by "Send another note"
  const isSuccessActive = Boolean(state?.success && state.timestamp !== dismissedTimestamp);

  if (isSuccessActive) {
    return (
      <div className="p-8 sm:p-12 text-center space-y-6 bg-surface border border-border shadow-xs">
        <div className="w-16 h-16 mx-auto rounded-full bg-accent-soft text-accent flex items-center justify-center text-2xl font-serif">
          ✓
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="font-serif text-2xl sm:text-3xl text-ink">
            Inquiry Received
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            {state?.message ||
              "Your inquiry has been received for consideration. The artist will review your project brief and contact you by email regarding possible next steps."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/gallery"
            className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-sm bg-accent text-white hover:bg-accent-hover transition-colors motion-transition-micro"
          >
            Browse Gallery
          </Link>
          <button
            type="button"
            onClick={() => setDismissedTimestamp(state?.timestamp ?? Date.now())}
            className="inline-flex items-center justify-center text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-sm border border-border-strong text-ink hover:bg-surface-muted transition-colors motion-transition-micro cursor-pointer"
          >
            Submit Another Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="commission-form space-y-8 [&_label]:mb-2 [&_label]:block [&_label]:font-sans [&_label]:text-sm [&_label]:font-normal [&_label]:tracking-normal [&_input]:min-h-11 [&_input]:rounded-none [&_input]:border-0 [&_input]:border-b [&_input]:border-border-strong [&_input]:bg-transparent [&_input]:px-0 [&_input]:py-3 [&_input]:text-sm [&_input]:shadow-none [&_input]:focus:border-accent [&_input]:focus:ring-0 [&_textarea]:rounded-none [&_textarea]:border-0 [&_textarea]:border-b [&_textarea]:border-border-strong [&_textarea]:bg-transparent [&_textarea]:px-0 [&_textarea]:py-3 [&_textarea]:shadow-none [&_textarea]:focus:border-accent [&_textarea]:focus:ring-0">
      {/* Bot Suppression Honeypot (hidden from real users) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="hp_website_contact">Leave this field blank</label>
        <input
          type="text"
          id="hp_website_contact"
          name="hp_website_contact"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Global Error Banner */}
      {state?.error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-sm text-danger flex items-start gap-3"
        >
          <span className="font-bold">Error:</span>
          <span>{state.error}</span>
        </div>
      )}

      {isWaitlist && (
        <div className="p-3.5 rounded-xl bg-accent-soft/30 border border-accent/20 text-xs text-ink space-y-0.5">
          <p className="font-semibold text-accent">Waitlist Intake Mode</p>
          <p className="text-text-muted">
            The artist&apos;s active queue is full. New submissions will be reviewed for upcoming scheduling windows.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          label="What should I call you? *"
          id="client_name"
          name="client_name"
          placeholder="e.g. Maya Lin"
          error={state?.fieldErrors?.client_name?.[0]}
          disabled={isPending}
          required
        />
        <Input
          label="Where can I reach you? *"
          id="client_email"
          name="client_email"
          type="email"
          placeholder="e.g. maya@example.com"
          error={state?.fieldErrors?.client_email?.[0]}
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="offering_id" className="block text-sm font-medium text-ink">
          What are we making? (optional)
        </label>
        <select
          key={defaultOfferingId}
          id="offering_id"
          name="offering_id"
          defaultValue={defaultOfferingId}
          disabled={isPending}
          className="w-full min-h-11 appearance-none rounded-none border-0 border-b border-border-strong bg-transparent px-0 py-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-0"
        >
          <option value="">Custom project / Not listed</option>
          {offerings.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title} — {formatStartingPrice(o.price_from, o.price_currency)}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.offering_id && (
          <p className="text-xs text-danger font-medium">
            {state.fieldErrors.offering_id[0]}
          </p>
        )}
      </div>

      <Textarea
        label="Tell me about your idea *"
        id="description"
        name="description"
        rows={5}
        placeholder="The idea, mood, references, where it will live... start anywhere."
        helperText="A few details help me understand what you have in mind."
        error={state?.fieldErrors?.description?.[0]}
        disabled={isPending}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          label="Do you have a budget in mind? (optional)"
          id="budget_amount"
          name="budget_amount"
          type="number"
          placeholder="Your approximate budget in IDR"
          error={state?.fieldErrors?.budget_amount?.[0]}
          disabled={isPending}
        />
        <Input
          label="When do you need it? (optional)"
          id="desired_deadline"
          name="desired_deadline"
          type="date"
          error={state?.fieldErrors?.desired_deadline?.[0]}
          disabled={isPending}
        />
      </div>

      {/* Consideration and Privacy Notice */}
      <div className="space-y-1 py-1 text-xs leading-relaxed text-text-muted">
        <p className="text-sm text-ink">A small note before you send</p>
        <p>
          Submitting this inquiry is a request for artist consideration. It does not constitute a confirmed booking, agreement, or payment obligation. Your email is kept strictly private.
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-12 w-full items-center justify-between gap-8 border-b border-ink bg-transparent px-0 py-3 text-sm font-medium text-ink transition-colors motion-transition-micro hover:border-accent hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-64"
        >
          <span>
            {isPending
              ? "Sending your note..."
              : isWaitlist
              ? "Join the waitlist"
              : "Send your inquiry"}
          </span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
