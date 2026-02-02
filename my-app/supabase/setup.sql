-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CLEANUP (Optional - be careful in production)
-- Drop tables using the user's order to avoid foreign key conflicts
drop table if exists shipping_logs;
drop table if exists shipping_orders;
drop table if exists payments;
drop table if exists order_items;
drop table if exists orders;
drop table if exists cart_items;
drop table if exists carts;
drop table if exists product_images;
drop table if exists product_variants;
drop table if exists products;
drop table if exists categories;
drop table if exists ai_chat_messages;
drop table if exists ai_chat_sessions;
drop table if exists profiles;

-- 2. CREATE TABLES (User's Schema)

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address text,
  role text check (role in ('admin', 'customer')) default 'customer',
  avatar_url text, -- Combined from both profile definitions in user prompt
  created_at timestamp default now()
);

create table categories (
  id serial primary key,
  name text not null
);

create table products (
  id uuid primary key default uuid_generate_v4(),
  category_id int references categories(id),
  name text not null,
  description text,
  base_price numeric not null,
  status text check (status in ('active', 'hidden')) default 'active',
  created_at timestamp default now()
);

create table product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  size text not null,
  color text not null,
  price numeric not null,
  stock int not null default 0
);

create table product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  color text,
  image_url text not null,
  is_main boolean default false
);

create table carts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamp default now()
);

create table cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid references carts(id) on delete cascade,
  variant_id uuid references product_variants(id),
  quantity int not null default 1
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  total_price numeric not null,
  payment_method text check (payment_method in ('online', 'cod')) not null,
  payment_status text check (payment_status in ('paid', 'unpaid')) default 'unpaid',
  order_status text check (order_status in ('pending_payment', 'paid', 'processing', 'shipping', 'delivered', 'completed', 'cancelled', 'returned')) default 'pending_payment',
  created_at timestamp default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  price numeric not null,
  quantity int not null check (quantity > 0)
);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  method text check (method in ('momo','vnpay','cod')),
  status text check (status in ('pending','success','failed')) default 'pending',
  transaction_code text,
  paid_at timestamp
);

create table ai_chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  created_at timestamp default now()
);

create table ai_chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references ai_chat_sessions(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade, -- Consolidated from provided updates
  sender text check (sender in ('user','ai')),
  message text not null,
  created_at timestamp default now()
);

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

create table shipping_logs (
  id uuid primary key default uuid_generate_v4(),
  shipping_id uuid not null references shipping_orders(id) on delete cascade,
  status text not null,
  message text,
  raw_data jsonb,
  created_at timestamp default now()
);

-- 3. SCHEMA ALTERATIONS FOR FRONTEND COMPATIBILITY
-- Adding columns that exist in the Frontend interfaces but were missing in the SQL
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text unique;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured boolean default false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image text; -- Main image for backward compat / ease
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new boolean default false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock boolean default true;

-- 4. ENABLE RLS (Row Level Security)
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

-- 5. POLICIES (From User Request)
-- Profiles
create policy "user read own profile" on profiles for select using (id = auth.uid());
create policy "user update own profile" on profiles for update using (id = auth.uid());

-- Products & Categories (Public Read)
create policy "public read products" on products for select using (true);
create policy "public read categories" on categories for select using (true);
create policy "public read variants" on product_variants for select using (true);
create policy "public read images" on product_images for select using (true);

-- Orders
create policy "user read own orders" on orders for select using (user_id = auth.uid());
create policy "admin full access orders" on orders for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Order Items
create policy "user read own order items" on order_items for select using (order_id in (select id from orders where user_id = auth.uid()));

-- Carts
create policy "user own cart" on carts for all using (user_id = auth.uid());
create policy "user own cart items" on cart_items for all using (cart_id in (select id from carts where user_id = auth.uid()));

-- Shipping
create policy "user read own shipping" on shipping_orders for select using (order_id in (select id from orders where user_id = auth.uid()));
create policy "user read own shipping logs" on shipping_logs for select using (shipping_id in (select id from shipping_orders where order_id in (select id from orders where user_id = auth.uid())));

-- Payments
create policy "user own payments" on payments for select using (order_id in (select id from orders where user_id = auth.uid()));

-- AI Chat
create policy "user read own chats" on ai_chat_messages for select using (user_id = auth.uid());
create policy "user insert own chats" on ai_chat_messages for insert with check (user_id = auth.uid());
create policy "user read own chat sessions" on ai_chat_sessions for select using (user_id = auth.uid());
create policy "user insert own chat sessions" on ai_chat_sessions for insert with check (user_id = auth.uid());


-- 6. SEED DATA (From mock/products.ts)

-- Insert Categories
INSERT INTO categories (name) VALUES
('Sweaters'),
('Pants'),
('T-Shirts'),
('Hoodies'),
('Jackets');

-- Insert Products
-- Using static UUIDs to allow linking variants and images easily in this script
-- Helper function to get Category ID isn't easily possible in pure SQL values clause without subqueries, doing inline CTEs or just separate assumptions.
-- Assuming Serial IDs for categories: 1=Sweaters, 2=Pants, 3=T-Shirts, 4=Hoodies, 5=Jackets

INSERT INTO products (id, name, category_id, base_price, sale_price, image, description, slug, featured, in_stock, is_new, status) VALUES
('8d754c00-6d47-4977-8c3e-953805f45811', 'Oversized Knit Sweater', 1, 89.99, null, '/products/sweater-gray.jpg', 'Cozy oversized knit sweater perfect for casual streetwear looks', 'oversized-knit-sweater', true, true, true, 'active'),
('f5c0b94b-14d2-4360-9377-526484347712', 'Cargo Utility Pants', 2, 119.99, null, '/products/cargo-pants-olive.jpg', 'Military-inspired cargo pants with multiple pockets', 'cargo-utility-pants', true, true, true, 'active'),
('c032607a-2487-4222-9214-722765324413', 'Essential White Tee', 3, 39.99, null, '/products/white-tee.jpg', 'Premium cotton essential white t-shirt', 'essential-white-tee', true, true, true, 'active'),
('e45607a2-4872-4226-9214-725324414314', 'Urban Hoodie', 4, 99.99, 79.99, '/products/hoodie-black.jpg', 'Classic urban hoodie with premium fabric', 'urban-hoodie', true, true, false, 'active'),
('d23607a2-4872-4226-9214-725324414315', 'Denim Jacket', 5, 149.99, 129.99, '/products/denim-jacket.png', 'Vintage-style denim jacket for all seasons', 'denim-jacket', false, true, false, 'active'),
('a12307a2-4872-4226-9214-725324414316', 'Graphic Print Tee', 3, 49.99, 44.99, '/products/graphic-tee.png', 'Bold graphic print t-shirt with unique design', 'graphic-print-tee', false, true, false, 'active'),
('b45607a2-4872-4226-9214-725324414317', 'Slim Fit Jeans', 2, 89.99, 79.99, '/products/jeans-blue.png', 'Classic slim fit jeans in dark wash', 'slim-fit-jeans', false, true, false, 'active'),
('c78907a2-4872-4226-9214-725324414318', 'Bomber Jacket', 5, 179.99, null, '/products/bomber-jacket.png', 'Premium bomber jacket with satin lining', 'bomber-jacket', false, false, false, 'active');

-- Insert Product Images (Main Images)
INSERT INTO product_images (product_id, image_url, is_main) VALUES
('8d754c00-6d47-4977-8c3e-953805f45811', '/products/sweater-gray.jpg', true),
('f5c0b94b-14d2-4360-9377-526484347712', '/products/cargo-pants-olive.jpg', true),
('c032607a-2487-4222-9214-722765324413', '/products/white-tee.jpg', true),
('e45607a2-4872-4226-9214-725324414314', '/products/hoodie-black.jpg', true),
('d23607a2-4872-4226-9214-725324414315', '/products/denim-jacket.png', true),
('a12307a2-4872-4226-9214-725324414316', '/products/graphic-tee.png', true),
('b45607a2-4872-4226-9214-725324414317', '/products/jeans-blue.png', true),
('c78907a2-4872-4226-9214-725324414318', '/products/bomber-jacket.png', true);

-- Insert Product Variants (Combinations of Color x Size)
-- Note: Simplified seeding (generating a variant for each combination mentioned in mock)

-- 1. Oversized Knit Sweater (Gray, Black, Beige) x (S, M, L, XL)
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('8d754c00-6d47-4977-8c3e-953805f45811', 'Gray', 'S', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Gray', 'M', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Gray', 'L', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Gray', 'XL', 89.99, 10),
('8d754c00-6d47-4977-8c3e-953805f45811', 'Black', 'S', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Black', 'M', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Black', 'L', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Black', 'XL', 89.99, 10),
('8d754c00-6d47-4977-8c3e-953805f45811', 'Beige', 'S', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Beige', 'M', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Beige', 'L', 89.99, 10), ('8d754c00-6d47-4977-8c3e-953805f45811', 'Beige', 'XL', 89.99, 10);

-- 2. Cargo Utility Pants (Olive, Black, Khaki) x (S, M, L)
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('f5c0b94b-14d2-4360-9377-526484347712', 'Olive', 'S', 119.99, 15), ('f5c0b94b-14d2-4360-9377-526484347712', 'Olive', 'M', 119.99, 15), ('f5c0b94b-14d2-4360-9377-526484347712', 'Olive', 'L', 119.99, 15),
('f5c0b94b-14d2-4360-9377-526484347712', 'Black', 'S', 119.99, 15), ('f5c0b94b-14d2-4360-9377-526484347712', 'Black', 'M', 119.99, 15), ('f5c0b94b-14d2-4360-9377-526484347712', 'Black', 'L', 119.99, 15),
('f5c0b94b-14d2-4360-9377-526484347712', 'Khaki', 'S', 119.99, 15), ('f5c0b94b-14d2-4360-9377-526484347712', 'Khaki', 'M', 119.99, 15), ('f5c0b94b-14d2-4360-9377-526484347712', 'Khaki', 'L', 119.99, 15);

-- 3. Essential White Tee (White, Black) x (S, M, L, XL)
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('c032607a-2487-4222-9214-722765324413', 'White', 'S', 39.99, 50), ('c032607a-2487-4222-9214-722765324413', 'White', 'M', 39.99, 50), ('c032607a-2487-4222-9214-722765324413', 'White', 'L', 39.99, 50), ('c032607a-2487-4222-9214-722765324413', 'White', 'XL', 39.99, 50),
('c032607a-2487-4222-9214-722765324413', 'Black', 'S', 39.99, 50), ('c032607a-2487-4222-9214-722765324413', 'Black', 'M', 39.99, 50), ('c032607a-2487-4222-9214-722765324413', 'Black', 'L', 39.99, 50), ('c032607a-2487-4222-9214-722765324413', 'Black', 'XL', 39.99, 50);

-- 4. Urban Hoodie (Black, Gray, Navy) x (S, M, L) - Sale Price
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('e45607a2-4872-4226-9214-725324414314', 'Black', 'S', 79.99, 20), ('e45607a2-4872-4226-9214-725324414314', 'Black', 'M', 79.99, 20), ('e45607a2-4872-4226-9214-725324414314', 'Black', 'L', 79.99, 20),
('e45607a2-4872-4226-9214-725324414314', 'Gray', 'S', 79.99, 20), ('e45607a2-4872-4226-9214-725324414314', 'Gray', 'M', 79.99, 20), ('e45607a2-4872-4226-9214-725324414314', 'Gray', 'L', 79.99, 20),
('e45607a2-4872-4226-9214-725324414314', 'Navy', 'S', 79.99, 20), ('e45607a2-4872-4226-9214-725324414314', 'Navy', 'M', 79.99, 20), ('e45607a2-4872-4226-9214-725324414314', 'Navy', 'L', 79.99, 20);

-- 5. Denim Jacket (Blue, Black) x (M, L, XL) - Sale Price
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('d23607a2-4872-4226-9214-725324414315', 'Blue', 'M', 129.99, 10), ('d23607a2-4872-4226-9214-725324414315', 'Blue', 'L', 129.99, 10), ('d23607a2-4872-4226-9214-725324414315', 'Blue', 'XL', 129.99, 10),
('d23607a2-4872-4226-9214-725324414315', 'Black', 'M', 129.99, 10), ('d23607a2-4872-4226-9214-725324414315', 'Black', 'L', 129.99, 10), ('d23607a2-4872-4226-9214-725324414315', 'Black', 'XL', 129.99, 10);

-- 6. Graphic Print Tee (White, Black) x (S, M, L) - Sale Price
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('a12307a2-4872-4226-9214-725324414316', 'White', 'S', 44.99, 25), ('a12307a2-4872-4226-9214-725324414316', 'White', 'M', 44.99, 25), ('a12307a2-4872-4226-9214-725324414316', 'White', 'L', 44.99, 25),
('a12307a2-4872-4226-9214-725324414316', 'Black', 'S', 44.99, 25), ('a12307a2-4872-4226-9214-725324414316', 'Black', 'M', 44.99, 25), ('a12307a2-4872-4226-9214-725324414316', 'Black', 'L', 44.99, 25);

-- 7. Slim Fit Jeans (Blue, Black) x (S, M, L, XL) - Sale Price
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('b45607a2-4872-4226-9214-725324414317', 'Blue', 'S', 79.99, 20), ('b45607a2-4872-4226-9214-725324414317', 'Blue', 'M', 79.99, 20), ('b45607a2-4872-4226-9214-725324414317', 'Blue', 'L', 79.99, 20), ('b45607a2-4872-4226-9214-725324414317', 'Blue', 'XL', 79.99, 20),
('b45607a2-4872-4226-9214-725324414317', 'Black', 'S', 79.99, 20), ('b45607a2-4872-4226-9214-725324414317', 'Black', 'M', 79.99, 20), ('b45607a2-4872-4226-9214-725324414317', 'Black', 'L', 79.99, 20), ('b45607a2-4872-4226-9214-725324414317', 'Black', 'XL', 79.99, 20);

-- 8. Bomber Jacket (Black, Green) x (M, L) - Out of Stock
INSERT INTO product_variants (product_id, color, size, price, stock) VALUES
('c78907a2-4872-4226-9214-725324414318', 'Black', 'M', 179.99, 0), ('c78907a2-4872-4226-9214-725324414318', 'Black', 'L', 179.99, 0),
('c78907a2-4872-4226-9214-725324414318', 'Green', 'M', 179.99, 0), ('c78907a2-4872-4226-9214-725324414318', 'Green', 'L', 179.99, 0);
