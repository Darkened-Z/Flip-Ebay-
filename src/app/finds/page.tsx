import { AppHeader } from "@/components/brand";
import { FindsClient } from "@/components/finds/FindsClient";
import { getUserFinds } from "@/lib/data/finds";
import { buildNav } from "@/lib/nav";

export default async function FindsPage() {
  const finds = await getUserFinds();
  return (
    <main className="page">
      <AppHeader tagline="Saved finds" nav={buildNav("/finds")} />
      <FindsClient finds={finds} />
    </main>
  );
}
