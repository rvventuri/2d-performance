import { redirect } from "next/navigation";
import SeedClient from "./_components/SeedClient";

export default function SeedPage() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/dashboard");
  }

  return <SeedClient />;
}
