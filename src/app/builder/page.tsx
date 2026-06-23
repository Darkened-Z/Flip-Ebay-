import { AppHeader } from "@/components/brand";
import { TitleField } from "@/components/builder/TitleField";
import { ProductGlyph } from "@/components/scanner/ProductGlyph";
import { buildNav } from "@/lib/nav";
import { createClient } from "@/lib/supabase/server";
import { publishListing } from "@/app/builder/actions";
import {
  IconCircleCheck,
  IconArrowRight,
  IconPhoto,
  IconExternalLink,
} from "@tabler/icons-react";

const card: React.CSSProperties = {
  background: "var(--color-surface)",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 1px 3px rgba(0,0,0,.05), 0 12px 28px -16px rgba(0,0,0,.12)",
};

type ListingRow = {
  id: string;
  title: string | null;
  source_id: string | null;
  source_cost: number | null;
  list_price: number | null;
  net_profit: number | null;
  status: string | null;
  image_urls: string[] | null;
};

function SetupLine({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 13,
        padding: "8px 0",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <span style={{ color: "var(--color-muted)" }}>{k}</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );
}

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  let listing: ListingRow | null = null;

  if (id) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("listings")
          .select(
            "id,title,source_id,source_cost,list_price,net_profit,status,image_urls",
          )
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        listing = (data as ListingRow) ?? null;
      }
    } catch {
      listing = null;
    }
  }

  return (
    <main className="page">
      <AppHeader tagline="Listing builder" nav={buildNav("/builder")} />

      {!listing ? (
        <div
          style={{
            marginTop: 20,
            padding: "48px 24px",
            textAlign: "center",
            background: "var(--color-surface)",
            borderRadius: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,.05)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>Nothing to build yet</div>
          <div
            style={{
              fontSize: 13,
              color: "var(--color-muted)",
              marginTop: 6,
              maxWidth: 380,
              margin: "6px auto 0",
              lineHeight: 1.5,
            }}
          >
            Scan a product (or pick one from Discover), then hit{" "}
            <b>Build listing</b> — it opens here ready to publish.
          </div>
        </div>
      ) : (
        (() => {
          const amazonUrl = listing.source_id
            ? `https://www.amazon.com/dp/${listing.source_id}`
            : null;
          const cost = Number(listing.source_cost ?? 0);
          const price = Number(listing.list_price ?? 0);
          const net = Number(listing.net_profit ?? 0);
          return (
            <>
              <div
                style={{
                  ...card,
                  marginTop: 20,
                  padding: 15,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                {listing.image_urls?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.image_urls[0]}
                    alt=""
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 10,
                      objectFit: "contain",
                      background: "#fff",
                      border: "1px solid var(--color-line)",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <ProductGlyph size={54} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {listing.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--color-muted)",
                      marginTop: 3,
                    }}
                  >
                    ${cost.toFixed(2)} source → ${price.toFixed(2)} list · est. $
                    {net.toFixed(2)} net
                  </div>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 11px",
                    background: "var(--color-go-soft)",
                    color: "var(--color-flip)",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  <IconCircleCheck size={14} /> {listing.status ?? "draft"}
                </span>
              </div>

              <div style={{ ...card, marginTop: 14 }}>
                <TitleField defaultValue={listing.title ?? ""} max={80} />
              </div>

              <div style={{ ...card, marginTop: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Listing setup</div>
                <div style={{ marginTop: 10 }}>
                  <SetupLine k="Condition" v="New" />
                  <SetupLine k="Format" v="Buy It Now" />
                  <SetupLine k="Source cost" v={`$${cost.toFixed(2)}`} />
                  <SetupLine k="List price" v={`$${price.toFixed(2)}`} />
                  <SetupLine k="Est. net" v={`$${net.toFixed(2)}`} />
                </div>
                {amazonUrl ? (
                  <a
                    href={amazonUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--color-flip)",
                      textDecoration: "none",
                    }}
                  >
                    <IconExternalLink size={13} /> View source on Amazon
                  </a>
                ) : null}
              </div>

              <div
                style={{
                  ...card,
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: "var(--color-muted)",
                }}
              >
                <IconPhoto size={20} />
                <div style={{ fontSize: 13 }}>
                  Photos and item specifics are pulled from the source listing —
                  that step is coming next.
                </div>
              </div>

              <div className="btn-row" style={{ marginTop: 18 }}>
                <form action={publishListing} style={{ display: "contents" }}>
                  <input type="hidden" name="id" value={listing.id} />
                  <button
                    type="submit"
                    style={{
                      padding: "14px 26px",
                      background: "var(--color-flip)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: "0 4px 14px -3px rgba(15,122,67,.5)",
                    }}
                  >
                    Publish to eBay <IconArrowRight size={17} />
                  </button>
                </form>
              </div>
            </>
          );
        })()
      )}
    </main>
  );
}
