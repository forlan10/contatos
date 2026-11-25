/*
# Add "novo" flag to contatos_WAPP

1. Modified Tables
- `contatos_WAPP`
  - `novo` (boolean, NOT NULL, default true) — true for newly arrived contacts;
    the Triagem tab shows a "Novo" tag that is cleared when the user clicks it.
2. Security
- No RLS/policy changes.
*/

ALTER TABLE contatos_WAPP
  ADD COLUMN IF NOT EXISTS novo boolean NOT NULL DEFAULT true;
