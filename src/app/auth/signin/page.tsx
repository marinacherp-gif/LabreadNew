"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const error = params.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-100">
      <div className="bg-white rounded-2xl shadow-card-md p-10 w-full max-w-sm text-center">

        {/* Logo */}
        <img
          src="/labread_logo.jpg"
          alt="Labread Bakery"
          className="w-32 h-auto mx-auto mb-6 rounded-xl"
        />

        <h1 className="text-xl font-bold text-brand-800 mb-1">Admin Sign In</h1>
        <p className="text-sm text-brand-500 mb-7">Sign in to manage your bakery</p>

        {error && (
          <p className="mb-5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error === "AccessDenied"
              ? "Your Google account is not authorized. Contact the bakery administrator."
              : "An error occurred. Please try again."}
          </p>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full flex items-center justify-center gap-3 border border-brand-200 rounded-xl px-4 py-3 text-brand-700 font-medium hover:bg-brand-50 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z"/>
            <path fill="#FBBC05" d="M24 46c5.9 0 10.9-2 14.6-5.3l-6.7-5.5C29.9 36.9 27.1 38 24 38c-6.1 0-11.3-4.1-13.2-9.6l-7 5.4C7.4 40.6 15.1 46 24 46z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.9 2.4-2.5 4.4-4.5 5.8l6.7 5.5C41.3 36.4 44 31 44 24c0-1.3-.2-2.7-.5-4z"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-xs text-brand-400">
          Only approved bakery staff can sign in.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
