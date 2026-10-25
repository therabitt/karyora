import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { LoginForm } from "@/components/auth/LoginForm";
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
          <h1 className="font-sans text-3xl text-ink">Artist Sign In</h1>
          <p className="text-xs text-text-muted">
            Authorized administrator session required.
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
