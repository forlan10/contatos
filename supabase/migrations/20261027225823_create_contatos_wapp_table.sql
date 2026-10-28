/*
# Create contatos_WAPP table (single-tenant, no auth)

1. New Tables
- `contatos_WAPP`
  - `id` (int8 / bigserial, primary key) — auto-incrementing numeric id.
  - `created_at` (timestamptz, defaults to now()) — when the contact was created.
  - `nome` (text) — contact name.
  - `numero` (text) — full WhatsApp identifier, e.g. '5521982947047@s.whatsapp.net'.
  - `tipo` (text, defaults to 'em analise') — category of the contact. Allowed values:
      'em analise', 'cliente', 'familia', 'trabalho', 'fornecedor', 'ignorado'.
  - `descricao` (text, nullable) — notes/observations about the contact
      (product of interest, location, etc.).
2. Security
- Enable RLS on `contatos_WAPP`.
- Grant CRUD to `anon` + `authenticated` so the anon-key frontend can read/write.
- Allow anon + authenticated full CRUD because the data is intentionally
  shared/single-tenant (no sign-in screen).
3. Notes
- A CHECK constraint on `tipo` keeps the category values consistent with the
  app's dropdown options.
- An index on `tipo` speeds up the two main filtered views (triagem / clientes).
*/

CREATE TABLE IF NOT EXISTS contatos_WAPP (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  nome text,
  numero text,
  tipo text NOT NULL DEFAULT 'em analise'
    CHECK (tipo IN ('em analise', 'cliente', 'familia', 'trabalho', 'fornecedor', 'ignorado')),
  descricao text
);

ALTER TABLE contatos_WAPP ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON contatos_WAPP TO anon, authenticated;
GRANT USAGE ON SEQUENCE contatos_WAPP_id_seq TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_contatos_wapp_tipo ON contatos_WAPP (tipo);

DROP POLICY IF EXISTS "anon_select_contatos_wapp" ON contatos_WAPP;
CREATE POLICY "anon_select_contatos_wapp" ON contatos_WAPP FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_contatos_wapp" ON contatos_WAPP;
CREATE POLICY "anon_insert_contatos_wapp" ON contatos_WAPP FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_contatos_wapp" ON contatos_WAPP;
CREATE POLICY "anon_update_contatos_wapp" ON contatos_WAPP FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contatos_wapp" ON contatos_WAPP;
CREATE POLICY "anon_delete_contatos_wapp" ON contatos_WAPP FOR DELETE
  TO anon, authenticated USING (true);
