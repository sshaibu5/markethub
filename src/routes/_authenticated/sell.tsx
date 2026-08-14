import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { createListing } from "@/lib/listings.functions";
import { CATEGORIES } from "@/lib/market-data";

export const Route = createFileRoute("/_authenticated/sell")({
  head: () => ({
    meta: [
      { title: "Post an item — MarketHub" },
      { name: "description", content: "List something for sale to neighbours near you on MarketHub." },
      { property: "og:title", content: "Post an item — MarketHub" },
      { property: "og:description", content: "List something for sale to neighbours near you." },
    ],
  }),
  component: SellPage,
});

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

function SellPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const create = useServerFn(createListing);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let imagePath: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("listing-photos").upload(path, file);
        if (error) throw error;
        imagePath = path;
      }

      const result = await create({
        data: {
          title,
          price: Number(price) || 0,
          category,
          location,
          description,
          imagePath,
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["listings"] });
      toast.success("Your listing is live");
      navigate({ to: "/listing/$id", params: { id: result.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't post that listing");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <h1 className="text-4xl">Post an item</h1>
      <p className="deck mt-3">Photos and honest descriptions sell fastest.</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field label="Title">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Price (£)">
            <input
              required
              type="number"
              min={0}
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Neighbourhood">
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Description">
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Photo">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-muted-foreground"
          />
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Posting…" : "Post listing"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
