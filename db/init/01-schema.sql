-- ============================================================
-- Mobile Vet — PostgreSQL schema (local Docker database)
-- Runs automatically on first `docker compose up` (empty volume).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- Operating areas (pastoral zones) with climate inputs.
-- Aggregate figures (farmers, animals, loans...) are NOT stored here;
-- they are computed live in the region_summary view.
-- ------------------------------------------------------------
CREATE TABLE regions (
  id                 SERIAL PRIMARY KEY,
  slug               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL UNIQUE,
  admin_region       TEXT NOT NULL,
  woredas            TEXT[] NOT NULL DEFAULT '{}',
  livelihood         TEXT NOT NULL DEFAULT 'Pastoral',
  rainfall_mm        INTEGER NOT NULL DEFAULT 0,   -- last 90 days
  rainfall_normal_mm INTEGER NOT NULL DEFAULT 1,   -- long-term mean for same 90 days
  ndvi               NUMERIC(4,2) NOT NULL DEFAULT 0.40,
  climate_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('extension_worker','bank_insurance','admin','government')),
  organization  TEXT NOT NULL,
  region_id     INTEGER REFERENCES regions(id) ON DELETE SET NULL,
  phone         TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX users_email_key ON users (lower(email));

CREATE TABLE sessions (
  token      TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

CREATE SEQUENCE farmer_code_seq;
CREATE TABLE farmers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL UNIQUE DEFAULT ('MV-F-' || lpad(nextval('farmer_code_seq')::text, 4, '0')),
  full_name           TEXT NOT NULL,
  gender              TEXT NOT NULL CHECK (gender IN ('male','female')),
  phone               TEXT NOT NULL,
  region_id           INTEGER NOT NULL REFERENCES regions(id),
  woreda              TEXT NOT NULL,
  kebele              TEXT NOT NULL,
  household_size      INTEGER NOT NULL DEFAULT 1 CHECK (household_size > 0),
  years_herding       INTEGER NOT NULL DEFAULT 0 CHECK (years_herding >= 0),
  registered_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  extension_worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes               TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX farmers_region_idx ON farmers (region_id);

CREATE TABLE animals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id     UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  tag_number    TEXT NOT NULL UNIQUE,
  rfid          TEXT NOT NULL UNIQUE,
  species       TEXT NOT NULL CHECK (species IN ('cattle','goat','sheep','camel','donkey')),
  breed         TEXT NOT NULL,
  sex           TEXT NOT NULL CHECK (sex IN ('male','female')),
  birth_date    DATE,
  color         TEXT NOT NULL DEFAULT '',
  weight_kg     NUMERIC(6,1) NOT NULL DEFAULT 0,
  health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy','sick','recovered','deceased','missing')),
  location      TEXT NOT NULL DEFAULT '',
  last_seen     DATE NOT NULL DEFAULT CURRENT_DATE,
  registered_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX animals_farmer_idx ON animals (farmer_id);

-- Vaccination history is derived from health records of type 'vaccination'.
CREATE TABLE health_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id     UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  recorded_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  record_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  type          TEXT NOT NULL CHECK (type IN ('vaccination','treatment','checkup','disease','deworming','injury')),
  symptoms      TEXT NOT NULL DEFAULT '',
  diagnosis     TEXT NOT NULL DEFAULT '',
  treatment     TEXT NOT NULL DEFAULT '',
  notes         TEXT NOT NULL DEFAULT '',
  severity      TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low','moderate','high','emergency')),
  follow_up_date DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX health_records_animal_idx ON health_records (animal_id);

CREATE TABLE visits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id           UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  extension_worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
  visit_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  purpose             TEXT NOT NULL,
  observations        TEXT NOT NULL DEFAULT '',
  recommendations     TEXT NOT NULL DEFAULT '',
  next_visit_date     DATE,
  status              TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX visits_farmer_idx ON visits (farmer_id);

CREATE TABLE applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id        UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('loan','insurance')),
  provider         TEXT NOT NULL,           -- matches users.organization of the reviewing institution
  amount_etb       NUMERIC(12,2) NOT NULL CHECK (amount_etb > 0),
  purpose          TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','rejected','completed')),
  -- approved = active (loan outstanding / policy in force); completed = loan repaid / policy closed
  risk_score_at_submission INTEGER,
  submitted_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  submitted_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at      DATE,
  reviewed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at     DATE,
  completed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  decision_notes   TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX applications_farmer_idx ON applications (farmer_id);

CREATE TABLE risk_assessments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id          UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  assessed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  overall_risk       INTEGER NOT NULL,
  drought_risk       INTEGER NOT NULL,
  disease_risk       INTEGER NOT NULL,
  market_risk        INTEGER NOT NULL,
  financial_risk     INTEGER NOT NULL,
  herd_value_etb     NUMERIC(14,2) NOT NULL DEFAULT 0,
  predicted_loss_etb NUMERIC(14,2) NOT NULL DEFAULT 0,
  confidence         NUMERIC(3,2) NOT NULL,
  recommendation     TEXT NOT NULL,
  assessed_by        UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX risk_assessments_farmer_idx ON risk_assessments (farmer_id, assessed_at DESC);

CREATE TABLE alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  severity   TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','danger','success')),
  type       TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('drought','disease','weather','system','financial')),
  region_id  INTEGER REFERENCES regions(id) ON DELETE CASCADE,  -- NULL = all regions
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Read state is per user, so one person reading an alert doesn't hide it for everyone.
CREATE TABLE alert_reads (
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (alert_id, user_id)
);

-- Partnership enquiries from the public contact form.
CREATE TABLE inquiries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  organization TEXT NOT NULL DEFAULT '',
  interest     TEXT NOT NULL DEFAULT 'general',
  message      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------
CREATE FUNCTION clamp100(v NUMERIC) RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$ SELECT GREATEST(0, LEAST(100, ROUND(v)))::int $$;

CREATE FUNCTION risk_level(score INTEGER) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN score IS NULL THEN NULL
              WHEN score <= 40 THEN 'low'
              WHEN score <= 60 THEN 'medium'
              WHEN score <= 80 THEN 'high'
              ELSE 'critical' END
$$;

-- Drought index 0-100 from vegetation (NDVI) and rainfall vs. normal.
CREATE FUNCTION drought_index(ndvi NUMERIC, rainfall INTEGER, normal INTEGER) RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$
  SELECT clamp100(
    GREATEST(0, (0.55 - ndvi) / 0.45) * 70
    + GREATEST(0, 1 - rainfall::numeric / GREATEST(normal, 1)) * 30
  )
$$;

CREATE FUNCTION species_value_etb(species TEXT) RETURNS NUMERIC
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE species
    WHEN 'camel'  THEN 120000
    WHEN 'cattle' THEN 55000
    WHEN 'donkey' THEN 15000
    WHEN 'goat'   THEN 9000
    WHEN 'sheep'  THEN 8000
    ELSE 0 END
$$;

-- ------------------------------------------------------------
-- Risk model: scores a farmer from their actual herd, health,
-- region climate and financial records, and stores the result.
-- ------------------------------------------------------------
CREATE FUNCTION assess_farmer_risk(p_farmer UUID, p_by UUID DEFAULT NULL)
RETURNS risk_assessments
LANGUAGE plpgsql AS $$
DECLARE
  f          farmers;
  r          regions;
  alive      INTEGER;
  sick       INTEGER;
  dead       INTEGER;
  events     NUMERIC;
  vacc_share NUMERIC;
  top_share  NUMERIC;
  herd_value NUMERIC;
  insured    BOOLEAN;
  in_debt    BOOLEAN;
  repaid     INTEGER;
  n_obs      INTEGER;
  d INTEGER; dis INTEGER; m INTEGER; fin INTEGER; overall INTEGER;
  rec TEXT;
  result risk_assessments;
BEGIN
  SELECT * INTO f FROM farmers WHERE id = p_farmer;
  IF NOT FOUND THEN RAISE EXCEPTION 'farmer % not found', p_farmer; END IF;
  SELECT * INTO r FROM regions WHERE id = f.region_id;

  SELECT COUNT(*) FILTER (WHERE health_status NOT IN ('deceased','missing')),
         COUNT(*) FILTER (WHERE health_status = 'sick'),
         COUNT(*) FILTER (WHERE health_status IN ('deceased','missing')),
         COALESCE(SUM(species_value_etb(species)) FILTER (WHERE health_status NOT IN ('deceased','missing')), 0)
    INTO alive, sick, dead, herd_value
    FROM animals WHERE farmer_id = p_farmer;

  SELECT COALESCE(SUM(CASE h.severity WHEN 'emergency' THEN 4 WHEN 'high' THEN 3 WHEN 'moderate' THEN 2 ELSE 1 END), 0)
    INTO events
    FROM health_records h JOIN animals a ON a.id = h.animal_id
   WHERE a.farmer_id = p_farmer AND h.type IN ('disease','injury')
     AND h.record_date >= CURRENT_DATE - 120;

  SELECT COALESCE(AVG(CASE WHEN EXISTS (
            SELECT 1 FROM health_records h WHERE h.animal_id = a.id
               AND h.type = 'vaccination' AND h.record_date >= CURRENT_DATE - 365)
          THEN 1.0 ELSE 0.0 END), 0)
    INTO vacc_share
    FROM animals a WHERE a.farmer_id = p_farmer AND a.health_status NOT IN ('deceased','missing');

  SELECT COALESCE(MAX(cnt)::numeric / NULLIF(SUM(cnt), 0), 1)
    INTO top_share
    FROM (SELECT COUNT(*) AS cnt FROM animals
           WHERE farmer_id = p_farmer AND health_status NOT IN ('deceased','missing')
           GROUP BY species) s;

  SELECT EXISTS (SELECT 1 FROM applications WHERE farmer_id = p_farmer AND type = 'insurance' AND status = 'approved'),
         EXISTS (SELECT 1 FROM applications WHERE farmer_id = p_farmer AND type = 'loan' AND status = 'approved')
    INTO insured, in_debt;

  SELECT COUNT(*) INTO repaid FROM applications WHERE farmer_id = p_farmer AND type = 'loan' AND status = 'completed';

  SELECT (SELECT COUNT(*) FROM health_records h JOIN animals a ON a.id = h.animal_id WHERE a.farmer_id = p_farmer)
       + (SELECT COUNT(*) FROM visits WHERE farmer_id = p_farmer AND status = 'completed')
    INTO n_obs;

  d   := drought_index(r.ndvi, r.rainfall_mm, r.rainfall_normal_mm);
  dis := clamp100(15 + sick::numeric / GREATEST(alive, 1) * 120 + events * 4 + dead * 4 - vacc_share * 15);
  m   := clamp100(20 + top_share * 40 + d * 0.25);
  fin := clamp100(25 + CASE WHEN insured THEN 0 ELSE 25 END
                      + CASE WHEN in_debt THEN 15 ELSE 0 END
                      + CASE WHEN alive < 6 THEN 20 WHEN alive < 12 THEN 10 ELSE 0 END
                      + CASE WHEN f.household_size >= 8 THEN 5 ELSE 0 END
                      - LEAST(repaid, 2) * 5);  -- good repayment history
  overall := clamp100(0.35 * d + 0.30 * dis + 0.15 * m + 0.20 * fin);

  rec := CASE
    WHEN overall <= 40 THEN 'Low risk. Maintain current practices and vaccination schedule; good candidate for credit products.'
    WHEN d >= GREATEST(dis, m, fin) THEN 'Drought exposure is the main driver: move the herd to dry-season grazing reserves, arrange water access and enrol in index-based livestock insurance (IBLI).'
    WHEN dis >= GREATEST(m, fin) THEN 'Herd health is the main driver: isolate sick animals, close vaccination gaps and schedule a vet follow-up within 7 days.'
    WHEN m >= fin THEN 'Herd is concentrated in one species: diversify and consider strategic destocking of mature males before prices fall.'
    ELSE 'Financial buffer is weak: enrol in livestock insurance and build savings through the local cooperative before taking new credit.'
  END;

  INSERT INTO risk_assessments (farmer_id, overall_risk, drought_risk, disease_risk, market_risk, financial_risk,
                                herd_value_etb, predicted_loss_etb, confidence, recommendation, assessed_by)
  VALUES (p_farmer, overall, d, dis, m, fin, herd_value,
          ROUND(herd_value * overall / 100.0 * 0.25 / 100) * 100,
          LEAST(0.95, 0.55 + 0.03 * LEAST(n_obs, 13)),
          rec, p_by)
  RETURNING * INTO result;
  RETURN result;
END;
$$;

-- ------------------------------------------------------------
-- Views: live, related figures used across the app
-- ------------------------------------------------------------
CREATE VIEW latest_risk AS
SELECT DISTINCT ON (farmer_id) *
  FROM risk_assessments
 ORDER BY farmer_id, assessed_at DESC;

CREATE VIEW farmer_summary AS
SELECT f.*,
       rg.name AS region_name,
       rg.admin_region,
       ew.name AS extension_worker_name,
       COALESCE(a.herd_size, 0)  AS herd_size,
       COALESCE(a.sick_count, 0) AS sick_count,
       lr.overall_risk AS risk_score,
       risk_level(lr.overall_risk) AS risk_level,
       lr.assessed_at AS risk_assessed_at,
       EXISTS (SELECT 1 FROM applications x WHERE x.farmer_id = f.id AND x.type = 'insurance' AND x.status = 'approved') AS has_insurance,
       EXISTS (SELECT 1 FROM applications x WHERE x.farmer_id = f.id AND x.type = 'loan' AND x.status = 'approved') AS has_loan,
       COALESCE(cr.active_loans, 0) AS active_loans,
       COALESCE(cr.active_debt_etb, 0) AS active_debt_etb,
       COALESCE(cr.insured_amount_etb, 0) AS insured_amount_etb,
       COALESCE(cr.repaid_loans, 0) AS repaid_loans,
       COALESCE(cr.open_requests, 0) AS open_requests,
       (SELECT MAX(v.visit_date) FROM visits v WHERE v.farmer_id = f.id AND v.status = 'completed') AS last_visit_date
  FROM farmers f
  JOIN regions rg ON rg.id = f.region_id
  LEFT JOIN users ew ON ew.id = f.extension_worker_id
  LEFT JOIN (
    SELECT farmer_id,
           COUNT(*) FILTER (WHERE health_status NOT IN ('deceased','missing')) AS herd_size,
           COUNT(*) FILTER (WHERE health_status = 'sick') AS sick_count
      FROM animals GROUP BY farmer_id
  ) a ON a.farmer_id = f.id
  LEFT JOIN latest_risk lr ON lr.farmer_id = f.id
  LEFT JOIN (
    SELECT farmer_id,
           COUNT(*) FILTER (WHERE type = 'loan' AND status = 'approved')::int AS active_loans,
           COALESCE(SUM(amount_etb) FILTER (WHERE type = 'loan' AND status = 'approved'), 0) AS active_debt_etb,
           COALESCE(SUM(amount_etb) FILTER (WHERE type = 'insurance' AND status = 'approved'), 0) AS insured_amount_etb,
           COUNT(*) FILTER (WHERE type = 'loan' AND status = 'completed')::int AS repaid_loans,
           COUNT(*) FILTER (WHERE status IN ('pending','reviewing'))::int AS open_requests
      FROM applications GROUP BY farmer_id
  ) cr ON cr.farmer_id = f.id;

CREATE VIEW region_summary AS
SELECT rg.*,
       drought_index(rg.ndvi, rg.rainfall_mm, rg.rainfall_normal_mm) AS drought_index,
       risk_level(drought_index(rg.ndvi, rg.rainfall_mm, rg.rainfall_normal_mm)) AS drought_risk,
       (SELECT COUNT(*) FROM farmers f WHERE f.region_id = rg.id)::int AS total_farmers,
       (SELECT COUNT(*) FROM animals a JOIN farmers f ON f.id = a.farmer_id
         WHERE f.region_id = rg.id AND a.health_status NOT IN ('deceased','missing'))::int AS total_animals,
       (SELECT COUNT(*) FROM animals a JOIN farmers f ON f.id = a.farmer_id
         WHERE f.region_id = rg.id AND a.health_status = 'sick')::int AS sick_animals,
       (SELECT ROUND(AVG(lr.overall_risk)) FROM latest_risk lr JOIN farmers f ON f.id = lr.farmer_id
         WHERE f.region_id = rg.id)::int AS avg_risk_score,
       (SELECT COUNT(*) FROM health_records h JOIN animals a ON a.id = h.animal_id JOIN farmers f ON f.id = a.farmer_id
         WHERE f.region_id = rg.id AND h.type = 'disease' AND h.severity IN ('high','emergency')
           AND h.record_date >= CURRENT_DATE - 60)::int AS disease_outbreaks,
       (SELECT COUNT(*) FROM applications x JOIN farmers f ON f.id = x.farmer_id
         WHERE f.region_id = rg.id AND x.type = 'loan' AND x.status = 'approved')::int AS active_loans,
       (SELECT COUNT(*) FROM applications x JOIN farmers f ON f.id = x.farmer_id
         WHERE f.region_id = rg.id AND x.type = 'insurance' AND x.status = 'approved')::int AS active_insurance,
       (SELECT COUNT(*) FROM users u WHERE u.region_id = rg.id AND u.role = 'extension_worker' AND u.status = 'active')::int AS extension_workers,
       (SELECT COUNT(*) FROM alerts al WHERE (al.region_id = rg.id) AND al.created_at >= NOW() - INTERVAL '30 days')::int AS recent_alerts
  FROM regions rg;
