import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { CATEGORIES, useMarket } from "@/lib/market";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Post an item — MarketHub" },
      { name: "description", content: "List something for sale on MarketHub in under a minute." },
      { property: "og:title", content: "Post an item — MarketHub" },
      { property: "og:description", content: "List something for sale on MarketHub in under a minute." },
    ],
  }),
  component: Sell,
});

function Sell() {
  const { addListing } = useMarket();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: CATEGORIES[0] as string,
    location: "",
    seller: "",
    sellerEmail: "",
    description: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-16">
      <h1 className="text-4xl sm:text-5xl">Post an item</h1>
      <p className="deck mt-3">Tell your neighbours what you're selling</p>

      <form
        className="mt-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const listing = addListing({
            title: form.title,
            price: Number(form.price) || 0,
            category: form.category,
            location: form.location,
            seller: form.seller,
            sellerEmail: form.sellerEmail,
            description: form.description,
          });
          navigate({ to: "/listing/$id", params: { id: listing.id } });
        }}
      >
        <Field label="What are you selling?">
          <input required value={form.title} onChange={set("title")} className={inputClass} placeholder="Oak dining table" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Price (£)">
            <input required type="number" min="0" value={form.price} onChange={set("price")} className={inputClass} placeholder="60" />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={set("category")} className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Neighbourhood">
          <input required value={form.location} onChange={set("location")} className={inputClass} placeholder="Old Town" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name">
            <input required value={form.seller} onChange={set("seller")} className={inputClass} placeholder="Sam T." />
          </Field>
          <Field label="Your email">
            <input required type="email" value={form.sellerEmail} onChange={set("sellerEmail")} className={inputClass} placeholder="sam@example.com" />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={set("description")}
            className={`${inputClass} resize-none`}
            placeholder="Condition, size, why you're selling, collection details."
          />
        </Field>

        <button
          type="submit"
          className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Publish listing
        </button>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
