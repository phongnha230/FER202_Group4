-- =============================================
-- ADD REVIEWS BUCKET FOR REVIEW IMAGES
-- Run this in Supabase SQL Editor
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
