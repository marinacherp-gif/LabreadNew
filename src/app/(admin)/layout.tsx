import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { LanguageProvider } from "@/context/LanguageContext";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <LanguageProvider storageKey="admin_lang">
      <div className="flex flex-col md:flex-row min-h-screen bg-brand-50">
        <AdminSidebar
          userEmail={session.user.email}
          userRole={session.user.role}
          userName={session.user.name}
        />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 md:px-8">{children}</div>
        </main>
      </div>
    </LanguageProvider>
  );
}
