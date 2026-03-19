CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  location TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  normalized_name TEXT NOT NULL,
  category TEXT NOT NULL,
  search_vector tsvector
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  purchase_date DATE NOT NULL,
  total_value NUMERIC(10, 2) NOT NULL,
  items_count INT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES purchases(id),
  product_id UUID NOT NULL REFERENCES products(id),
  original_name TEXT NOT NULL,
  normalized_name_override TEXT,
  quantity NUMERIC(10, 3) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  user_comment TEXT
);
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS normalized_name_override TEXT;
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS user_comment TEXT;

CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  price NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_price_history_product_date ON price_history(product_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_name_unique ON stores(name);
