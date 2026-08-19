CREATE TYPE admin_challenge_status AS ENUM (
  'pending',
  'allowed',
  'denied',
  'expired',
  'consumed'
);

CREATE TABLE admin_challenges (
  id text PRIMARY KEY,
  status admin_challenge_status NOT NULL DEFAULT 'pending',
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  decided_at timestamptz,
  decided_by_phone text,
  consumed_at timestamptz
);

CREATE INDEX admin_challenges_status_idx ON admin_challenges (status, created_at DESC);

CREATE TABLE admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  challenge_id text REFERENCES admin_challenges (id) ON DELETE SET NULL,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE INDEX admin_sessions_expires_idx ON admin_sessions (expires_at);
