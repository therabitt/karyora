"use client";

import { useActionState } from "react";
import { loginAction, type AuthActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState: AuthActionResult = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger font-medium"
        >
          {state.error}
        </div>
      )}

      <Input
        label="Email Address"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="artist@example.com"
        required
      />

      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••••••"
        required
      />

      <Button
        variant="primary"
        fullWidth
        size="lg"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign In to Studio"}
      </Button>

      <div className="pt-2 text-center">
        <p className="text-xs text-text-muted">
          Karyora operates on a single-administrator model. Public registration is deliberately disabled.
        </p>
      </div>
    </form>
  );
}
