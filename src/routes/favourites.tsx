import { createFileRoute, Link } from "@tanstack/react-router";

import { ListingCard } from "@/components/ListingCard";
import { useMarket } from "@/lib/market";

export const Route = createFileRoute("/favourites")({
  head: () => ({
    meta: [
      { title: "Saved listings — MarketHub" },
      { name: "description", content: "The MarketHub listings you saved for later, all in one place." },
      { property: "og:title", content: "Saved listings — MarketHub" },
      { property: "og:description", content: "The MarketHub listings you saved for later." },
    ],
  }),
  component: Favourites,
});

function Favourites() {
  const { listings, favourites } = useMarket();
  const saved = listings.filter((l) => favourites.includes(l.id));

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <h1 className="text-4xl sm:text-5xl">Saved</h1>
      <p className="deck mt-3">Items you tapped the heart on</p>

      {saved.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Nothing saved yet.{" "}
          <Link to="/" className="underline underline-offset-4">
            Browse listings
          </Link>{" "}
          and tap the heart on anything you like.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
