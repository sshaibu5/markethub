import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { formatPrice, useMarket, type Listing } from "@/lib/market";

export function ListingCard({ listing }: { listing: Listing }) {
  const { isFavourite, toggleFavourite } = useMarket();
  const saved = isFavourite(listing.id);

  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-paper">
      <Link
        to="/listing/$id"
        params={{ id: listing.id }}
        className="block"
        aria-label={listing.title}
      >
        <div className="aspect-4/3 overflow-hidden bg-muted">
          {listing.image ? (
            <img
              src={listing.image}
              alt={listing.title}
              loading="lazy"
              width={800}
              height={600}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-3xl text-muted-foreground">
              {listing.title.charAt(0)}
            </div>
          )}
        </div>
        <div className="space-y-1 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {listing.category} · {listing.location}
          </p>
          <h3 className="text-lg leading-snug">{listing.title}</h3>
          <p className="font-display text-xl text-primary">{formatPrice(listing.price)}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleFavourite(listing.id)}
        aria-label={saved ? "Remove from favourites" : "Save to favourites"}
        aria-pressed={saved}
        className="absolute right-3 top-3 rounded-full border border-border bg-card/90 p-2 backdrop-blur transition-colors hover:bg-secondary"
      >
        <Heart
          className={saved ? "h-4 w-4 fill-destructive text-destructive" : "h-4 w-4 text-muted-foreground"}
        />
      </button>
    </article>
  );
}
