PRAGMA foreign_keys = ON;

/* =========================
   CLIENTS
========================= */
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_code TEXT UNIQUE,
  client_type TEXT,
  company_name TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  trade_license_number TEXT,
  emirate TEXT,
  address TEXT,
  is_new_client INTEGER DEFAULT 1,
  notes TEXT,
  deleted_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

/* =========================
   SERVICES
========================= */
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  service_type TEXT,
  default_price_dubai REAL,
  default_price_other_emirates REAL,
  is_active INTEGER DEFAULT 1,
  description TEXT
);

/* =========================
   QUOTATIONS
========================= */
CREATE TABLE IF NOT EXISTS quotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_number TEXT UNIQUE,
  client_id INTEGER,
  client_name TEXT NOT NULL,
  service_description TEXT,
  person_name TEXT,
  license_type TEXT,
  activity TEXT,
  service_category TEXT,
  date TEXT NOT NULL,
  items TEXT NOT NULL,
  subtotal REAL DEFAULT 0,
  vat_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  notes TEXT,
  converted_to_invoice INTEGER DEFAULT 0,
  invoice_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
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
  date TEXT NOT NULL,

  items TEXT NOT NULL,              -- JSON
  subtotal REAL DEFAULT 0,
  include_vat INTEGER DEFAULT 0,
  vat_amount REAL DEFAULT 0,
  total REAL NOT NULL,

  payment_status TEXT DEFAULT 'unpaid',
  amount_paid REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  payments TEXT DEFAULT '[]',        -- JSON

  notes TEXT,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP
);

/* =========================
   PAYMENTS
========================= */
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  invoice_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,

  client_id INTEGER,
  client_name TEXT NOT NULL,

  payment_date TEXT NOT NULL,
  amount REAL NOT NULL,

  method TEXT NOT NULL,
  reference TEXT,
  notes TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

/* =========================
   APPLICATIONS
========================= */
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_number TEXT UNIQUE,
  client_id INTEGER,  -- ✅ Can be NULL
  client_name TEXT,
  person_name TEXT,
  pre_approval_mb_number TEXT,
  expected_completion TEXT,
  invoice_id TEXT,
  application_type TEXT,
  application_type_description TEXT,
  emirate TEXT,
  current_step TEXT,
  steps_completed TEXT,       -- JSON
  status TEXT,
  start_date TEXT,
  completion_date TEXT,
  documents TEXT,             -- JSON
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL  -- ✅ Add ON DELETE SET NULL
);

-- If table already exists, update the foreign key constraint
PRAGMA foreign_keys = OFF;
-- Drop and recreate with better constraint
DROP TABLE IF EXISTS applications_temp;
CREATE TABLE applications_temp AS SELECT * FROM applications;
DROP TABLE applications;
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_number TEXT UNIQUE,
  client_id INTEGER,
  client_name TEXT,
  person_name TEXT,
  pre_approval_mb_number TEXT,
  expected_completion TEXT,
  invoice_id TEXT,
  application_type TEXT,
  application_type_description TEXT,
  emirate TEXT,
  current_step TEXT,
  steps_completed TEXT,
  status TEXT,
  start_date TEXT,
  completion_date TEXT,
  documents TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);
INSERT INTO applications SELECT * FROM applications_temp;
DROP TABLE applications_temp;
PRAGMA foreign_keys = ON;

/* =========================
   USERS & AUTHENTICATION
========================= */
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user', -- 'admin', 'manager', 'user'
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT,
  notes TEXT
);

/* =========================
   AUDIT LOG
========================= */
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,  -- 'created', 'updated', 'deleted'
  changed_by TEXT,        -- User who made the change
  old_data TEXT,          -- JSON of old data
  new_data TEXT,          -- JSON of new data
  changed_fields TEXT,    -- JSON array of field names changed
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);