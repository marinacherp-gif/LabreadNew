import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="text-xl font-bold text-red-700 mt-3 mb-2">Access Denied</h1>
        <p className="text-gray-600 text-sm mb-6">
          Your Google account is not authorized to access the Labread admin panel.
          Contact the bakery administrator to request access.
        </p>
        <Link
          href="/auth/signin"
          className="inline-block bg-amber-600 text-white rounded-xl px-6 py-2 text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
