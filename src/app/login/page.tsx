"use client";

/**
 * Login Page
 *
 * Demonstrates two key React 19 / Next.js 15 patterns:
 *
 * 1. useActionState — replaces the useState(error) + useTransition combo.
 *    The server action's return value becomes the `state` object.
 *    Signature: [state, formAction, isPending] = useActionState(action, initialState)
 *
 * 2. useFormStatus (in <SubmitButton>) — the child button reads the parent
 *    form's pending state without any prop drilling.
 *
 * 3. Native <form action={formAction}> — progressive enhancement.
 *    No manual e.preventDefault() or FormData construction needed.
 */

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { loginAction } from "@/app/actions/auth-actions";
import type { AuthActionResponse } from "@/app/actions/auth-actions";
import SubmitButton from "@/components/ui/submit-button";

const initialState: AuthActionResponse = { success: false };

export default function LoginPage() {
  // useActionState wires the server action to this component's state.
  // - `state`      → the last return value from loginAction (or initialState)
  // - `formAction` → pass as <form action={formAction}>
  // - `isPending`  → true while the action is in-flight (also readable via useFormStatus in children)
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Glow Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl transition-all">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30 ring-4 ring-indigo-500/20 mb-4 transition-transform hover:scale-105">
              <span className="text-white font-black text-xl tracking-wider">CM</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              ChequeManager
            </h1>
            <p className="mt-1 text-xs text-slate-400 font-medium tracking-wide uppercase">
              Financial Ledger &amp; Cheque Tracking
            </p>
          </div>

          {/* Error Message — sourced from server action state, not local useState */}
          {state.error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-400 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{state.error}</span>
            </div>
          )}

          {/*
           * Native form action — no onSubmit handler, no manual FormData.
           * Next.js serializes the form fields and calls the server action.
           * Works even without JavaScript (progressive enhancement).
           */}
          <form action={formAction} className="space-y-5">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
              >
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="Enter your username"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-inner outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-11 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-inner outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/*
             * SubmitButton uses useFormStatus() internally.
             * It reads `pending` from the parent <form> — zero prop drilling.
             */}
            <SubmitButton
              label="Sign In to Dashboard"
              pendingLabel="Signing In…"
              className="mt-6 w-full justify-center bg-indigo-600 shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 cursor-pointer"
            />
          </form>

          {/* Footer Note */}
          <div className="mt-8 border-t border-slate-800/60 pt-5 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Encrypted Session Authentication</span>
            </div>
            <Link
              href="/register"
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
            >
              First time? Create your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
