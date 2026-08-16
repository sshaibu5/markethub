import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ListingCard } from "@/components/ListingCard";
import { CATEGORIES } from "@/lib/market-data";
import { listingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MarketHub — Buy and sell locally" },
      {
        name: "description",
        content: "Browse furniture, bikes, books and more from neighbours near you on MarketHub.",
      },
      { property: "og:title", content: "MarketHub — Buy and sell locally" },
      {
        property: "og:description",
        content: "Browse furniture, bikes, books and more from neighbours near you.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(listingsQuery()),
  component: BrowsePage,
});

function BrowsePage() {
  const { data: listings } = useSuspenseQuery(listingsQuery());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter((listing) => {
      const matchesCategory = !category || listing.category === category;
      const matchesSearch =
        !q ||
        listing.title.toLowerCase().includes(q) ||
        listing.description.toLowerCase().includes(q) ||
        listing.location.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [listings, search, category]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of listings) map[l.category] = (map[l.category] ?? 0) + 1;
    return map;
  }, [listings]);


  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="max-w-2xl text-4xl sm:text-5xl">Good things, close by</h1>
      <p className="deck mt-3 max-w-xl">
        Buy and sell with people in your neighbourhood — no shipping, no middlemen.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings"
          aria-label="Search listings"
          className="w-full max-w-md rounded-full border border-border bg-card px-5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        />
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!category} onClick={() => setCategory(null)}>
            All
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </FilterChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-16 text-muted-foreground">No listings match that search yet.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
