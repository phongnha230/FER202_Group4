-- 1. CREATE REVIEWS TABLE
-- Reviews can only be created for orders that are 'completed' or 'delivered'

create table reviews (
  id uuid primary key default uuid_generate_v4(),
  
  -- Foreign Keys
  user_id uuid not null references profiles(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  
  -- Review Content
  rating int not null check (rating >= 1 and rating <= 5),
  title text not null check (char_length(title) >= 3),
  content text not null check (char_length(content) >= 20),
  
  -- Fit Rating: 0 = Runs Small, 50 = True to Size, 100 = Runs Large
  fit_rating int check (fit_rating in (0, 50, 100)),
  
  -- Review Images (Array of image URLs from Supabase Storage)
  images text[] default '{}',
  
  -- Metadata
  created_at timestamp default now(),
  updated_at timestamp default now(),
  
  -- Ensure one review per user per product per order
  unique(user_id, order_id, product_id)
);

-- 2. CREATE REVIEW REACTIONS TABLE (Optional: for thumbs up/down)
create table review_reactions (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references reviews(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reaction_type text check (reaction_type in ('helpful', 'not_helpful')),
  created_at timestamp default now(),
  
  -- One reaction per user per review
  unique(review_id, user_id)
);

-- 3. ENABLE RLS
alter table reviews enable row level security;
alter table review_reactions enable row level security;

-- 4. RLS POLICIES FOR REVIEWS

-- Public can read all reviews
create policy "public read reviews" 
  on reviews for select 
  using (true);

-- Users can only create reviews for their own completed/delivered orders
create policy "user create own reviews" 
  on reviews for insert 
  with check (
    user_id = (select auth.uid()) 
    and exists (
      select 1 from orders 
      where orders.id = order_id 
        and orders.user_id = (select auth.uid())
        and orders.order_status in ('completed', 'delivered')
    )
  );

-- Users can update their own reviews
-- Users can update their own reviews
create policy "user update own reviews" 
  on reviews for update 
  using (user_id = (select auth.uid()));

-- Users can delete their own reviews
create policy "user delete own reviews" 
  on reviews for delete 
  using (user_id = (select auth.uid()));

-- 5. RLS POLICIES FOR REVIEW REACTIONS

-- Public can read reactions
create policy "public read reactions" 
  on review_reactions for select 
  using (true);

-- Authenticated users can add reactions
create policy "authenticated create reactions" 
  on review_reactions for insert 
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

-- Users can delete their own reactions
create policy "user delete own reactions" 
  on review_reactions for delete 
  using (user_id = (select auth.uid()));

-- 6. CREATE INDEXES FOR PERFORMANCE
create index idx_reviews_product_id on reviews(product_id);
create index idx_reviews_user_id on reviews(user_id);
create index idx_reviews_order_id on reviews(order_id);
create index idx_review_reactions_review_id on review_reactions(review_id);

-- 7. CREATE FUNCTION TO UPDATE updated_at TIMESTAMP
create or replace function update_updated_at_column()
returns trigger 
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 8. CREATE TRIGGER TO AUTO-UPDATE updated_at
create trigger update_reviews_updated_at 
  before update on reviews
  for each row
  execute function update_updated_at_column();
