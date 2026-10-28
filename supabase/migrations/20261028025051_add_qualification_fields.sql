/*
# Add qualification fields to contatos_WAPP

1. Modified Tables
- `contatos_WAPP` (stored as contatos_wapp)
  - `produto_interesse` (text, nullable) — product the contact is interested in.
  - `bairro` (text, nullable) — location / neighborhood of the contact.
  - `funil_etapa` (text, nullable, default 'Novo') — funnel stage of the contact.
      Allowed values: 'Novo', 'Em Negociacao', 'Venda Fechada', 'Perdido'.
2. Security
- No RLS/policy changes — existing policies already allow full CRUD for
  anon + authenticated.
3. Notes
- A CHECK constraint on `funil_etapa` keeps values consistent with the app.
- All new columns are nullable so existing rows remain valid.
*/

ALTER TABLE contatos_WAPP
  ADD COLUMN IF NOT EXISTS produto_interesse text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS funil_etapa text NOT NULL DEFAULT 'Novo'
    CHECK (funil_etapa IN ('Novo', 'Em Negociacao', 'Venda Fechada', 'Perdido'));
