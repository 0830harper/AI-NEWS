-- Run once in Supabase SQL Editor: stores pre-translated 简体中文 from the fetcher pipeline.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS title_zh TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS description_zh TEXT;
