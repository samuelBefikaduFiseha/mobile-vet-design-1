-- Fresh databases: apply every migration after the schema and seed.
-- Existing databases (local or Neon): run `npm run db:migrate` instead.
\i /migrations/001_photos.sql
