"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Initialize banners from the email-confirmation redirect (see /auth/confirm).
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "confirm"
      ? "That confirmation link is invalid or has expired. Sign in, or request a new link."
      : null
  );
  const [info, setInfo] = useState<string | null>(
    searchParams.get("confirmed") === "1"
      ? "Your email is confirmed. Sign in below to continue."
      : null
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.replace("/");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      // Supabase's built-in email service has a low hourly cap. Repeated
      // sign-up attempts hit it and return "email rate limit exceeded", which
      // is opaque to a user — explain it and point at the real fix.
      const rateLimited =
        error.status === 429 || /rate limit/i.test(error.message);
      setError(
        rateLimited
          ? "Too many confirmation emails were requested recently. Wait a few minutes and try again. (If this keeps happening, the project needs a custom SMTP provider, or email confirmation can be turned off in Supabase.)"
          : error.message
      );
      setLoading(false);
      return;
    }
    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }
    setInfo(
      "Account created. Check your email for a confirmation link, then sign in."
    );
    setMode("signin");
    setLoading(false);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-background">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Scale className="size-5.5" />
        </span>
        <span className="text-2xl font-semibold">LegalCRM</span>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            {mode === "signin" ? "Sign in" : "Create account"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Enter your email and password to access your practice."
              : "Set up your attorney account with an email and password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@lawfirm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
              >
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                {info}
              </p>
            )}

            {mode === "signin" && (
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Need an account?{" "}
                <button
                  type="button"
                  className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>

      <p className="mt-6 max-w-sm text-center text-xs text-muted-foreground">
        Private practice management for a solo attorney.
      </p>
    </div>
  );
}
