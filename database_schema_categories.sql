-- Database Schema for Expense Categorization System
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  keywords TEXT[], -- Array of keywords for matching
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add category column to expenses table (if it doesn't exist)
-- Check if column exists first, if not, add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'category'
  ) THEN
    ALTER TABLE expenses ADD COLUMN category TEXT;
  END IF;
END $$;

-- 3. Create index on category column for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_category_null ON expenses(category) WHERE category IS NULL;

-- 4. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to auto-update updated_at on categories table
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable Row Level Security (RLS) if needed
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 7. Create policy to allow all authenticated users to read categories
CREATE POLICY "Allow authenticated users to read categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- 8. Create policy to allow all authenticated users to insert categories
CREATE POLICY "Allow authenticated users to insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 9. Create policy to allow all authenticated users to update categories
CREATE POLICY "Allow authenticated users to update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 10. Create policy to allow all authenticated users to delete categories
CREATE POLICY "Allow authenticated users to delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

