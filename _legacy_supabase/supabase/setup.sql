-- ============================================================
-- Mobile Vet Platform - Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users with role info)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('extension_worker', 'bank_insurance', 'admin', 'government')),
  organization TEXT NOT NULL,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security definer function to read user role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN user_role;
END;
$$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by all authenticated users" 
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" 
  ON profiles FOR ALL TO authenticated 
  USING (public.get_user_role() = 'admin');

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, organization, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'extension_worker'),
    COALESCE(NEW.raw_user_meta_data->>'organization', 'Mobile Vet'),
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FARMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  region TEXT NOT NULL,
  zone TEXT NOT NULL,
  kebele TEXT NOT NULL,
  household_size INTEGER NOT NULL DEFAULT 1,
  years_farming INTEGER NOT NULL DEFAULT 0,
  registered_at DATE NOT NULL DEFAULT CURRENT_DATE,
  extension_worker_id UUID REFERENCES profiles(id),
  livestock_count INTEGER NOT NULL DEFAULT 0,
  risk_score INTEGER NOT NULL DEFAULT 50,
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  has_insurance BOOLEAN NOT NULL DEFAULT false,
  has_loan BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers viewable by all authenticated users" 
  ON farmers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Extension workers and admins can manage farmers" 
  ON farmers FOR ALL TO authenticated 
  USING (
    public.get_user_role() IN ('extension_worker', 'admin') OR
    (extension_worker_id = auth.uid())
  );

CREATE POLICY "Admins can manage all farmers" 
  ON farmers FOR ALL TO authenticated 
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- ANIMALS
-- ============================================================
CREATE TABLE IF NOT EXISTS animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  tag_number TEXT NOT NULL UNIQUE,
  rfid_id TEXT NOT NULL UNIQUE,
  species TEXT NOT NULL CHECK (species IN ('cattle', 'goat', 'sheep', 'camel', 'donkey')),
  breed TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  color TEXT NOT NULL,
  weight DECIMAL NOT NULL DEFAULT 0,
  health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'sick', 'recovered', 'deceased', 'missing')),
  location TEXT NOT NULL,
  last_seen DATE NOT NULL DEFAULT CURRENT_DATE,
  vaccination_history TEXT[] DEFAULT ''{}'',
  registered_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Animals viewable by all authenticated users" 
  ON animals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Extension workers and admins can manage animals" 
  ON animals FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('extension_worker', 'admin'));

-- ============================================================
-- HEALTH RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('vaccination', 'treatment', 'checkup', 'disease', 'deworming', 'injury')),
  symptoms TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  treatment TEXT NOT NULL,
  notes TEXT,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'moderate', 'high', 'emergency')),
  follow_up_required BOOLEAN NOT NULL DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Health records viewable by all authenticated users" 
  ON health_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Extension workers and admins can manage health records" 
  ON health_records FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('extension_worker', 'admin'));

-- ============================================================
-- VISITS
-- ============================================================
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  extension_worker_id UUID REFERENCES profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  purpose TEXT NOT NULL,
  observations TEXT NOT NULL,
  recommendations TEXT NOT NULL,
  next_visit_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visits viewable by all authenticated users" 
  ON visits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Extension workers and admins can manage visits" 
  ON visits FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('extension_worker', 'admin'));

-- ============================================================
-- APPLICATIONS (Loans & Insurance)
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  farmer_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('loan', 'insurance')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reviewing')),
  amount DECIMAL NOT NULL DEFAULT 0,
  submitted_at DATE NOT NULL DEFAULT CURRENT_DATE,
  reviewed_at DATE,
  reviewed_by UUID REFERENCES profiles(id),
  notes TEXT,
  risk_score INTEGER NOT NULL DEFAULT 50,
  purpose TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applications viewable by all authenticated users" 
  ON applications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Bank/insurance and admins can manage applications" 
  ON applications FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('bank_insurance', 'admin'));

-- ============================================================
-- REGIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  zone TEXT NOT NULL,
  total_farmers INTEGER NOT NULL DEFAULT 0,
  total_animals INTEGER NOT NULL DEFAULT 0,
  avg_risk_score INTEGER NOT NULL DEFAULT 50,
  drought_risk TEXT NOT NULL DEFAULT 'low' CHECK (drought_risk IN ('low', 'medium', 'high', 'critical')),
  disease_outbreaks INTEGER NOT NULL DEFAULT 0,
  active_loans INTEGER NOT NULL DEFAULT 0,
  active_insurance INTEGER NOT NULL DEFAULT 0,
  extension_workers INTEGER NOT NULL DEFAULT 0,
  recent_alerts INTEGER NOT NULL DEFAULT 0,
  rainfall_mm INTEGER NOT NULL DEFAULT 0,
  vegetation_index DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regions viewable by all authenticated users" 
  ON regions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and government can manage regions" 
  ON regions FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'government'));

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'danger', 'success')),
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('drought', 'disease', 'weather', 'system', 'financial')),
  region TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES profiles(id)
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts and all public alerts" 
  ON alerts FOR SELECT TO authenticated 
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Admins and government can manage all alerts" 
  ON alerts FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'government'));

-- ============================================================
-- RISK PREDICTIONS (view-only, populated by ML backend)
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  farmer_name TEXT NOT NULL,
  region TEXT NOT NULL,
  overall_risk INTEGER NOT NULL DEFAULT 50,
  drought_risk INTEGER NOT NULL DEFAULT 50,
  disease_risk INTEGER NOT NULL DEFAULT 50,
  market_risk INTEGER NOT NULL DEFAULT 50,
  financial_risk INTEGER NOT NULL DEFAULT 50,
  recommendation TEXT NOT NULL,
  predicted_loss INTEGER NOT NULL DEFAULT 0,
  confidence DECIMAL NOT NULL DEFAULT 0.75,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE risk_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Risk predictions viewable by all authenticated users" 
  ON risk_predictions FOR SELECT TO authenticated USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Seed regions
INSERT INTO regions (name, zone, total_farmers, total_animals, avg_risk_score, drought_risk, disease_outbreaks, active_loans, active_insurance, extension_workers, recent_alerts, rainfall_mm, vegetation_index)
VALUES
  ('Borena Zone', 'Borena', 124, 3840, 72, 'critical', 3, 18, 42, 8, 12, 120, 0.21),
  ('Afar Region', 'Zone 1', 89, 2100, 68, 'high', 1, 12, 31, 5, 7, 85, 0.18),
  ('Somali Region', 'Shabelle', 156, 4950, 65, 'medium', 2, 22, 55, 10, 5, 200, 0.34),
  ('Oromia', 'East Hararghe', 78, 1890, 55, 'low', 0, 15, 28, 6, 2, 350, 0.52),
  ('Addis Ababa', 'Addis Ababa', 100, 3000, 60, 'medium', 1, 15, 30, 7, 3, 250, 0.45),
  ('Gambella', 'Gambella', 95, 2850, 63, 'low', 0, 14, 29, 6, 2, 220, 0.38),
  ('Harar', 'Harar', 112, 3360, 67, 'medium', 2, 19, 44, 8, 4, 280, 0.42),
  ('Jimma', 'Jimma', 130, 4200, 69, 'high', 3, 23, 58, 11, 6, 320, 0.48),
  ('Jigjiga', 'Jigjiga', 145, 4350, 71, 'critical', 4, 27, 67, 13, 8, 360, 0.54),
  ('Kaffa', 'Kaffa', 160, 4800, 73, 'critical', 5, 31, 76, 15, 10, 400, 0.60),
  ('Keren', 'Keren', 175, 5250, 75, 'critical', 6, 35, 85, 17, 12, 440, 0.66),
  ('Mekele', 'Mekele', 190, 5700, 77, 'critical', 7, 39, 94, 19, 14, 480, 0.72)
ON CONFLICT (name) DO NOTHING;

-- Seed demo users (these must be created via Supabase Auth signup, then updated in profiles)
-- After creating users via Auth, run these UPDATE statements:
-- UPDATE profiles SET role = 'admin', organization = 'Mobile Vet HQ' WHERE email = 'admin@mobilevet.et';
-- UPDATE profiles SET role = 'extension_worker', organization = 'Mobile Vet - Borena', region = 'Borena Zone' WHERE email = 'abebe@mobilevet.et';
-- UPDATE profiles SET role = 'bank_insurance', organization = 'Dashen Bank' WHERE email = 'loans@dashenbank.et';
-- UPDATE profiles SET role = 'government', organization = 'Ministry of Agriculture' WHERE email = 'solomon@moaland.gov.et';

-- Seed farmers
INSERT INTO farmers (id, full_name, phone, region, zone, kebele, household_size, years_farming, registered_at, livestock_count, risk_score, risk_level, has_insurance, has_loan, notes) VALUES
  ('2dc1ee35-c2c7-5952-9a18-fc25655bb54c', 'Gutu Boru', '+251941580232', 'Borena Zone', 'Borena', 'Dubluk', 8, 16, '2026-03-14', 50, 52, 'medium', false, false, 'Registered during Borena Zone outreach program.'),
  ('2b916c6b-a4da-561c-a169-bdc6bbb96ebe', 'Chala Dida', '+251917997008', 'Afar Region', 'Zone 1', 'Galo', 9, 14, '2025-06-30', 43, 81, 'critical', true, true, 'Registered during Afar Region outreach program.'),
  ('696dff29-6245-54c3-afe5-c5df3d1fcc01', 'Abebe Kebede', '+251935858604', 'Somali Region', 'Shabelle', 'Mega', 12, 30, '2026-03-22', 28, 56, 'medium', false, false, 'Registered during Somali Region outreach program.'),
  ('29956952-c756-54be-8206-30af4d110f50', 'Birhanu Tadesse', '+251936681653', 'Oromia', 'East Hararghe', 'Yabelo', 4, 15, '2025-07-12', 41, 83, 'critical', true, false, 'Registered during Oromia outreach program.'),
  ('712e4b40-80b1-516e-a4d2-8a43cb51df2b', 'Teshome Alemu', '+251979863422', 'Addis Ababa', 'Addis Ababa', 'Arero', 12, 18, '2025-07-24', 19, 85, 'critical', false, false, 'Registered during Addis Ababa outreach program.'),
  ('2302b2e9-8cc7-5084-a0c9-fa2975e3987a', 'Weyessa Geda', '+251996934537', 'Gambella', 'Gambella', 'Dire', 9, 5, '2025-07-02', 14, 53, 'medium', false, true, 'Registered during Gambella outreach program.'),
  ('b217ee1f-ff8a-5f63-b35f-43c108409a11', 'Daba Hailu', '+251988104958', 'Harar', 'Harar', 'Liben', 5, 16, '2025-11-02', 26, 30, 'low', true, false, 'Registered during Harar outreach program.'),
  ('76324e41-1bbb-57be-a40a-a91727259278', 'Fekadu Bekele', '+251977176422', 'Jimma', 'Jimma', 'Awa', 9, 6, '2026-04-24', 42, 72, 'high', false, false, 'Registered during Jimma outreach program.'),
  ('e75608da-8310-5e73-91e2-8fb3e1be84ec', 'Gemechu Alemayehu', '+251915398732', 'Jigjiga', 'Jigjiga', 'Gewane', 12, 7, '2025-11-28', 7, 55, 'medium', true, false, 'Registered during Jigjiga outreach program.'),
  ('a64895e3-36fe-5822-9720-3bd10e647264', 'Hunde Bonsa', '+251929694609', 'Kaffa', 'Kaffa', 'Dale', 7, 13, '2025-06-23', 43, 56, 'medium', true, true, 'Registered during Kaffa outreach program.'),
  ('47d475e2-b19d-545d-8dd1-ecb5b0ee8b06', 'Jima Dube', '+251942429582', 'Keren', 'Keren', 'Chiro', 5, 28, '2026-01-28', 29, 60, 'medium', true, true, 'Registered during Keren outreach program.'),
  ('a7070c0c-cf50-5c54-b6d0-46456bcb6291', 'Kassa Dadi', '+251934234207', 'Mekele', 'Mekele', 'Hagere', 5, 18, '2025-09-14', 46, 74, 'high', true, false, 'Registered during Mekele outreach program.'),
  ('570b11ed-6645-5acf-bee8-8e097cc72243', 'Lema Dinka', '+251954667761', 'Borena Zone', 'Borena', 'Sodo', 5, 26, '2025-07-14', 18, 85, 'critical', false, false, 'Registered during Borena Zone outreach program.'),
  ('d9e82a0c-89d8-5acd-a3ba-6633261a113e', 'Mekonnen Sori', '+251945280768', 'Afar Region', 'Zone 1', 'Konso', 11, 7, '2025-11-26', 41, 70, 'high', true, false, 'Registered during Afar Region outreach program.'),
  ('cb697e8e-f7f4-55b7-992e-b8ee2c521d0f', 'Negasa Dima', '+251997183002', 'Somali Region', 'Shabelle', 'Arba', 3, 12, '2025-12-27', 38, 56, 'medium', true, false, 'Registered during Somali Region outreach program.');

-- Seed animals
INSERT INTO animals (id, farmer_id, tag_number, rfid_id, species, breed, gender, birth_date, color, weight, health_status, location, last_seen, vaccination_history, registered_at) VALUES
  ('6dad4c0d-2a35-54b1-a878-e67f05b336a1', '2dc1ee35-c2c7-5952-9a18-fc25655bb54c', 'MV-2026-0001', 'RFID-000001', 'camel', 'Tigray', 'male', '2024-12-23', 'Black & White', 322.0, 'healthy', 'Pasture A near Dubluk', '2026-06-05', ''{"FMD, CBPP, Anthrax"}'', '2026-05-13'),
  ('9816751d-670d-5c63-a872-462bcdb63e24', '2b916c6b-a4da-561c-a169-bdc6bbb96ebe', 'MV-2026-0002', 'RFID-000002', 'camel', 'Gurage', 'female', '2022-05-23', 'Black', 352.3, 'healthy', 'Pasture B near Galo', '2026-06-06', '{"FMD, Anthrax"}', '2025-09-15'),
  ('6096b8a5-61d3-591b-91ed-7b6098ce5ca6', '696dff29-6245-54c3-afe5-c5df3d1fcc01', 'MV-2026-0003', 'RFID-000003', 'camel', 'Arsi', 'female', '2025-09-21', 'Grey', 234.5, 'healthy', 'Pasture A near Mega', '2026-06-13', '{}', '2025-08-25'),
  ('fe6cdf65-5492-5310-aa35-083cf01c9c61', '29956952-c756-54be-8206-30af4d110f50', 'MV-2026-0004', 'RFID-000004', 'camel', 'Hararghe', 'male', '2024-12-10', 'Black & White', 106.6, 'healthy', 'Pasture D near Yabelo', '2026-06-17', '{}', '2025-08-31'),
  ('a7fbf75f-387b-5a7b-adf8-b56377444323', '712e4b40-80b1-516e-a4d2-8a43cb51df2b', 'MV-2026-0005', 'RFID-000005', 'sheep', 'Afar', 'female', '2024-10-13', 'Red-brown', 352.7, 'healthy', 'Pasture D near Arero', '2026-06-16', '{"Anthrax, Blackleg"}', '2026-04-13'),
  ('cb43e988-3fed-54a8-8ed8-3fd65ed21cdf', '2302b2e9-8cc7-5084-a0c9-fa2975e3987a', 'MV-2026-0006', 'RFID-000006', 'sheep', 'Gurage', 'female', '2024-07-07', 'Black', 239.6, 'healthy', 'Pasture D near Dire', '2026-06-09', '{"FMD, Anthrax"}', '2025-09-07'),
  ('eb19144e-3ed3-553e-aa97-14d4a2d382c1', 'b217ee1f-ff8a-5f63-b35f-43c108409a11', 'MV-2026-0007', 'RFID-000007', 'donkey', 'Afar', 'male', '2023-10-02', 'Red-brown', 424.2, 'healthy', 'Pasture D near Liben', '2026-06-16', '{"FMD, Anthrax"}', '2026-01-26'),
  ('df50653f-29f1-5c9b-83b0-5fd5053dd228', '76324e41-1bbb-57be-a40a-a91727259278', 'MV-2026-0008', 'RFID-000008', 'camel', 'Tigray', 'female', '2025-09-04', 'Spotted', 59.0, 'healthy', 'Pasture C near Awa', '2026-06-06', '{}', '2025-09-28'),
  ('e09602d5-00e4-595b-93c9-a1a69bf5bc34', 'e75608da-8310-5e73-91e2-8fb3e1be84ec', 'MV-2026-0009', 'RFID-000009', 'goat', 'Dromedary', 'male', '2023-02-07', 'Tan', 126.0, 'sick', 'Pasture C near Gewane', '2026-06-05', '{"FMD, Anthrax"}', '2025-09-23'),
  ('85f90a53-4d6c-5416-b610-e3e0ef60e98a', 'a64895e3-36fe-5822-9720-3bd10e647264', 'MV-2026-0010', 'RFID-000010', 'donkey', 'Oromo', 'male', '2024-08-12', 'Brown', 24.1, 'sick', 'Pasture A near Dale', '2026-06-16', '{"FMD, Anthrax"}', '2026-04-28'),
  ('75d53b78-9a44-5162-8896-59230afdf8d1', '47d475e2-b19d-545d-8dd1-ecb5b0ee8b06', 'MV-2026-0011', 'RFID-000011', 'cattle', 'Dromedary', 'female', '2022-02-20', 'Black', 397.0, 'healthy', 'Pasture C near Chiro', '2026-06-10', '{"FMD, CBPP, Anthrax"}', '2026-02-20'),
  ('85a16634-4604-5998-a317-c7be35a96814', 'a7070c0c-cf50-5c54-b6d0-46456bcb6291', 'MV-2026-0012', 'RFID-000012', 'donkey', 'Sidama', 'female', '2024-07-22', 'Red-brown', 305.0, 'recovered', 'Pasture C near Hagere', '2026-06-08', '{"FMD, Anthrax"}', '2025-12-04'),
  ('0181062f-f3a8-5070-95d7-a3c806c44996', '570b11ed-6645-5acf-bee8-8e097cc72243', 'MV-2026-0013', 'RFID-000013', 'donkey', 'Sidama', 'male', '2022-10-27', 'Red-brown', 224.6, 'healthy', 'Pasture D near Sodo', '2026-06-10', '{"FMD, CBPP, Anthrax"}', '2026-01-14'),
  ('b5da66e2-8cef-5a7d-9bf6-dffe653bf4d5', 'd9e82a0c-89d8-5acd-a3ba-6633261a113e', 'MV-2026-0014', 'RFID-000014', 'camel', 'Gurage', 'female', '2024-08-20', 'Grey', 220.5, 'healthy', 'Pasture C near Konso', '2026-06-09', '{"Anthrax, Blackleg"}', '2025-11-16'),
  ('28d9446d-e6d2-5190-91dd-bb0f4c7c28ae', 'cb697e8e-f7f4-55b7-992e-b8ee2c521d0f', 'MV-2026-0015', 'RFID-000015', 'sheep', 'Hararghe', 'female', '2024-05-28', 'Tan', 253.2, 'healthy', 'Pasture B near Arba', '2026-06-04', '{"Anthrax, Blackleg"}', '2026-03-20'),
  ('68183012-1851-5e02-88ab-9d151bd6b571', '2dc1ee35-c2c7-5952-9a18-fc25655bb54c', 'MV-2026-0016', 'RFID-000016', 'goat', 'Gurage', 'male', '2025-03-01', 'Tan', 255.5, 'healthy', 'Pasture A near Dubluk', '2026-06-04', '{"FMD, Anthrax"}', '2026-01-08'),
  ('3871d11d-9571-5640-93cf-0d23e453fef0', '2b916c6b-a4da-561c-a169-bdc6bbb96ebe', 'MV-2026-0017', 'RFID-000017', 'camel', 'Somali', 'female', '2025-07-01', 'Grey', 327.5, 'sick', 'Pasture C near Galo', '2026-06-09', '{"Anthrax, Blackleg"}', '2026-04-26'),
  ('daeb9355-95d3-5f61-96be-9f4d47ea4c7e', '696dff29-6245-54c3-afe5-c5df3d1fcc01', 'MV-2026-0018', 'RFID-000018', 'camel', 'Boran', 'female', '2021-08-09', 'Grey', 347.6, 'healthy', 'Pasture B near Mega', '2026-06-07', '{"FMD, CBPP, Anthrax"}', '2026-03-04'),
  ('7b141539-0d3a-526e-8a7a-0a0e5475572d', '29956952-c756-54be-8206-30af4d110f50', 'MV-2026-0019', 'RFID-000019', 'camel', 'Dromedary', 'male', '2022-02-02', 'White', 255.0, 'recovered', 'Pasture D near Yabelo', '2026-06-05', '{}', '2025-10-24'),
  ('8298fbc8-5977-5bff-b62a-ce7beb802809', '712e4b40-80b1-516e-a4d2-8a43cb51df2b', 'MV-2026-0020', 'RFID-000020', 'sheep', 'Hararghe', 'male', '2021-10-28', 'Black & White', 229.3, 'healthy', 'Pasture D near Arero', '2026-06-05', '{}', '2025-11-12'),
  ('2c652ac5-f103-59d2-99c6-2e85b3be0974', '2302b2e9-8cc7-5084-a0c9-fa2975e3987a', 'MV-2026-0021', 'RFID-000021', 'goat', 'Boran', 'male', '2025-11-18', 'Red-brown', 80.5, 'healthy', 'Pasture A near Dire', '2026-06-07', '{}', '2025-12-22'),
  ('68ee079b-63d6-5763-99df-3c7f7aeeec52', 'b217ee1f-ff8a-5f63-b35f-43c108409a11', 'MV-2026-0022', 'RFID-000022', 'goat', 'Oromo', 'male', '2022-09-23', 'Red-brown', 134.2, 'healthy', 'Pasture C near Liben', '2026-06-18', '{"Anthrax, Blackleg"}', '2025-12-03'),
  ('a4a39abd-e7d6-597d-a55e-09f8e83bcd73', '76324e41-1bbb-57be-a40a-a91727259278', 'MV-2026-0023', 'RFID-000023', 'cattle', 'Boran', 'male', '2022-10-04', 'Grey', 281.2, 'missing', 'Pasture D near Awa', '2026-06-07', '{"FMD, Anthrax"}', '2025-08-26'),
  ('ca607aa9-dcab-5a63-af1e-426bc981f245', 'e75608da-8310-5e73-91e2-8fb3e1be84ec', 'MV-2026-0024', 'RFID-000024', 'goat', 'Oromo', 'male', '2021-11-30', 'Tan', 85.3, 'healthy', 'Pasture D near Gewane', '2026-06-08', '{}', '2026-02-22'),
  ('87fe31a8-8716-5d5e-a40a-cc377775e5ce', 'a64895e3-36fe-5822-9720-3bd10e647264', 'MV-2026-0025', 'RFID-000025', 'donkey', 'Oromo', 'female', '2024-08-06', 'Grey', 338.9, 'recovered', 'Pasture B near Dale', '2026-06-04', '{"FMD, CBPP, Anthrax"}', '2025-09-16'),
  ('a0484bb1-9c6c-553f-8245-984fb1b1b544', '47d475e2-b19d-545d-8dd1-ecb5b0ee8b06', 'MV-2026-0026', 'RFID-000026', 'sheep', 'Boran', 'male', '2025-06-02', 'Spotted', 27.8, 'healthy', 'Pasture C near Chiro', '2026-06-04', '{"Anthrax, Blackleg"}', '2026-01-26'),
  ('adccf51d-a131-5ae3-95fc-7a79b1c93734', 'a7070c0c-cf50-5c54-b6d0-46456bcb6291', 'MV-2026-0027', 'RFID-000027', 'goat', 'Somali', 'male', '2025-04-28', 'Grey', 329.1, 'healthy', 'Pasture D near Hagere', '2026-06-09', '{"FMD, Anthrax"}', '2026-03-21'),
  ('aac056bb-f4d5-5a7e-80cb-0eeca17ba404', '570b11ed-6645-5acf-bee8-8e097cc72243', 'MV-2026-0028', 'RFID-000028', 'cattle', 'Arsi', 'male', '2024-05-08', 'Spotted', 422.1, 'healthy', 'Pasture A near Sodo', '2026-06-15', '{"Anthrax, Blackleg"}', '2026-04-01'),
  ('c50b4a7d-50fa-5ee8-8ca2-84de6a20deef', 'd9e82a0c-89d8-5acd-a3ba-6633261a113e', 'MV-2026-0029', 'RFID-000029', 'cattle', 'Boran', 'female', '2024-12-25', 'Tan', 122.8, 'recovered', 'Pasture D near Konso', '2026-06-06', '{"Anthrax, Blackleg"}', '2026-02-09'),
  ('49510754-d94a-5888-9ca7-b54d921c7d9a', 'cb697e8e-f7f4-55b7-992e-b8ee2c521d0f', 'MV-2026-0030', 'RFID-000030', 'goat', 'Hararghe', 'male', '2021-08-30', 'White', 285.1, 'healthy', 'Pasture A near Arba', '2026-06-16', '{"FMD, Anthrax"}', '2025-12-22');

-- Seed health records
INSERT INTO health_records (id, animal_id, farmer_id, recorded_by, date, type, symptoms, diagnosis, treatment, notes, severity, follow_up_required, follow_up_date) VALUES
  ('ba9bdac0-72fe-57ad-b326-1cc089d1f5b2', '6dad4c0d-2a35-54b1-a878-e67f05b336a1', '2dc1ee35-c2c7-5952-9a18-fc25655bb54c', NULL, '2026-02-27', 'deworming', 'General wellness check', 'Healthy condition', 'Deworming administered, nutritional supplements recommended', 'Recorded during mobile vet field visit.', 'low', true, '2026-06-25'),
  ('562e2003-f1b8-5059-8ad7-09144e5482d9', '9816751d-670d-5c63-a872-462bcdb63e24', '2b916c6b-a4da-561c-a169-bdc6bbb96ebe', NULL, '2026-05-17', 'injury', 'Limping on left hind leg, swelling observed', 'Soft tissue injury from pasture collision', 'Anti-inflammatory, rest, wound cleaning', 'Recorded during mobile vet field visit.', 'moderate', true, '2026-06-25'),
  ('a91b4bca-7bb0-53be-9f00-ad854c6c24cf', '6096b8a5-61d3-591b-91ed-7b6098ce5ca6', '696dff29-6245-54c3-afe5-c5df3d1fcc01', NULL, '2026-04-15', 'checkup', 'General wellness check', 'Healthy condition', 'Deworming administered, nutritional supplements recommended', 'Recorded during mobile vet field visit.', 'low', false, NULL),
  ('ae53a433-9c68-541c-821d-29eaee44c27d', 'fe6cdf65-5492-5310-aa35-083cf01c9c61', '29956952-c756-54be-8206-30af4d110f50', NULL, '2026-06-03', 'treatment', 'General wellness check', 'Healthy condition', 'Deworming administered, nutritional supplements recommended', 'Recorded during mobile vet field visit.', 'low', false, NULL),
  ('7748398d-94cc-5ac4-99f7-bd081bc40bc1', 'a7fbf75f-387b-5a7b-adf8-b56377444323', '712e4b40-80b1-516e-a4d2-8a43cb51df2b', NULL, '2026-01-18', 'checkup', 'General wellness check', 'Healthy condition', 'Deworming administered, nutritional supplements recommended', 'Recorded during mobile vet field visit.', 'low', false, NULL),
  ('170b5a18-c7c0-57bc-8028-69388b72fa7a', 'cb43e988-3fed-54a8-8ed8-3fd65ed21cdf', '2302b2e9-8cc7-5084-a0c9-fa2975e3987a', NULL, '2026-05-31', 'vaccination', 'Routine vaccination', 'Preventive care', 'FMD vaccine administered, booster scheduled', 'Recorded during mobile vet field visit.', 'low', false, NULL),
  ('5117b0a4-b2c8-5208-8086-4fc6aeb8ab5c', 'eb19144e-3ed3-553e-aa97-14d4a2d382c1', 'b217ee1f-ff8a-5f63-b35f-43c108409a11', NULL, '2026-01-13', 'disease', 'Fever, reduced appetite, nasal discharge', 'Suspected respiratory infection', 'Antibiotics course for 5 days, isolation recommended', 'Recorded during mobile vet field visit.', 'high', false, NULL),
  ('c1db85ec-fde0-54bb-82b0-c633f7058ec6', 'df50653f-29f1-5c9b-83b0-5fd5053dd228', '76324e41-1bbb-57be-a40a-a91727259278', NULL, '2026-03-15', 'treatment', 'General wellness check', 'Healthy condition', 'Deworming administered, nutritional supplements recommended', 'Recorded during mobile vet field visit.', 'low', false, NULL),
  ('516146bb-791c-5c09-8877-67b9d471301c', 'e09602d5-00e4-595b-93c9-a1a69bf5bc34', 'e75608da-8310-5e73-91e2-8fb3e1be84ec', NULL, '2026-02-18', 'vaccination', 'Routine vaccination', 'Preventive care', 'FMD vaccine administered, booster scheduled', 'Recorded during mobile vet field visit.', 'low', false, NULL),
  ('46431394-625c-5170-876c-068e56c2b4a5', '85f90a53-4d6c-5416-b610-e3e0ef60e98a', 'a64895e3-36fe-5822-9720-3bd10e647264', NULL, '2026-04-04', 'deworming', 'General wellness check', 'Healthy condition', 'Deworming administered, nutritional supplements recommended', 'Recorded during mobile vet field visit.', 'low', false, NULL),
  ('be4db6ee-d07d-500c-a83e-d6fa4018ac3e', '75d53b78-9a44-5162-8896-59230afdf8d1', '47d475e2-b19d-545d-8dd1-ecb5b0ee8b06', NULL, '2026-05-15', 'injury', 'Limping on left hind leg, swelling observed', 'Soft tissue injury from pasture collision', 'Anti-inflammatory, rest, wound cleaning', 'Recorded during mobile vet field visit.', 'moderate', false, NULL),
  ('1e109f49-b7db-5e01-86eb-c174844e69f6', '85a16634-4604-5998-a317-c7be35a96814', 'a7070c0c-cf50-5c54-b6d0-46456bcb6291', NULL, '2026-02-22', 'disease', 'Fever, reduced appetite, nasal discharge', 'Suspected respiratory infection', 'Antibiotics course for 5 days, isolation recommended', 'Recorded during mobile vet field visit.', 'high', false, NULL),
  ('0e480693-7e20-574b-bcc2-9a763dc3c686', '0181062f-f3a8-5070-95d7-a3c806c44996', '570b11ed-6645-5acf-bee8-8e097cc72243', NULL, '2026-01-22', 'disease', 'Fever, reduced appetite, nasal discharge', 'Suspected respiratory infection', 'Antibiotics course for 5 days, isolation recommended', 'Recorded during mobile vet field visit.', 'moderate', false, NULL),
  ('654c25a6-c4cf-5255-9527-9d3101ae3e6c', 'b5da66e2-8cef-5a7d-9bf6-dffe653bf4d5', 'd9e82a0c-89d8-5acd-a3ba-6633261a113e', NULL, '2026-03-26', 'disease', 'Fever, reduced appetite, nasal discharge', 'Suspected respiratory infection', 'Antibiotics course for 5 days, isolation recommended', 'Recorded during mobile vet field visit.', 'high', false, NULL),
  ('e8ae1344-2146-505e-af5b-49878924eb0e', '28d9446d-e6d2-5190-91dd-bb0f4c7c28ae', 'cb697e8e-f7f4-55b7-992e-b8ee2c521d0f', NULL, '2026-06-17', 'checkup', 'General wellness check', 'Healthy condition', 'Deworming administered, nutritional supplements recommended', 'Recorded during mobile vet field visit.', 'low', true, '2026-06-25');

-- Seed visits
INSERT INTO visits (id, farmer_id, extension_worker_id, date, purpose, observations, recommendations, next_visit_date, status) VALUES
  ('c4a70cd6-9711-52cf-8266-73f099495efb', '2dc1ee35-c2c7-5952-9a18-fc25655bb54c', NULL, '2026-05-04', 'Loan application verification', 'Farmer cooperative. Animals in good condition overall. Some vaccination gaps identified.', 'Complete missing vaccinations. Schedule follow-up in 30 days. Provide drought early warning info.', '2026-07-11', 'pending'),
  ('9220bcba-c548-572c-ac76-6652ef536881', '2b916c6b-a4da-561c-a169-bdc6bbb96ebe', NULL, '2026-06-14', 'Livestock inspection and registration', 'Farmer cooperative. Animals in good condition overall. Some vaccination gaps identified.', 'Complete missing vaccinations. Schedule follow-up in 30 days. Provide drought early warning info.', '2026-07-04', 'pending'),
  ('d31118f7-d727-525a-bc8b-0deca9d8d8b8', '696dff29-6245-54c3-afe5-c5df3d1fcc01', NULL, '2026-05-17', 'Insurance assessment visit', 'Farmer cooperative. Animals in good condition overall. Some vaccination gaps identified.', 'Complete missing vaccinations. Schedule follow-up in 30 days. Provide drought early warning info.', '2026-08-11', 'cancelled'),
  ('85193067-ff59-573f-bf35-e23d21cc8b77', '29956952-c756-54be-8206-30af4d110f50', NULL, '2026-05-20', 'Follow-up on disease outbreak', 'Farmer cooperative. Animals in good condition overall. Some vaccination gaps identified.', 'Complete missing vaccinations. Schedule follow-up in 30 days. Provide drought early warning info.', '2026-08-10', 'pending'),
  ('ce954249-d4d4-5814-b428-9e37dbcba7f7', '712e4b40-80b1-516e-a4d2-8a43cb51df2b', NULL, '2026-05-22', 'Loan application verification', 'Farmer cooperative. Animals in good condition overall. Some vaccination gaps identified.', 'Complete missing vaccinations. Schedule follow-up in 30 days. Provide drought early warning info.', '2026-07-16', 'pending'),
  ('b4b143d5-569b-5a77-814c-07f2c5285d47', '2302b2e9-8cc7-5084-a0c9-fa2975e3987a', NULL, '2026-05-25', 'Livestock inspection and registration', 'Farmer cooperative. Animals in good condition overall. Some vaccination gaps identified.', 'Complete missing vaccinations. Schedule follow-up in 30 days. Provide drought early warning info.', '2026-07-10', 'completed'),
  ('5a499b98-cf98-533e-bbc5-3eadd86314a3', 'b217ee1f-ff8a-5f63-b35f-43c108409a11', NULL, '2026-05-23', 'Quarterly herd health review', 'Farmer cooperative. Animals in good condition overall. Some vaccination gaps identified.', 'Complete missing vaccinations. Schedule follow-up in 30 days. Provide drought early warning info.', '2026-07-29', 'cancelled'),
  ('251087c7-528f-589b-b9d7-1539bf603bb8', '76324e41-1bbb-57be-a40a-a91727259278', NULL, '2026-03-23', 'Drought risk assessment', 'Farmer cooperative. Animals in good condition overall. Some vaccination gaps identified.', 'Complete missing vaccinations. Schedule follow-up in 30 days. Provide drought early warning info.', '2026-07-30', 'completed'),
  ('a0002cd9-40d5-5e33-b205-fb4ffd0c06bf', 'e75608da-8310-5e73-91e2-8fb3e1be84ec', NULL, '2026-05-31', 'Pregnancy check for breeding stock', 'Farmer cooperative. Animals in good condition overall. Some vaccination gaps identified.', 'Complete missing vaccinations. Schedule follow-up in 30 days. Provide drought early warning info.', '2026-08-16', 'completed'),
  ('dce1a481-7107-59f1-a943-40e40e354b8f', 'a64895e3-36fe-5822-9720-3bd10e647264', NULL, '2026-05-09', 'Vaccination campaign follow-up', 'Farmer cooperative. Animals in good condition overall. Some vaccination gaps identified.', 'Complete missing vaccinations. Schedule follow-up in 30 days. Provide drought early warning info.', '2026-07-09', 'completed'),
  ('2e550614-19f0-555a-86ba-30519946f3fb', '47d475e2-b19d-545d-8dd1-ecb5b0ee8b06', NULL, '2026-03-28', 'Emergency response to reported illness', 'Farmer cooperative. Animals in good condition overall. Some vaccination gaps identified.', 'Complete missing vaccinations. Schedule follow-up in 30 days. Provide drought early warning info.', '2026-08-07', 'pending'),
  ('b03b9043-f800-5231-b54e-0d0fbe690738', 'a7070c0c-cf50-5c54-b6d0-46456bcb6291', NULL, '2026-05-14', 'New farmer registration and orientation', 'Farmer cooperative. Animals in good condition overall. Some vaccination gaps identified.', 'Complete missing vaccinations. Schedule follow-up in 30 days. Provide drought early warning info.', '2026-07-04', 'pending');

-- Seed applications
INSERT INTO applications (id, farmer_id, farmer_name, type, status, amount, submitted_at, risk_score, purpose, notes) VALUES
  ('e740aeb9-9fea-51fe-b8dc-a05eb632228a', '2dc1ee35-c2c7-5952-9a18-fc25655bb54c', 'Gutu Boru', 'insurance', 'reviewing', 14239, '2026-05-26', 40, 'Comprehensive herd coverage for drought and disease', 'Application reviewed during field visit.'),
  ('02120055-5b2e-5786-91c4-818db67dd103', '2b916c6b-a4da-561c-a169-bdc6bbb96ebe', 'Chala Dida', 'loan', 'reviewing', 39386, '2026-05-31', 87, 'Drought season livestock feed and veterinary supplies', 'Application reviewed during field visit.'),
  ('68fff410-9907-553d-be9f-c644fc67d2e5', '696dff29-6245-54c3-afe5-c5df3d1fcc01', 'Abebe Kebede', 'loan', 'reviewing', 142398, '2026-06-08', 78, 'Drought season livestock feed and veterinary supplies', 'Application reviewed during field visit.'),
  ('e567a616-0315-57fa-9e79-fad7aa685947', '29956952-c756-54be-8206-30af4d110f50', 'Birhanu Tadesse', 'loan', 'rejected', 127946, '2026-05-24', 61, 'Drought season livestock feed and veterinary supplies', 'Application reviewed during field visit.'),
  ('01c34896-1718-54aa-8d7f-19af2743756a', '712e4b40-80b1-516e-a4d2-8a43cb51df2b', 'Teshome Alemu', 'insurance', 'approved', 42216, '2026-04-01', 71, 'Comprehensive herd coverage for drought and disease', 'Application reviewed during field visit.'),
  ('b85fb1d7-fc7a-5779-8bfc-c9c8722a8b8e', '2302b2e9-8cc7-5084-a0c9-fa2975e3987a', 'Weyessa Geda', 'insurance', 'rejected', 18862, '2026-03-30', 41, 'Comprehensive herd coverage for drought and disease', 'Application reviewed during field visit.'),
  ('53cad41e-4887-5cf5-bdbb-55edcdbb8937', 'b217ee1f-ff8a-5f63-b35f-43c108409a11', 'Daba Hailu', 'insurance', 'rejected', 12436, '2026-03-31', 45, 'Comprehensive herd coverage for drought and disease', 'Application reviewed during field visit.'),
  ('21d481a6-8236-563c-98d7-8d2db1c0fa3b', '76324e41-1bbb-57be-a40a-a91727259278', 'Fekadu Bekele', 'loan', 'reviewing', 34467, '2026-03-31', 53, 'Drought season livestock feed and veterinary supplies', 'Application reviewed during field visit.'),
  ('0509fdd3-ce71-5bb1-8890-807854adec14', 'e75608da-8310-5e73-91e2-8fb3e1be84ec', 'Gemechu Alemayehu', 'insurance', 'rejected', 47014, '2026-06-03', 49, 'Comprehensive herd coverage for drought and disease', 'Application reviewed during field visit.'),
  ('071da688-ec83-5071-a242-88a83c3514c7', 'a64895e3-36fe-5822-9720-3bd10e647264', 'Hunde Bonsa', 'loan', 'reviewing', 113710, '2026-02-27', 81, 'Drought season livestock feed and veterinary supplies', 'Application reviewed during field visit.');

-- Seed risk predictions
INSERT INTO risk_predictions (id, farmer_id, farmer_name, region, overall_risk, drought_risk, disease_risk, market_risk, financial_risk, recommendation, predicted_loss, confidence) VALUES
  ('296014c0-12f4-58ca-826f-c2d4e9d25e03', '2dc1ee35-c2c7-5952-9a18-fc25655bb54c', 'Gutu Boru', 'Borena Zone', 36, 47, 45, 35, 46, 'Diversify herd composition. Increase insurance coverage. Consider early market exit.', 13000, 0.85),
  ('73783588-2535-513c-9685-280c04d7da36', '2b916c6b-a4da-561c-a169-bdc6bbb96ebe', 'Chala Dida', 'Afar Region', 75, 65, 84, 58, 93, 'Secure forward contracts for livestock sales. Build emergency cash reserve.', 5000, 0.73),
  ('28a2026a-bed2-5228-9769-25ea238674bf', '696dff29-6245-54c3-afe5-c5df3d1fcc01', 'Abebe Kebede', 'Somali Region', 88, 96, 88, 75, 83, 'Secure forward contracts for livestock sales. Build emergency cash reserve.', 29000, 0.87),
  ('47224898-4279-58a3-a18e-ee2d35437a41', '29956952-c756-54be-8206-30af4d110f50', 'Birhanu Tadesse', 'Oromia', 53, 68, 46, 54, 65, 'Maintain current practices. Monitor satellite alerts weekly.', 40000, 0.75),
  ('d1120687-4939-58d5-b22c-d70fde4bb787', '712e4b40-80b1-516e-a4d2-8a43cb51df2b', 'Teshome Alemu', 'Addis Ababa', 45, 58, 58, 28, 35, 'Relocate to higher rainfall zone. Apply for drought relief fund. Implement water harvesting.', 23000, 0.9),
  ('41cb9485-2327-5719-8404-4f7236a2b349', '2302b2e9-8cc7-5084-a0c9-fa2975e3987a', 'Weyessa Geda', 'Gambella', 42, 29, 46, 49, 57, 'Diversify herd composition. Increase insurance coverage. Consider early market exit.', 35000, 0.82),
  ('2122e74d-32b9-5ced-9646-8b9b78ccfc28', 'b217ee1f-ff8a-5f63-b35f-43c108409a11', 'Daba Hailu', 'Harar', 64, 80, 77, 64, 78, 'Diversify herd composition. Increase insurance coverage. Consider early market exit.', 19000, 0.9),
  ('c907e6d8-8bac-5ec6-9b8b-7593b016fdd7', '76324e41-1bbb-57be-a40a-a91727259278', 'Fekadu Bekele', 'Jimma', 84, 91, 88, 71, 83, 'Diversify herd composition. Increase insurance coverage. Consider early market exit.', 5000, 0.91),
  ('3c3a3692-c802-5391-97b1-3bb9f0a24c0f', 'e75608da-8310-5e73-91e2-8fb3e1be84ec', 'Gemechu Alemayehu', 'Jigjiga', 72, 65, 69, 71, 69, 'Secure forward contracts for livestock sales. Build emergency cash reserve.', 31000, 0.69),
  ('f97e1542-c0de-53e6-9706-80b5e9c13e8e', 'a64895e3-36fe-5822-9720-3bd10e647264', 'Hunde Bonsa', 'Kaffa', 83, 99, 79, 76, 82, 'Diversify herd composition. Increase insurance coverage. Consider early market exit.', 16000, 0.79);

-- Seed alerts
INSERT INTO alerts (id, title, message, severity, type, region, read, user_id) VALUES
  ('abb9abb1-08a1-5f72-9aa6-f7abbe54ddf0', 'Drought Warning: Borena Zone', 'NDVI below 0.25 for 3 consecutive weeks. Expected rainfall decrease of 40%. Activate early response protocols.', 'danger', 'drought', 'Borena Zone', false, NULL),
  ('09437f1e-625c-5143-9d75-5c1de3d3a272', 'Disease Outbreak: Afar Region', '3 confirmed cases of CBPP in Zone 1. Quarantine recommended for affected kebeles.', 'danger', 'disease', 'Afar Region', false, NULL),
  ('6ce0f5d8-766e-51d2-91da-f305861a587c', 'Market Price Alert: Somali Region', 'Livestock prices dropped 15% in Shabelle market. Consider delayed sale for better prices.', 'warning', 'financial', 'Somali Region', false, NULL),
  ('ea2a8e94-6af2-535a-90ca-d85fb83ad797', 'Vaccination Due: Oromia', '50 animals in East Hararghe due for FMD booster within 7 days. Schedule mobile vet visit.', 'warning', 'system', 'Oromia', false, NULL),
  ('40e0477b-8cc5-55e2-9e47-262c87692428', 'Heavy Rain Forecast: Jimma', 'Expected 200mm rainfall in next 48 hours. Prepare flood mitigation for low-lying pastures.', 'warning', 'weather', 'Jimma', false, NULL),
  ('e5f2bab6-4e5e-507d-96dc-f651bc6a3841', 'System Maintenance', 'Platform will undergo scheduled maintenance on Sunday 02:00-04:00 EAT. Save your work.', 'info', 'system', 'All Regions', false, NULL),
  ('b8663cd8-7460-515d-b360-4d51cc3a409f', 'Loan Approved: Gutu Boru', 'Your livestock loan application has been approved. Contact Dashen Bank for disbursement.', 'success', 'financial', 'Borena Zone', false, NULL),
  ('b0bf482f-6a5f-5c9a-8a8d-69742e87b8a5', 'Insurance Renewal: Afar Region', 'Annual herd insurance expires in 30 days. Renew now to maintain coverage.', 'warning', 'financial', 'Afar Region', false, NULL);
