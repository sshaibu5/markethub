import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Heart, MapPin } from "lucide-react";

import { formatPrice, useMarket } from "@/lib/market";

export const Route = createFileRoute("/listing/$id")({
  head: () => ({
    meta: [
      { title: "Listing — MarketHub" },
      { name: "description", content: "See photos, price and seller details for this local MarketHub listing." },
      { property: "og:title", content: "Listing — MarketHub" },
      { property: "og:description", content: "See photos, price and seller details for this local listing." },
    ],
  }),
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { listings, isFavourite, toggleFavourite } = useMarket();
  const listing = listings.find((l) => l.id === id);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
        <h1 className="text-3xl">Listing not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">It may have been sold or removed.</p>
        <Link to="/" className="mt-6 inline-block underline underline-offset-4">
          Back to browsing
        </Link>
      </div>
    );
  }

  const saved = isFavourite(listing.id);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-14">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All listings
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          {listing.image ? (
            <img
              src={listing.image}
              alt={listing.title}
              width={800}
              height={600}
              className="aspect-4/3 w-full object-cover"
            />
          ) : (
            <div className="flex aspect-4/3 items-center justify-center font-display text-6xl text-muted-foreground">
              {listing.title.charAt(0)}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {listing.category} · posted {listing.postedAt}
          </p>
          <h1 className="mt-2 text-3xl leading-tight sm:text-4xl">{listing.title}</h1>
          <p className="mt-3 font-display text-3xl text-primary">{formatPrice(listing.price)}</p>

          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> {listing.location}
          </p>

          <p className="mt-5 text-sm leading-relaxed">{listing.description}</p>

          <div className="mt-6 rounded-lg border border-border bg-card p-4">
            <p className="text-sm">
              Sold by <span className="font-medium">{listing.seller}</span>
            </p>

            {sent ? (
              <p className="mt-3 text-sm text-primary">
                Message sent to {listing.seller}. They'll reply to you by email.
              </p>
            ) : (
              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Hi ${listing.seller.split(" ")[0]}, is this still available?`}
                  className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Contact seller
                </button>
              </form>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleFavourite(listing.id)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:bg-secondary"
          >
            <Heart className={saved ? "h-4 w-4 fill-destructive text-destructive" : "h-4 w-4"} />
            {saved ? "Saved" : "Save to favourites"}
          </button>
        </div>
      </div>
    </div>
  );
}
