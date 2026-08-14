import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { ListingCard } from "@/components/ListingCard";
import { CATEGORIES, useMarket } from "@/lib/market";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MarketHub — Buy and sell locally" },
      {
        name: "description",
        content:
          "Browse local listings, save your favourites and message sellers directly on MarketHub, your neighbourhood marketplace.",
      },
      { property: "og:title", content: "MarketHub — Buy and sell locally" },
      {
        property: "og:description",
        content: "Browse local listings, save favourites and contact sellers on MarketHub.",
      },
    ],
  }),
  component: Browse,
});

function Browse() {
  const { listings } = useMarket();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter(
      (l) =>
        (!category || l.category === category) &&
        (!q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)),
    );
  }, [listings, query, category]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="max-w-3xl">
        <h1 className="text-4xl leading-[1.05] sm:text-6xl">Everything nearby, up for grabs</h1>
        <p className="deck mt-3 text-base sm:text-lg">
          A local marketplace for the things your neighbours no longer need
        </p>
      </header>

      <div className="mt-10 flex flex-col gap-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listings"
            className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </label>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <FilterChip active={category === null} onClick={() => setCategory(null)}>
            All
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </FilterChip>
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {results.length} {results.length === 1 ? "listing" : "listings"}
      </p>

      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {results.length === 0 && (
        <p className="mt-10 text-sm text-muted-foreground">
          Nothing matches that search yet. Try another word or clear the filters.
        </p>
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
      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
