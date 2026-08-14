import armchair from "@/assets/item-armchair.jpg";
import bike from "@/assets/item-bike.jpg";
import books from "@/assets/item-books.jpg";
import camera from "@/assets/item-camera.jpg";
import plant from "@/assets/item-plant.jpg";
import guitar from "@/assets/item-guitar.jpg";

export const CATEGORIES = [
  "Furniture",
  "Bikes",
  "Books",
  "Electronics",
  "Garden",
  "Music",
] as const;

export type Listing = {
  id: string;
  sellerId: string | null;
  sellerName: string;
  title: string;
  price: number;
  category: string;
  location: string;
  description: string;
  image: string | null;
  isSold: boolean;
  createdAt: string;
};

const SEED_IMAGES: Record<string, string> = {
  "seed:armchair": armchair,
  "seed:bike": bike,
  "seed:books": books,
  "seed:camera": camera,
  "seed:plant": plant,
  "seed:guitar": guitar,
};

/** Seed rows store a `seed:*` key; uploaded photos arrive as a signed URL. */
export function resolveImage(image: string | null): string | null {
  if (!image) return null;
  return SEED_IMAGES[image] ?? image;
}

export function formatPrice(price: number) {
  return `£${price.toLocaleString()}`;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return `${Math.round(days / 7)} weeks ago`;
}
