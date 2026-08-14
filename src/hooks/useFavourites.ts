import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { favouritesQuery } from "@/lib/queries";
import { toggleFavourite } from "@/lib/social.functions";

export function useFavourites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toggleFn = useServerFn(toggleFavourite);

  const { data: ids = [] } = useQuery(favouritesQuery(!!user));

  const mutation = useMutation({
    mutationFn: (listingId: string) => toggleFn({ data: { listingId } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      toast.success(result.saved ? "Saved" : "Removed from saved");
    },
    onError: () => toast.error("Couldn't update your saved items"),
  });

  return {
    favouriteIds: ids,
    isFavourite: (id: string) => ids.includes(id),
    toggle: (id: string) => {
      if (!user) {
        toast("Sign in to save listings");
        navigate({ to: "/auth" });
        return;
      }
      mutation.mutate(id);
    },
  };
}
