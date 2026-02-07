-- =============================================
-- PRODUCTS BUCKET
-- =============================================

-- 1. Create a public bucket for products
-- 'public' section means files are accessible via a simple URL without signing.
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- 2. Security Policies for the 'products' bucket

-- Allow public read access (Anyone can view product images)
create policy "Products Public Access"
  on storage.objects for select
  using ( bucket_id = 'products' );

-- Allow authenticated users (Admins/Logged-in users) to upload files
-- Note: In a stricter production app, you might want to restrict this to only 'admin' role.
create policy "Products Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

-- Allow users to update their own uploaded files
create policy "Products Update Own Files"
  on storage.objects for update
  using ( bucket_id = 'products' and auth.uid() = owner );

-- Allow users to delete their own uploaded files
create policy "Products Delete Own Files"
  on storage.objects for delete
  using ( bucket_id = 'products' and auth.uid() = owner );


-- =============================================
-- REVIEWS BUCKET (for review images)
-- =============================================

-- Create a public bucket for review images
insert into storage.buckets (id, name, public)
values ('reviews', 'reviews', true)
on conflict (id) do nothing;

-- Allow public read access (Anyone can view review images)
create policy "Reviews Public Access"
  on storage.objects for select
  using ( bucket_id = 'reviews' );

-- Allow authenticated users to upload review images
create policy "Reviews Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'reviews' and auth.role() = 'authenticated' );

-- Allow users to update their own uploaded review images
create policy "Reviews Update Own Files"
  on storage.objects for update
  using ( bucket_id = 'reviews' and auth.uid() = owner );

-- Allow users to delete their own uploaded review images
create policy "Reviews Delete Own Files"
  on storage.objects for delete
  using ( bucket_id = 'reviews' and auth.uid() = owner );
