"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { registerAction } from "@/app/actions/auth-actions";

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirmPassword") as string;

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await registerAction(null, formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        setError(res.error || "Registration failed. Please try again.");
      }
    });
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Glow Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 shadow-xl shadow-violet-600/30 ring-4 ring-violet-500/20 mb-4">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Create Admin Account
            </h1>
            <p className="mt-1.5 text-xs text-slate-400 font-medium leading-relaxed max-w-xs">
              This is a one-time setup. After your account is created, registration will be permanently closed.
            </p>
          </div>

          {/* Success State */}
          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-400 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Account created! Redirecting to dashboard…</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-400 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label
                  htmlFor="reg-username"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-username"
                    name="username"
                    type="text"
                    required
                    autoFocus
                    minLength={3}
                    autoComplete="username"
                    placeholder="Choose a username (min. 3 chars)"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-inner outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-11 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-inner outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="reg-confirm"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-confirm"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-11 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-inner outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-500 hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Account…</span>
                  </>
                ) : (
                  <span>Create Admin Account</span>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-slate-800/60 pt-5 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Password hashed with bcrypt · 12 rounds</span>
            </div>
            <Link
              href="/login"
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
