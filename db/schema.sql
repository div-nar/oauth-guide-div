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

-- Background research jobs: progress events are appended as the agent works.
ALTER TABLE generations ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS events jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS finished_at timestamptz;
CREATE INDEX IF NOT EXISTS generations_slug_status ON generations (slug, status);
