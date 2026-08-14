import { queryOptions } from "@tanstack/react-query";

import { getListing, listListings, listMyListings } from "@/lib/listings.functions";
import { listFavouriteIds, listMessages } from "@/lib/social.functions";

export const listingsQuery = () =>
  queryOptions({
    queryKey: ["listings"],
    queryFn: () => listListings(),
  });

export const listingQuery = (id: string) =>
  queryOptions({
    queryKey: ["listing", id],
    queryFn: () => getListing({ data: { id } }),
  });

export const myListingsQuery = () =>
  queryOptions({
    queryKey: ["my-listings"],
    queryFn: () => listMyListings(),
  });

export const favouritesQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: ["favourites"],
    queryFn: () => listFavouriteIds(),
    enabled,
  });

export const messagesQuery = () =>
  queryOptions({
    queryKey: ["messages"],
    queryFn: () => listMessages(),
  });
