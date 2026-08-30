-- INSPECTAMX D1 — empresa agrega sucursales; company_id une el resto.
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS folio_photos;
DROP TABLE IF EXISTS folio_findings;
DROP TABLE IF EXISTS folios;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    email_domain TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    city TEXT,
    kind TEXT NOT NULL DEFAULT 'patio' CHECK (kind IN ('patio', 'almacen', 'taller', 'otro')),
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (company_id, code)
);
CREATE INDEX idx_branches_company ON branches(company_id);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT,
    platform_role TEXT NOT NULL DEFAULT 'none' CHECK (platform_role IN ('developer', 'none')),
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('company_admin', 'oficina', 'inspector', 'taller', 'pintura', 'consulta')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (company_id, user_id)
);
CREATE INDEX idx_memberships_company ON memberships(company_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);

CREATE TABLE inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    unit_no TEXT NOT NULL,
    unit_kind TEXT NOT NULL CHECK (unit_kind IN ('contenedor', 'chasis', 'material')),
    sku TEXT,
    qty REAL NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'en_patio' CHECK (status IN ('en_patio', 'inspeccion', 'mr', 'pintura', 'listo', 'salida', 'baja')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_inventory_company_branch ON inventory_items(company_id, branch_id);
CREATE INDEX idx_inventory_unit ON inventory_items(company_id, unit_no);

CREATE TABLE folios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL,
    inspector_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    folio_code TEXT NOT NULL,
    unit_no TEXT NOT NULL,
    unit_kind TEXT NOT NULL CHECK (unit_kind IN ('contenedor', 'chasis')),
    status TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'cerrado', 'anulado')),
    inspected_at TEXT,
    closed_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (company_id, folio_code)
);
CREATE INDEX idx_folios_company_branch ON folios(company_id, branch_id);
CREATE INDEX idx_folios_inspected ON folios(company_id, inspected_at);
CREATE INDEX idx_folios_inspector ON folios(company_id, inspector_user_id);

CREATE TABLE folio_findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    folio_id INTEGER NOT NULL REFERENCES folios(id) ON DELETE CASCADE,
    point_id TEXT NOT NULL,
    side TEXT,
    component TEXT,
    damage TEXT,
    repair TEXT,
    loc_code TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_findings_folio ON folio_findings(company_id, folio_id);

CREATE TABLE folio_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    folio_id INTEGER NOT NULL REFERENCES folios(id) ON DELETE CASCADE,
    finding_id INTEGER REFERENCES folio_findings(id) ON DELETE SET NULL,
    r2_key TEXT NOT NULL,
    thumb_r2_key TEXT,
    content_type TEXT NOT NULL DEFAULT 'image/jpeg',
    byte_size INTEGER,
    storage_tier TEXT NOT NULL DEFAULT 'hot' CHECK (storage_tier IN ('hot', 'historical')),
    archived_at TEXT,
    caption TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (r2_key)
);
CREATE INDEX idx_photos_folio ON folio_photos(company_id, folio_id);
CREATE INDEX idx_photos_tier ON folio_photos(storage_tier, created_at);

CREATE TRIGGER trg_companies_updated AFTER UPDATE ON companies BEGIN
    UPDATE companies SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_branches_updated AFTER UPDATE ON branches BEGIN
    UPDATE branches SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_users_updated AFTER UPDATE ON users BEGIN
    UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_inventory_updated AFTER UPDATE ON inventory_items BEGIN
    UPDATE inventory_items SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_folios_updated AFTER UPDATE ON folios BEGIN
    UPDATE folios SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;
