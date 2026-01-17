/* =========================
   CLIENTS
========================= */
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  client_code TEXT UNIQUE,
  client_type TEXT,
  company_name TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  trade_license_number TEXT,
  emirate TEXT,
  address TEXT,
  is_new_client BOOLEAN DEFAULT TRUE,
  notes TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/* =========================
   SERVICES
========================= */
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  service_type TEXT,
  default_price_dubai DECIMAL(10,2),
  default_price_other_emirates DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT
);

/* =========================
   QUOTATIONS
========================= */
CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  quotation_number TEXT UNIQUE,
  client_id INTEGER,
  client_name TEXT NOT NULL,
  service_description TEXT,
  person_name TEXT,
  license_type TEXT,
  activity TEXT,
  service_category TEXT,
  date DATE NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) DEFAULT 0,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  notes TEXT,
  converted_to_invoice BOOLEAN DEFAULT FALSE,
  invoice_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

/* =========================
   INVOICES
========================= */
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  quotation_id TEXT,
  client_id TEXT,
  client_name TEXT NOT NULL,
  person_name TEXT,
  service_type TEXT,
  license_type TEXT,
  activity TEXT,
  date DATE NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) DEFAULT 0,
  include_vat BOOLEAN DEFAULT FALSE,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'unpaid',
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  payments JSONB DEFAULT '[]',
  notes TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/* =========================
   PAYMENTS
========================= */
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  client_id INTEGER,
  client_name TEXT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/* =========================
   APPLICATIONS
========================= */
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  application_number TEXT UNIQUE,
  client_id INTEGER,
  client_name TEXT,
  person_name TEXT,
  pre_approval_mb_number TEXT,
  expected_completion DATE,
  invoice_id TEXT,
  application_type TEXT,
  application_type_description TEXT,
  emirate TEXT,
  current_step TEXT,
  steps_completed JSONB,
  status TEXT,
  start_date DATE,
  completion_date DATE,
  documents JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

/* =========================
   USERS & AUTHENTICATION
========================= */
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

/* =========================
   AUDIT LOG
========================= */
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  changed_by TEXT,
  old_data JSONB,
  new_data JSONB,
  changed_fields JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/* =========================
   USEFUL LINKS
========================= */
CREATE TABLE IF NOT EXISTS useful_links (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/* =========================
   CREATE INDEXES FOR BETTER PERFORMANCE
========================= */
CREATE INDEX IF NOT EXISTS idx_clients_client_code ON clients(client_code);
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_quotation_number ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_application_number ON applications(application_number);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
