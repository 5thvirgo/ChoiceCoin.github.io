-- Mcuire Kitchen database schema.
-- Written for SQLite (node:sqlite) and kept Postgres-compatible in spirit:
-- swap TEXT timestamps for TIMESTAMPTZ and JSON TEXT for JSONB when moving to Postgres.
--
-- Content (recipes, course outlines) is document-shaped → JSON `doc` columns
-- plus the indexed fields we query on. Commerce and identity are relational.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name        TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Session + magic-link tokens are stored hashed (SHA-256); the raw token only lives in the cookie / email.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS magic_links (
  token_hash  TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  used_at     TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id    TEXT PRIMARY KEY,
  sort  INTEGER NOT NULL DEFAULT 0,
  doc   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  kind              TEXT NOT NULL CHECK (kind IN ('free', 'mini', 'flagship')),
  status            TEXT NOT NULL DEFAULT 'published',
  price_cents       INTEGER NOT NULL CHECK (price_cents >= 0),
  compare_at_cents  INTEGER,
  currency          TEXT NOT NULL DEFAULT 'CAD',
  certificate_title TEXT,
  doc               TEXT NOT NULL,            -- title, blurb, outcomes, modules
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS recipes (
  id             TEXT PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  status         TEXT NOT NULL DEFAULT 'outline' CHECK (status IN ('outline', 'complete')),
  category_id    TEXT REFERENCES categories(id),
  preview_steps  INTEGER NOT NULL DEFAULT 0,
  version        INTEGER NOT NULL DEFAULT 1,
  doc            TEXT NOT NULL,               -- full recipe: ingredients, steps, checkpoints, media refs
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Every admin save is kept, so a bad edit can be rolled back.
CREATE TABLE IF NOT EXISTS recipe_revisions (
  id          INTEGER PRIMARY KEY,
  recipe_id   TEXT NOT NULL,
  version     INTEGER NOT NULL,
  doc         TEXT NOT NULL,
  edited_by   INTEGER REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Which recipes a course unlocks (derived from course modules on save; used for entitlement checks).
CREATE TABLE IF NOT EXISTS course_recipes (
  course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  recipe_id  TEXT NOT NULL,
  module_id  TEXT NOT NULL,
  sort       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (course_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS content_meta (   -- achievements, challenges, free lesson pointer
  key  TEXT PRIMARY KEY,
  doc  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id           TEXT PRIMARY KEY,
  kind         TEXT NOT NULL CHECK (kind IN ('photo', 'video')),
  url          TEXT NOT NULL,
  mime         TEXT NOT NULL,
  size_bytes   INTEGER NOT NULL,
  uploaded_by  INTEGER REFERENCES users(id),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS discounts (
  code             TEXT PRIMARY KEY COLLATE NOCASE,
  percent_off      INTEGER NOT NULL CHECK (percent_off BETWEEN 1 AND 100),
  active           INTEGER NOT NULL DEFAULT 1,
  note             TEXT NOT NULL DEFAULT '',
  expires_at       TEXT,
  max_redemptions  INTEGER,
  redemptions      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id                 TEXT PRIMARY KEY,
  user_id            INTEGER REFERENCES users(id),
  email              TEXT NOT NULL,
  course_id          TEXT NOT NULL REFERENCES courses(id),
  amount_cents       INTEGER NOT NULL,
  currency           TEXT NOT NULL,
  discount_code      TEXT,
  stripe_session_id  TEXT UNIQUE,
  payment_intent     TEXT,
  status             TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  paid_at            TEXT
);

CREATE TABLE IF NOT EXISTS enrollments (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  TEXT NOT NULL REFERENCES courses(id),
  order_id   TEXT REFERENCES orders(id),
  granted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, course_id)
);

-- Per-user kitchen state: progress per recipe, cook log, saved, recent, shopping list.
CREATE TABLE IF NOT EXISTS kitchen_state (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  doc         TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS certificates (
  number      TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  course_id   TEXT NOT NULL REFERENCES courses(id),
  name        TEXT NOT NULL,
  issued_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  revoked_at  TEXT,
  UNIQUE (user_id, course_id)
);

-- Future: "Does this look ready?" photo guidance. Not used by the MVP.
CREATE TABLE IF NOT EXISTS photo_feedback (
  id                TEXT PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  recipe_id         TEXT NOT NULL,
  step_id           TEXT NOT NULL,
  image_url         TEXT NOT NULL,
  matched_option_id TEXT,                 -- which checkpoint reference state it resembled
  guidance          TEXT,
  reviewed_by       INTEGER REFERENCES users(id),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_course_recipes_recipe ON course_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
