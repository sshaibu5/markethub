import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { Listing } from "@/lib/market-data";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

const LISTING_COLUMNS =
  "id, seller_id, seller_name, title, price, category, location, description, image_url, is_sold, created_at";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

type AnySupabase = ReturnType<typeof publicClient>;

async function withSignedImages(client: AnySupabase, rows: ListingRow[]): Promise<Listing[]> {
  const storagePaths = rows
    .map((r) => r.image_url)
    .filter((v): v is string => !!v && !v.startsWith("seed:"));

  const signed = new Map<string, string>();
  if (storagePaths.length > 0) {
    const { data } = await client.storage
      .from("listing-photos")
      .createSignedUrls(storagePaths, 60 * 60);
    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    title: row.title,
    price: Number(row.price),
    category: row.category,
    location: row.location,
    description: row.description,
    image: row.image_url
      ? row.image_url.startsWith("seed:")
        ? row.image_url
        : (signed.get(row.image_url) ?? null)
      : null,
    isSold: row.is_sold,
    createdAt: row.created_at,
  }));
}

export const listListings = createServerFn({ method: "GET" }).handler(async () => {
  const client = publicClient();
  const { data, error } = await client
    .from("listings")
    .select(LISTING_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return withSignedImages(client, data ?? []);
});

export const getListing = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const client = publicClient();
    const { data: row, error } = await client
      .from("listings")
      .select(LISTING_COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const [listing] = await withSignedImages(client, [row]);
    return listing ?? null;
  });

export const listMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("listings")
      .select(LISTING_COLUMNS)
      .eq("seller_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return withSignedImages(publicClient(), data ?? []);
  });

const createSchema = z.object({
  title: z.string().min(2).max(120),
  price: z.number().min(0).max(1_000_000),
  category: z.string().min(1).max(40),
  location: z.string().min(1).max(80),
  description: z.string().min(1).max(2000),
  imagePath: z.string().max(300).nullable().optional(),
});

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof createSchema>) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("display_name")
      .eq("id", context.userId)
      .maybeSingle();

    const { data: row, error } = await context.supabase
      .from("listings")
      .insert({
        seller_id: context.userId,
        seller_name: profile?.display_name ?? "Neighbour",
        title: data.title,
        price: data.price,
        category: data.category,
        location: data.location,
        description: data.description,
        image_url: data.imagePath ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("listings")
      .delete()
      .eq("id", data.id)
      .eq("seller_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setListingSold = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; isSold: boolean }) =>
    z.object({ id: z.string().uuid(), isSold: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("listings")
      .update({ is_sold: data.isSold })
      .eq("id", data.id)
      .eq("seller_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
