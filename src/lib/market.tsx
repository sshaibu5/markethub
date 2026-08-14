import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import armchair from "@/assets/item-armchair.jpg";
import bike from "@/assets/item-bike.jpg";
import books from "@/assets/item-books.jpg";
import camera from "@/assets/item-camera.jpg";
import plant from "@/assets/item-plant.jpg";
import guitar from "@/assets/item-guitar.jpg";

export type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  seller: string;
  sellerEmail: string;
  description: string;
  image: string;
  postedAt: string;
};

export const CATEGORIES = [
  "Furniture",
  "Bikes",
  "Books",
  "Electronics",
  "Garden",
  "Music",
] as const;

const seed: Listing[] = [
  {
    id: "armchair",
    title: "Vintage leather armchair",
    price: 180,
    category: "Furniture",
    location: "Riverside",
    seller: "Nadia K.",
    sellerEmail: "nadia@example.com",
    description:
      "Well-loved tufted leather armchair. Some patina on the arms, frame is solid. Collection only — it's heavy.",
    image: armchair,
    postedAt: "2 days ago",
  },
  {
    id: "bike",
    title: "Steel road bike, 56cm",
    price: 340,
    category: "Bikes",
    location: "Old Town",
    seller: "Tomas R.",
    sellerEmail: "tomas@example.com",
    description:
      "Serviced last month: new chain, cassette and bar tape. Rides beautifully, selling because I moved to a folding bike.",
    image: bike,
    postedAt: "5 hours ago",
  },
  {
    id: "books",
    title: "Box of paperbacks + desk lamp",
    price: 25,
    category: "Books",
    location: "Northfield",
    seller: "Ines M.",
    sellerEmail: "ines@example.com",
    description: "About 20 novels, mostly crime and sci-fi, plus a working adjustable desk lamp.",
    image: books,
    postedAt: "1 day ago",
  },
  {
    id: "camera",
    title: "35mm SLR film camera",
    price: 120,
    category: "Electronics",
    location: "Harbour",
    seller: "Ade O.",
    sellerEmail: "ade@example.com",
    description: "Fully mechanical body with a 50mm f/1.8 lens. Light seals replaced, meter reads accurately.",
    image: camera,
    postedAt: "3 days ago",
  },
  {
    id: "plant",
    title: "Large monstera in terracotta",
    price: 45,
    category: "Garden",
    location: "Riverside",
    seller: "Lucy P.",
    sellerEmail: "lucy@example.com",
    description: "Four years old, very happy plant. Too big for my flat now. Pot included.",
    image: plant,
    postedAt: "6 days ago",
  },
  {
    id: "guitar",
    title: "Dreadnought acoustic guitar",
    price: 150,
    category: "Music",
    location: "Old Town",
    seller: "Marek S.",
    sellerEmail: "marek@example.com",
    description: "Solid spruce top, plays in tune all the way up the neck. Comes with a soft case and spare strings.",
    image: guitar,
    postedAt: "1 week ago",
  },
];

type MarketContextValue = {
  listings: Listing[];
  favourites: string[];
  toggleFavourite: (id: string) => void;
  isFavourite: (id: string) => boolean;
  addListing: (input: Omit<Listing, "id" | "postedAt" | "image"> & { image?: string }) => Listing;
};

const MarketContext = createContext<MarketContextValue | null>(null);

const FAV_KEY = "markethub:favourites";
const LISTINGS_KEY = "markethub:listings";

export function MarketProvider({ children }: { children: ReactNode }) {
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const f = localStorage.getItem(FAV_KEY);
      if (f) setFavourites(JSON.parse(f));
      const l = localStorage.getItem(LISTINGS_KEY);
      if (l) setUserListings(JSON.parse(l));
    } catch {
      /* ignore corrupted storage */
    }
  }, []);

  const toggleFavourite = useCallback((id: string) => {
    setFavourites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addListing = useCallback<MarketContextValue["addListing"]>((input) => {
    const listing: Listing = {
      ...input,
      image: input.image ?? "",
      id: `user-${Date.now()}`,
      postedAt: "just now",
    };
    setUserListings((prev) => {
      const next = [listing, ...prev];
      localStorage.setItem(LISTINGS_KEY, JSON.stringify(next));
      return next;
    });
    return listing;
  }, []);

  const value = useMemo<MarketContextValue>(() => {
    const listings = [...userListings, ...seed];
    return {
      listings,
      favourites,
      toggleFavourite,
      isFavourite: (id: string) => favourites.includes(id),
      addListing,
    };
  }, [userListings, favourites, toggleFavourite, addListing]);

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used inside MarketProvider");
  return ctx;
}

export function formatPrice(price: number) {
  return `£${price.toLocaleString()}`;
}
