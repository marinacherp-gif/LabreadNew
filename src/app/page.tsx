import { redirect } from "next/navigation";

// Root redirects to the customer shop
export default function RootPage() {
  redirect("/shop");
}
