-- Hand-written: extensions must exist before the generated schema creates trigram indexes.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
