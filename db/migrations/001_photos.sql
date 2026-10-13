-- Photos for farmers, animals, health records and visits.
-- Idempotent: safe to run on fresh and existing databases (npm run db:migrate).
-- Images are resized in the browser before upload; the original is never stored.

CREATE TABLE IF NOT EXISTS photos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id        UUID REFERENCES farmers(id) ON DELETE CASCADE,
  animal_id        UUID REFERENCES animals(id) ON DELETE CASCADE,
  health_record_id UUID REFERENCES health_records(id) ON DELETE CASCADE,
  visit_id         UUID REFERENCES visits(id) ON DELETE CASCADE,
  content_type     TEXT NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp')),
  data             BYTEA NOT NULL,          -- display size (max ~1600px)
  thumb            BYTEA NOT NULL,          -- ~400px thumbnail for lists
  width            INTEGER,
  height           INTEGER,
  size_bytes       INTEGER NOT NULL,
  caption          TEXT NOT NULL DEFAULT '',
  uploaded_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- each photo belongs to exactly one record
  CONSTRAINT photos_one_owner CHECK (num_nonnulls(farmer_id, animal_id, health_record_id, visit_id) = 1)
);

CREATE INDEX IF NOT EXISTS photos_farmer_idx ON photos (farmer_id, created_at DESC) WHERE farmer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS photos_animal_idx ON photos (animal_id, created_at DESC) WHERE animal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS photos_health_idx ON photos (health_record_id) WHERE health_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS photos_visit_idx ON photos (visit_id) WHERE visit_id IS NOT NULL;
