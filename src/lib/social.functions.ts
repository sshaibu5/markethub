import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listFavouriteIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("favourites")
      .select("listing_id")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.listing_id);
  });

export const toggleFavourite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { listingId: string }) =>
    z.object({ listingId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("favourites")
      .select("id")
      .eq("user_id", context.userId)
      .eq("listing_id", data.listingId)
      .maybeSingle();

    if (existing) {
      const { error } = await context.supabase.from("favourites").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { saved: false };
    }

    const { error } = await context.supabase
      .from("favourites")
      .insert({ user_id: context.userId, listing_id: data.listingId });
    if (error) throw new Error(error.message);
    return { saved: true };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { listingId: string; body: string }) =>
    z.object({ listingId: z.string().uuid(), body: z.string().min(1).max(1000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: listing, error: listingError } = await context.supabase
      .from("listings")
      .select("seller_id")
      .eq("id", data.listingId)
      .maybeSingle();
    if (listingError) throw new Error(listingError.message);
    if (!listing) throw new Error("Listing not found");

    const { error } = await context.supabase.from("messages").insert({
      listing_id: data.listingId,
      sender_id: context.userId,
      recipient_id: listing.seller_id,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true, demoSeller: listing.seller_id === null };
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("messages")
      .select("id, body, created_at, sender_id, recipient_id, listing_id, listings(title)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      listingId: row.listing_id,
      listingTitle: (row.listings as { title: string } | null)?.title ?? "Removed listing",
      direction: row.sender_id === context.userId ? ("sent" as const) : ("received" as const),
    }));
  });
