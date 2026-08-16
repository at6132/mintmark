-- mintmark initial schema

CREATE TYPE product_status AS ENUM ('AVAILABLE', 'COMING_SOON');
CREATE TYPE order_status AS ENUM (
  'pending_payment',
  'paid',
  'fulfilling',
  'shipped',
  'delivered',
  'canceled',
  'refunded',
  'failed'
);
CREATE TYPE print_job_queue_status AS ENUM ('queued', 'processing', 'submitted', 'failed');
CREATE TYPE webhook_source AS ENUM ('stripe', 'lulu');

CREATE TABLE products (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  company text NOT NULL,
  title text NOT NULL,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status product_status NOT NULL DEFAULT 'COMING_SOON',
  sector text,
  ticker text,
  summary text,
  volume text,
  color text,
  module_link text,
  headquarters text,
  spine_height integer,
  spine_width integer,
  pod_package_id text NOT NULL,
  page_count integer NOT NULL,
  interior_pdf_url text NOT NULL,
  cover_pdf_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL,
  email text,
  customer_name text,
  phone text,
  status order_status NOT NULL DEFAULT 'pending_payment',
  currency text NOT NULL DEFAULT 'usd',
  subtotal_cents integer NOT NULL,
  shipping_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL,
  shipping_level text,
  shipping_address jsonb,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX orders_public_id_idx ON orders (public_id);
CREATE UNIQUE INDEX orders_stripe_session_idx ON orders (stripe_checkout_session_id);
CREATE INDEX orders_email_idx ON orders (email);
CREATE INDEX orders_status_idx ON orders (status);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES products (id),
  title text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_cents integer NOT NULL
);

CREATE INDEX order_items_order_id_idx ON order_items (order_id);

CREATE TABLE print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  status print_job_queue_status NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 8,
  run_after timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  last_error text,
  lulu_print_job_id text,
  lulu_status text,
  tracking_id text,
  tracking_url text,
  carrier text,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX print_jobs_order_id_idx ON print_jobs (order_id);
CREATE INDEX print_jobs_claim_idx ON print_jobs (status, run_after);
CREATE UNIQUE INDEX print_jobs_lulu_id_idx ON print_jobs (lulu_print_job_id);

CREATE TABLE webhook_events (
  id text PRIMARY KEY,
  source webhook_source NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  topic text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscribers (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
