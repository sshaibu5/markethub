-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Neighbour',
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, contact_email)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''), split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- LISTINGS
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users ON DELETE SET NULL,
  seller_name TEXT NOT NULL DEFAULT 'Neighbour',
  title TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  is_sold BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT ON public.listings TO anon;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listings are viewable by everyone" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Sellers can create their own listings" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their own listings" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete their own listings" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = seller_id);
CREATE INDEX listings_created_at_idx ON public.listings (created_at DESC);
CREATE INDEX listings_seller_idx ON public.listings (seller_id);

-- FAVOURITES
CREATE TABLE public.favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.favourites TO authenticated;
GRANT ALL ON public.favourites TO service_role;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own favourites" ON public.favourites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own favourites" ON public.favourites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own favourites" ON public.favourites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read their messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages as themselves" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE INDEX messages_recipient_idx ON public.messages (recipient_id, created_at DESC);

-- STORAGE POLICIES
CREATE POLICY "Listing photos are readable" ON storage.objects FOR SELECT USING (bucket_id = 'listing-photos');
CREATE POLICY "Users can upload their own listing photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own listing photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own listing photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- SEED LISTINGS
INSERT INTO public.listings (seller_name, title, price, category, location, description, image_url, created_at) VALUES
  ('Nadia K.', 'Vintage leather armchair', 180, 'Furniture', 'Riverside', 'Well-loved tufted leather armchair. Some patina on the arms, frame is solid. Collection only — it''s heavy.', 'seed:armchair', now() - interval '2 days'),
  ('Tomas R.', 'Steel road bike, 56cm', 340, 'Bikes', 'Old Town', 'Serviced last month: new chain, cassette and bar tape. Rides beautifully, selling because I moved to a folding bike.', 'seed:bike', now() - interval '5 hours'),
  ('Ines M.', 'Box of paperbacks + desk lamp', 25, 'Books', 'Northfield', 'About 20 novels, mostly crime and sci-fi, plus a working adjustable desk lamp.', 'seed:books', now() - interval '1 day'),
  ('Ade O.', '35mm SLR film camera', 120, 'Electronics', 'Harbour', 'Fully mechanical body with a 50mm f/1.8 lens. Light seals replaced, meter reads accurately.', 'seed:camera', now() - interval '3 days'),
  ('Lucy P.', 'Large monstera in terracotta', 45, 'Garden', 'Riverside', 'Four years old, very happy plant. Too big for my flat now. Pot included.', 'seed:plant', now() - interval '6 days'),
  ('Marek S.', 'Dreadnought acoustic guitar', 150, 'Music', 'Old Town', 'Solid spruce top, plays in tune all the way up the neck. Comes with a soft case and spare strings.', 'seed:guitar', now() - interval '7 days');