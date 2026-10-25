"use client";

import React, { useActionState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { updateProfileAction, type ProfileActionResult } from "@/app/actions/profile";
import type { AdminProfile } from "@/lib/data/profile";

interface ProfileSettingsFormProps {
  profile: AdminProfile | null;
}

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const [state, formAction, isPending] = useActionState<ProfileActionResult | null, FormData>(
    updateProfileAction,
    null
  );

  const socialLinks = (profile?.social_links as Record<string, string>) || {};
  const currentAvailability = profile?.commission_availability || "open";

  return (
    <form action={formAction} className="space-y-8">
      {/* Success Notification */}
      {state?.success && (
        <div
          role="status"
          className="p-4 rounded-xl bg-accent-soft/30 border border-accent/30 text-sm text-accent flex items-start gap-3"
        >
          <span className="font-bold">Success:</span>
          <span>Studio settings and profile saved successfully.</span>
        </div>
      )}

      {/* Error Notification */}
      {state?.error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-sm text-danger flex items-start gap-3"
        >
          <span className="font-bold">Error:</span>
          <span>{state.error}</span>
        </div>
      )}

      {/* Commission Availability Settings */}
      <Card>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-sans text-lg text-ink">Commission Availability</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Controls inquiry intake mode on the public commission page.
              </p>
            </div>
            <Badge variant={currentAvailability}>
              {currentAvailability === "open"
                ? "Open"
                : currentAvailability === "waitlist"
                ? "Waitlist"
                : "Closed"}
            </Badge>
          </div>

          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-wider font-semibold text-text-muted">
              Availability Mode *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface cursor-pointer hover:bg-surface-muted/50 transition-colors">
                <input
                  type="radio"
                  name="commission_availability"
                  value="open"
                  defaultChecked={currentAvailability === "open"}
                  disabled={isPending}
                  className="mt-1"
                />
                <div>
                  <span className="block text-sm font-semibold text-ink">Open</span>
                  <span className="block text-xs text-text-muted mt-0.5">
                    Accepting new inquiries directly.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface cursor-pointer hover:bg-surface-muted/50 transition-colors">
                <input
                  type="radio"
                  name="commission_availability"
                  value="waitlist"
                  defaultChecked={currentAvailability === "waitlist"}
                  disabled={isPending}
                  className="mt-1"
                />
                <div>
                  <span className="block text-sm font-semibold text-ink">Waitlist</span>
                  <span className="block text-xs text-text-muted mt-0.5">
                    Inquiries queued for future review.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface cursor-pointer hover:bg-surface-muted/50 transition-colors">
                <input
                  type="radio"
                  name="commission_availability"
                  value="closed"
                  defaultChecked={currentAvailability === "closed"}
                  disabled={isPending}
                  className="mt-1"
                />
                <div>
                  <span className="block text-sm font-semibold text-ink">Closed</span>
                  <span className="block text-xs text-text-muted mt-0.5">
                    Inquiry submissions paused.
                  </span>
                </div>
              </label>
            </div>
            {state?.fieldErrors?.commission_availability && (
              <p className="text-xs text-danger font-medium">
                {state.fieldErrors.commission_availability[0]}
              </p>
            )}
          </div>

          <Input
            label="Custom Availability Message (Optional)"
            id="availability_message"
            name="availability_message"
            defaultValue={profile?.availability_message || ""}
            placeholder="e.g. Commissions are open for October character and environmental briefs."
            helperText="Custom notice exhibited to visitors on the commission page (max 300 characters)."
            error={state?.fieldErrors?.availability_message?.[0]}
            disabled={isPending}
          />
        </CardContent>
      </Card>

      {/* Public Artist Profile Settings */}
      <Card>
        <CardContent className="space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="font-sans text-lg text-ink">Public Artist Profile</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Exhibited on the public home, about, and contact pages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Display Name *"
              id="display_name"
              name="display_name"
              defaultValue={profile?.display_name || "Karyora Artist"}
              placeholder="e.g. Karyora Artist"
              helperText="Name displayed on public portfolio headers."
              error={state?.fieldErrors?.display_name?.[0]}
              disabled={isPending}
              required
            />
            <Input
              label="Public Contact Email"
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={profile?.contact_email || ""}
              placeholder="e.g. artist@example.com"
              helperText="Optional public email for general non-commission contact."
              error={state?.fieldErrors?.contact_email?.[0]}
              disabled={isPending}
            />
          </div>

          <Textarea
            label="Biography"
            id="bio"
            name="bio"
            rows={4}
            defaultValue={profile?.bio || ""}
            placeholder="Introduce your artistic background, medium focus, themes, and storytelling philosophy..."
            helperText="Maximum 2,000 characters."
            error={state?.fieldErrors?.bio?.[0]}
            disabled={isPending}
          />

          <div className="space-y-4 border-t border-border pt-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              Verified Social & Portfolio URLs (HTTPS)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Twitter / X"
                id="social_twitter"
                name="social_twitter"
                defaultValue={socialLinks.twitter || ""}
                placeholder="https://x.com/username"
                disabled={isPending}
              />
              <Input
                label="Instagram"
                id="social_instagram"
                name="social_instagram"
                defaultValue={socialLinks.instagram || ""}
                placeholder="https://instagram.com/username"
                disabled={isPending}
              />
              <Input
                label="ArtStation"
                id="social_artstation"
                name="social_artstation"
                defaultValue={socialLinks.artstation || ""}
                placeholder="https://artstation.com/username"
                disabled={isPending}
              />
              <Input
                label="Cara"
                id="social_cara"
                name="social_cara"
                defaultValue={socialLinks.cara || ""}
                placeholder="https://cara.app/username"
                disabled={isPending}
              />
            </div>
            {state?.fieldErrors?.social_links && (
              <p className="text-xs text-danger font-medium">
                {state.fieldErrors.social_links[0]}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button variant="primary" size="lg" type="submit" disabled={isPending}>
          {isPending ? "Saving Settings..." : "Save Profile & Settings"}
        </Button>
      </div>
    </form>
  );
}
