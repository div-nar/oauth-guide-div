CREATE TABLE IF NOT EXISTS guides (
  slug text PRIMARY KEY,
  query text NOT NULL,
  guide jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generations (
  id serial PRIMARY KEY,
  ip text NOT NULL,
  query text NOT NULL,
  status text NOT NULL DEFAULT 'started',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generations_ip_created ON generations (ip, created_at);
CREATE INDEX IF NOT EXISTS generations_created ON generations (created_at);
