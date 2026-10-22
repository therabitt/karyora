import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Sign In",
  description: "Sign in to the Karyora artist administration dashboard.",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="space-y-2 text-center">
          <span className="text-xs uppercase tracking-widest text-text-muted font-semibold">
            Restricted Studio Access
          </span>
          <h1 className="font-serif text-3xl text-ink">Artist Sign In</h1>
          <p className="text-xs text-text-muted">
            Authorized administrator session required.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <Input
              label="Email Address"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="artist@example.com"
              required
            />
            <Input
              label="Password"
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              required
            />
            <Button variant="primary" fullWidth size="lg" type="button">
              Sign In to Studio
            </Button>

            <div className="pt-2 text-center">
              <p className="text-xs text-text-muted">
                Karyora operates on a single-administrator model. Public registration is deliberately disabled.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
