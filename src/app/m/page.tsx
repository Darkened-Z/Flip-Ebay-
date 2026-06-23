import { redirect } from "next/navigation";

// The scanner is already responsive, so the mobile route just points there.
export default function MobilePage() {
  redirect("/");
}
