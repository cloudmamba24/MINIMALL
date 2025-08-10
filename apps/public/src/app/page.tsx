import { redirect } from "next/navigation";

// Redirect root to demo experience - showcase the sophisticated Instagram-native system
export default function HomePage() {
  redirect("/g/demo");
}
