import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MarketHub" },
      { name: "description", content: "Sign in to post items, save favourites and message sellers on MarketHub." },
      { property: "og:title", content: "Sign in — MarketHub" },
      { property: "og:description", content: "Sign in to post items and message sellers on MarketHub." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
      router.invalidate();
      navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-md px-5 py-12 sm:py-20">
      <h1 className="text-4xl">{mode === "signin" ? "Welcome back" : "Join MarketHub"}</h1>
      <p className="deck mt-3">
        {mode === "signin"
          ? "Sign in to post, save and message"
          : "Create an account to start selling"}
      </p>

      <button
        type="button"
        onClick={google}
        className="mt-8 w-full rounded-full border border-border bg-card px-5 py-3 text-sm font-medium transition-colors hover:bg-secondary"
      >
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            className={inputClass}
          />
        )}
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={inputClass}
        />
        <input
          required
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-6 w-full text-sm text-muted-foreground underline underline-offset-4"
      >
        {mode === "signin" ? "No account yet? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";
