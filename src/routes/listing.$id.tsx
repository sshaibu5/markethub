import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useFavourites } from "@/hooks/useFavourites";
import { useAuth } from "@/lib/auth";
import { formatPrice, resolveImage, timeAgo } from "@/lib/market-data";
import { listingQuery } from "@/lib/queries";
import { sendMessage } from "@/lib/social.functions";

export const Route = createFileRoute("/listing/$id")({
  head: () => ({
    meta: [
      { title: "Listing — MarketHub" },
      { name: "description", content: "View this local listing and message the seller on MarketHub." },
      { property: "og:title", content: "Listing — MarketHub" },
      { property: "og:description", content: "View this local listing and message the seller." },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(listingQuery(params.id)),
  component: ListingPage,
});

function ListingPage() {
  const { id } = Route.useParams();
  const { data: listing } = useSuspenseQuery(listingQuery(id));
  const { isFavourite, toggle } = useFavourites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const send = useServerFn(sendMessage);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="text-3xl">Listing not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline underline-offset-4">
          Back to browse
        </Link>
      </div>
    );
  }

  const image = resolveImage(listing.image);
  const saved = isFavourite(listing.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast("Sign in to message the seller");
      navigate({ to: "/auth" });
      return;
    }
    setSending(true);
    try {
      await send({ data: { listingId: id, body } });
      setBody("");
      toast.success("Message sent to the seller");
    } catch {
      toast.error("Couldn't send that message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
        ← Back to browse
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          {image && (
            <img src={image} alt={listing.title} width={1200} height={900} className="w-full object-cover" />
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {listing.category} · {listing.location} · {timeAgo(listing.createdAt)}
          </p>
          <h1 className="mt-2 text-4xl">{listing.title}</h1>
          <p className="mt-2 font-display text-3xl text-primary">{formatPrice(listing.price)}</p>
          <p className="mt-5 whitespace-pre-line leading-relaxed text-muted-foreground">
            {listing.description}
          </p>
          <p className="mt-5 text-sm">Listed by {listing.sellerName}</p>

          <button
            type="button"
            onClick={() => toggle(listing.id)}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-secondary"
          >
            <Heart className={saved ? "h-4 w-4 fill-destructive text-destructive" : "h-4 w-4"} />
            {saved ? "Saved" : "Save this"}
          </button>

          <form onSubmit={submit} className="mt-10 space-y-3 border-t border-border pt-8">
            <h2 className="text-xl">Message the seller</h2>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi — is this still available?"
              className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Send message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
