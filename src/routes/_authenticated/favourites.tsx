import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ListingCard } from "@/components/ListingCard";
import { useFavourites } from "@/hooks/useFavourites";
import { listingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/favourites")({
  head: () => ({
    meta: [
      { title: "Saved items — MarketHub" },
      { name: "description", content: "The MarketHub listings you've saved for later." },
      { property: "og:title", content: "Saved items — MarketHub" },
      { property: "og:description", content: "The MarketHub listings you've saved for later." },
    ],
  }),
  component: FavouritesPage,
});

function FavouritesPage() {
  const { data: listings = [], isLoading } = useQuery(listingsQuery());
  const { favouriteIds } = useFavourites();
  const saved = listings.filter((listing) => favouriteIds.includes(listing.id));

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="text-4xl">Saved items</h1>
      <p className="deck mt-3">Everything you've kept an eye on.</p>

      {isLoading ? (
        <p className="mt-12 text-muted-foreground">Loading…</p>
      ) : saved.length === 0 ? (
        <p className="mt-12 text-muted-foreground">
          Nothing saved yet.{" "}
          <Link to="/" className="text-primary underline underline-offset-4">
            Browse listings
          </Link>
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
