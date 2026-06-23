import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth, isSuperAdmin } from "@/lib/auth";
import UserManagement from "@/components/admin/UserManagement";

export const metadata: Metadata = { title: "User Management — Labread Admin" };

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.email)) {
    redirect("/dashboard");
  }
  return <UserManagement />;
}
