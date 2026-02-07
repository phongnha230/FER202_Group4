-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CLEANUP (Drop tables with CASCADE to handle dependencies)
drop table if exists review_reactions cascade;
drop table if exists reviews cascade;
drop table if exists notifications cascade;
drop table if exists shipping_logs cascade;
drop table if exists shipping_orders cascade;
drop table if exists payments cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists cart_items cascade;
drop table if exists carts cascade;
drop table if exists product_images cascade;
drop table if exists product_variants cascade;
drop table if exists products cascade;
drop table if exists categories cascade;
drop table if exists ai_chat_messages cascade;
drop table if exists ai_chat_sessions cascade;
drop table if exists profiles cascade;

-- 2. CREATE TABLES

-- Profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address text,
  role text check (role in ('admin', 'customer')) default 'customer',
  avatar_url text,
  created_at timestamp default now()
);

-- Categories
create table categories (
  id serial primary key,
  name text not null
);

-- Products (Merged frontend compat columns into main definition)
create table products (
  id uuid primary key default uuid_generate_v4(),
  category_id int references categories(id),
  name text not null,
  description text,
  base_price numeric not null,
  status text check (status in ('active', 'hidden')) default 'active',
  created_at timestamp default now(),
  -- Frontend Compatibility Columns
  slug text unique,
  featured boolean default false,
  sale_price numeric,
  image text, -- Main image
  is_new boolean default false,
  in_stock boolean default true
);

-- Product Variants
create table product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  size text not null,
  color text not null,
  price numeric not null,
  stock int not null default 0
);

-- Product Images
create table product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  color text,
  image_url text not null,
  is_main boolean default false
);

-- Carts
create table carts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamp default now()
);

-- Cart Items
create table cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid references carts(id) on delete cascade,
  variant_id uuid references product_variants(id),
  quantity int not null default 1
);

-- Orders
create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  total_price numeric not null,
  payment_method text check (payment_method in ('online', 'cod')) not null,
  payment_status text check (payment_status in ('paid', 'unpaid')) default 'unpaid',
  order_status text check (order_status in ('pending_payment', 'paid', 'processing', 'shipping', 'delivered', 'completed', 'cancelled', 'returned')) default 'pending_payment',
  created_at timestamp default now()
);

-- Order Items
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  price numeric not null,
  quantity int not null check (quantity > 0)
);

-- Payments
create table payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  method text check (method in ('momo','vnpay','cod','card')),
  status text check (status in ('pending','success','failed')) default 'pending',
  transaction_code text,
  paid_at timestamp
);

-- Shipping Orders
create table shipping_orders (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid unique not null references orders(id) on delete cascade,
  provider text check (provider in ('ghn', 'ghtk', 'viettel_post', 'jt', 'manual')) not null,
  shipping_code text unique,
  shipping_fee numeric default 0,
  receiver_name text not null,
  receiver_phone text not null,
  receiver_address text not null,
  status text check (status in ('created', 'picking', 'shipping', 'delivered', 'failed', 'returned')) default 'created',
  shipped_at timestamp,
  delivered_at timestamp,
  created_at timestamp default now()
);

-- Shipping Logs
create table shipping_logs (
  id uuid primary key default uuid_generate_v4(),
  shipping_id uuid not null references shipping_orders(id) on delete cascade,
  status text not null,
  message text,
  raw_data jsonb,
  created_at timestamp default now()
);

-- AI Chat Sessions
create table ai_chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  created_at timestamp default now()
);

-- AI Chat Messages
create table ai_chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references ai_chat_sessions(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  sender text check (sender in ('user','ai')),
  message text not null,
  created_at timestamp default now()
);

-- Notifications
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text check (type in ('info', 'success', 'warning', 'error')) default 'info',
  is_read boolean default false,
  created_at timestamp default now()
);

-- Reviews
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  title text not null check (char_length(title) >= 3),
  content text not null check (char_length(content) >= 20),
  fit_rating int check (fit_rating in (0, 50, 100)),
  images text[] default '{}',
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(user_id, order_id, product_id)
);

-- Review Reactions
create table review_reactions (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references reviews(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reaction_type text check (reaction_type in ('helpful', 'not_helpful')),
  created_at timestamp default now(),
  unique(review_id, user_id)
);

-- 3. ENABLE RLS
alter table orders enable row level security;
alter table order_items enable row level security;
alter table shipping_orders enable row level security;
alter table shipping_logs enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table payments enable row level security;
alter table ai_chat_messages enable row level security;
alter table products enable row level security;
alter table categories enable row level security;
alter table profiles enable row level security;
alter table ai_chat_sessions enable row level security;
alter table notifications enable row level security;
alter table reviews enable row level security;
alter table review_reactions enable row level security;

-- 4. RLS POLICIES (OPTIMIZED)
-- Replaced `auth.uid()` with `(select auth.uid())` for better performance

-- Profiles
create policy "user read own profile" on profiles for select to authenticated using (id = (select auth.uid()));
create policy "user update own profile" on profiles for update to authenticated using (id = (select auth.uid()));
create policy "user can insert own profile" on profiles for insert to authenticated with check (id = (select auth.uid()));

-- Products & Categories (Public Read)
create policy "public read products" on products for select to public using (true);
create policy "public read categories" on categories for select to public using (true);
create policy "public read variants" on product_variants for select to public using (true);
create policy "public read images" on product_images for select to public using (true);

-- Orders
-- Consolidated SELECT policy to avoid "Multiple Permissive Policies" warning
create policy "orders_select_policy" on orders for select to authenticated 
using ( 
  user_id = (select auth.uid()) 
  or 
  exists (select 1 from profiles where id = (select auth.uid()) and role = 'admin')
);

-- Admin modification policies (Split due to SQL syntax limitations)
-- Consolidated INSERT policy for orders (Admin OR User own)
create policy "orders_insert_policy" on orders for insert to authenticated 
with check (
  (user_id = (select auth.uid()))
  OR
  (exists (select 1 from profiles where id = (select auth.uid()) and role = 'admin'))
);

create policy "orders_admin_update" on orders for update to authenticated 
using (exists (select 1 from profiles where id = (select auth.uid()) and role = 'admin'));

create policy "orders_admin_delete" on orders for delete to authenticated 
using (exists (select 1 from profiles where id = (select auth.uid()) and role = 'admin'));

-- Order Items
create policy "user read own order items" on order_items for select to authenticated using (order_id in (select id from orders where user_id = (select auth.uid())));

-- Carts
create policy "user own cart" on carts for all to authenticated using (user_id = (select auth.uid()));
create policy "user own cart items" on cart_items for all to authenticated using (cart_id in (select id from carts where user_id = (select auth.uid())));

-- Shipping
create policy "user read own shipping" on shipping_orders for select to authenticated using (order_id in (select id from orders where user_id = (select auth.uid())));
create policy "user read own shipping logs" on shipping_logs for select to authenticated using (shipping_id in (select id from shipping_orders where order_id in (select id from orders where user_id = (select auth.uid()))));

-- Payments
create policy "user own payments" on payments for select to authenticated using (order_id in (select id from orders where user_id = (select auth.uid())));

-- AI Chat
create policy "user read own chats" on ai_chat_messages for select to authenticated using (user_id = (select auth.uid()));
create policy "user insert own chats" on ai_chat_messages for insert to authenticated with check (user_id = (select auth.uid()));
create policy "user read own chat sessions" on ai_chat_sessions for select to authenticated using (user_id = (select auth.uid()));
create policy "user insert own chat sessions" on ai_chat_sessions for insert to authenticated with check (user_id = (select auth.uid()));

-- Notifications
create policy "Users can view their own notifications"
  on notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can update their own notifications (mark as read)"
  on notifications for update
  to authenticated
  using ((select auth.uid()) = user_id);

-- Reviews
create policy "public read reviews" 
  on reviews for select 
  to public
  using (true);

create policy "user create own reviews" 
  on reviews for insert 
  to authenticated
  with check (
    user_id = (select auth.uid()) 
    and exists (
      select 1 from orders 
      where orders.id = order_id 
        and orders.user_id = (select auth.uid())
        and orders.order_status in ('completed', 'delivered')
    )
  );

create policy "user update own reviews" 
  on reviews for update 
  to authenticated
  using (user_id = (select auth.uid()));

create policy "user delete own reviews" 
  on reviews for delete 
  to authenticated
  using (user_id = (select auth.uid()));

-- Review Reactions
create policy "public read reactions" 
  on review_reactions for select 
  to public
  using (true);

create policy "authenticated create reactions" 
  on review_reactions for insert 
  to authenticated
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "user delete own reactions" 
  on review_reactions for delete 
  to authenticated
  using (user_id = (select auth.uid()));


-- 5. FUNCTION AND TRIGGERS
create or replace function update_updated_at_column()
returns trigger 
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_reviews_updated_at 
  before update on reviews
  for each row
  execute function update_updated_at_column();

-- Indexes for performance
create index idx_reviews_product_id on reviews(product_id);
create index idx_reviews_user_id on reviews(user_id);
create index idx_reviews_order_id on reviews(order_id);
create index idx_review_reactions_review_id on review_reactions(review_id);


-- 6. STORAGE BUCKETS (If not already exists, handled gracefully by 'on conflict' usually or checking existence, but pure SQL insert might fail if exists. Using ON CONFLICT logic)

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Storage Policies
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'products' );

drop policy if exists "Authenticated Upload" on storage.objects;
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

drop policy if exists "Update Own Files" on storage.objects;
create policy "Update Own Files"
  on storage.objects for update
  using ( bucket_id = 'products' and auth.uid() = owner );

drop policy if exists "Delete Own Files" on storage.objects;
create policy "Delete Own Files"
  on storage.objects for delete
  using ( bucket_id = 'products' and auth.uid() = owner );


-- 7. SEED DATA

-- Insert Categories
INSERT INTO categories (name) VALUES
('Sweaters'),
('Pants'),
('T-Shirts'),
('Hoodies'),
('Jackets');

-- Insert Products
INSERT INTO products (id, name, category_id, base_price, sale_price, image, description, slug, featured, in_stock, is_new, status) VALUES
('8d754c00-6d47-4977-8c3e-953805f45811', 'Oversized Knit Sweater', 1, 89.99, null, '/products/sweater-gray.jpg', 'Cozy oversized knit sweater perfect for casual streetwear looks', 'oversized-knit-sweater', true, true, true, 'active'),
('f5c0b94b-14d2-4360-9377-526484347712', 'Cargo Utility Pants', 2, 119.99, null, '/products/cargo-pants-olive.jpg', 'Military-inspired cargo pants with multiple pockets', 'cargo-utility-pants', true, true, true, 'active'),
('c032607a-2487-4222-9214-722765324413', 'Essential White Tee', 3, 39.99, null, '/products/white-tee.jpg', 'Premium cotton essential white t-shirt', 'essential-white-tee', true, true, true, 'active'),
('e45607a2-4872-4226-9214-725324414314', 'Urban Hoodie', 4, 99.99, 79.99, '/products/hoodie-black.jpg', 'Classic urban hoodie with premium fabric', 'urban-hoodie', true, true, false, 'active'),
('d23607a2-4872-4226-9214-725324414315', 'Denim Jacket', 5, 149.99, 129.99, '/products/denim-jacket.png', 'Vintage-style denim jacket for all seasons', 'denim-jacket', false, true, false, 'active'),
('a12307a2-4872-4226-9214-725324414316', 'Graphic Print Tee', 3, 49.99, 44.99, '/products/graphic-tee.png', 'Bold graphic print t-shirt with unique design', 'graphic-print-tee', false, true, false, 'active'),
('b45607a2-4872-4226-9214-725324414317', 'Slim Fit Jeans', 2, 89.99, 79.99, '/products/jeans-blue.png', 'Classic slim fit jeans in dark wash', 'slim-fit-jeans', false, true, false, 'active'),
('c78907a2-4872-4226-9214-725324414318', 'Bomber Jacket', 5, 179.99, null, '/products/bomber-jacket.png', 'Premium bomber jacket with satin lining', 'bomber-jacket', false, false, false, 'active');

-- Insert Product Images
INSERT INTO product_images (product_id, image_url, is_main) VALUES
('8d754c00-6d47-4977-8c3e-953805f45811', '/products/sweater-gray.jpg', true),
('f5c0b94b-14d2-4360-9377-526484347712', '/products/cargo-pants-olive.jpg', true),
('c032607a-2487-4222-9214-722765324413', '/products/white-tee.jpg', true),
('e45607a2-4872-4226-9214-725324414314', '/products/hoodie-black.jpg', true),
('d23607a2-4872-4226-9214-725324414315', '/products/denim-jacket.png', true),
('a12307a2-4872-4226-9214-725324414316', '/products/graphic-tee.png', true),
('b45607a2-4872-4226-9214-725324414317', '/products/jeans-blue.png', true),
('c78907a2-4872-4226-9214-725324414318', '/products/bomber-jacket.png', true);

-- Insert Product Variants

-- 1. Oversized Knit Sweater
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('8d754c00-6d47-4977-8c3e-953805f45811', 'Gray', 'S', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Gray', 'M', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Gray', 'L', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Gray', 'XL', 89.99, 10),
('8d754c00-6d47-4977-8c3e-953805f45811', 'Black', 'S', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Black', 'M', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Black', 'L', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Black', 'XL', 89.99, 10),
('8d754c00-6d47-4977-8c3e-953805f45811', 'Beige', 'S', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Beige', 'M', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Beige', 'L', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Beige', 'XL', 89.99, 10);

-- 2. Cargo Utility Pants
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('f5c0b94b-14d2-4360-9377-526484347712', 'Olive', 'S', 119.99, 15), ('f5c0b94b-14d2-4360-9377-526484347712', 'Olive', 'M', 119.99, 15), ('f5c0b94b-14d2-4360-9377-526484347712', 'Olive', 'L', 119.99, 15),
('f5c0b94b-14d2-4360-9377-526484347712', 'Black', 'S', 119.99, 15), ('f5c0b94b-14d2-4360-9377-526484347712', 'Black', 'M', 119.99, 15), ('f5c0b94b-14d2-4360-9377-526484347712', 'Black', 'L', 119.99, 15),
('f5c0b94b-14d2-4360-9377-526484347712', 'Khaki', 'S', 119.99, 15), ('f5c0b94b-14d2-4360-9377-526484347712', 'Khaki', 'M', 119.99, 15), ('f5c0b94b-14d2-4360-9377-526484347712', 'Khaki', 'L', 119.99, 15);

-- 3. Essential White Tee
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('c032607a-2487-4222-9214-722765324413', 'White', 'S', 39.99, 50), ('c032607a-2487-4222-9214-722765324413', 'White', 'M', 39.99, 50), ('c032607a-2487-4222-9214-722765324413', 'White', 'L', 39.99, 50), ('c032607a-2487-4222-9214-722765324413', 'White', 'XL', 39.99, 50),
('c032607a-2487-4222-9214-722765324413', 'Black', 'S', 39.99, 50), ('c032607a-2487-4222-9214-722765324413', 'Black', 'M', 39.99, 50), ('c032607a-2487-4222-9214-722765324413', 'Black', 'L', 39.99, 50), ('c032607a-2487-4222-9214-722765324413', 'Black', 'XL', 39.99, 50);

-- 4. Urban Hoodie
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('e45607a2-4872-4226-9214-725324414314', 'Black', 'S', 79.99, 20), ('e45607a2-4872-4226-9214-725324414314', 'Black', 'M', 79.99, 20), ('e45607a2-4872-4226-9214-725324414314', 'Black', 'L', 79.99, 20),
('e45607a2-4872-4226-9214-725324414314', 'Gray', 'S', 79.99, 20), ('e45607a2-4872-4226-9214-725324414314', 'Gray', 'M', 79.99, 20), ('e45607a2-4872-4226-9214-725324414314', 'Gray', 'L', 79.99, 20),
('e45607a2-4872-4226-9214-725324414314', 'Navy', 'S', 79.99, 20), ('e45607a2-4872-4226-9214-725324414314', 'Navy', 'M', 79.99, 20), ('e45607a2-4872-4226-9214-725324414314', 'Navy', 'L', 79.99, 20);

-- 5. Denim Jacket
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('d23607a2-4872-4226-9214-725324414315', 'Blue', 'M', 129.99, 10), ('d23607a2-4872-4226-9214-725324414315', 'Blue', 'L', 129.99, 10), ('d23607a2-4872-4226-9214-725324414315', 'Blue', 'XL', 129.99, 10),
('d23607a2-4872-4226-9214-725324414315', 'Black', 'M', 129.99, 10), ('d23607a2-4872-4226-9214-725324414315', 'Black', 'L', 129.99, 10), ('d23607a2-4872-4226-9214-725324414315', 'Black', 'XL', 129.99, 10);

-- 6. Graphic Print Tee
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('a12307a2-4872-4226-9214-725324414316', 'White', 'S', 44.99, 25), ('a12307a2-4872-4226-9214-725324414316', 'White', 'M', 44.99, 25), ('a12307a2-4872-4226-9214-725324414316', 'White', 'L', 44.99, 25),
('a12307a2-4872-4226-9214-725324414316', 'Black', 'S', 44.99, 25), ('a12307a2-4872-4226-9214-725324414316', 'Black', 'M', 44.99, 25), ('a12307a2-4872-4226-9214-725324414316', 'Black', 'L', 44.99, 25);

-- 7. Slim Fit Jeans
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('b45607a2-4872-4226-9214-725324414317', 'Blue', 'S', 79.99, 20), ('b45607a2-4872-4226-9214-725324414317', 'Blue', 'M', 79.99, 20), ('b45607a2-4872-4226-9214-725324414317', 'Blue', 'L', 79.99, 20), ('b45607a2-4872-4226-9214-725324414317', 'Blue', 'XL', 79.99, 20),
('b45607a2-4872-4226-9214-725324414317', 'Black', 'S', 79.99, 20), ('b45607a2-4872-4226-9214-725324414317', 'Black', 'M', 79.99, 20), ('b45607a2-4872-4226-9214-725324414317', 'Black', 'L', 79.99, 20), ('b45607a2-4872-4226-9214-725324414317', 'Black', 'XL', 79.99, 20);

-- 8. Bomber Jacket
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('c78907a2-4872-4226-9214-725324414318', 'Black', 'M', 179.99, 0), ('c78907a2-4872-4226-9214-725324414318', 'Black', 'L', 179.99, 0),
('c78907a2-4872-4226-9214-725324414318', 'Green', 'M', 179.99, 0), ('c78907a2-4872-4226-9214-725324414318', 'Green', 'L', 179.99, 0);
