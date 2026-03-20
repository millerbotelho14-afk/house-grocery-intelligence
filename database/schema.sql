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
  purchase_id UUID REFERENCES purchases(id),
  purchase_item_id UUID REFERENCES purchase_items(id),
  user_id UUID REFERENCES users(id),
  price NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL
);
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS purchase_id UUID REFERENCES purchases(id);
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS purchase_item_id UUID REFERENCES purchase_items(id);
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

UPDATE price_history ph
SET
  purchase_id = candidate.purchase_id,
  user_id = candidate.user_id
FROM (
  SELECT DISTINCT ON (ph_inner.id)
    ph_inner.id,
    pu.id AS purchase_id,
    pu.user_id
  FROM price_history ph_inner
  JOIN purchases pu ON pu.store_id = ph_inner.store_id
    AND pu.purchase_date = ph_inner.date
  JOIN purchase_items pi ON pi.purchase_id = pu.id
    AND pi.product_id = ph_inner.product_id
  ORDER BY ph_inner.id, pu.id
) AS candidate
WHERE ph.id = candidate.id
  AND (ph.purchase_id IS NULL OR ph.user_id IS NULL);

WITH ranked_price_history AS (
  SELECT
    id,
    purchase_id,
    product_id,
    ROW_NUMBER() OVER (PARTITION BY purchase_id, product_id ORDER BY id) AS rn
  FROM price_history
  WHERE purchase_item_id IS NULL
    AND purchase_id IS NOT NULL
),
ranked_items AS (
  SELECT
    id AS purchase_item_id,
    purchase_id,
    product_id,
    ROW_NUMBER() OVER (PARTITION BY purchase_id, product_id ORDER BY id) AS rn
  FROM purchase_items
)
UPDATE price_history ph
SET purchase_item_id = ranked_items.purchase_item_id
FROM ranked_price_history
JOIN ranked_items
  ON ranked_items.purchase_id = ranked_price_history.purchase_id
 AND ranked_items.product_id = ranked_price_history.product_id
 AND ranked_items.rn = ranked_price_history.rn
WHERE ph.id = ranked_price_history.id
  AND ph.purchase_item_id IS NULL;

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_price_history_product_date ON price_history(product_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_user_date ON price_history(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_purchase_item ON price_history(purchase_item_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_name_unique ON stores(name);
