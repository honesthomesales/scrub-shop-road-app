-- Create stores table first
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  number VARCHAR(10) UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert the 5 stores we're using
INSERT INTO stores (name, number) VALUES 
  ('Spartanburg', '1'),
  ('Greenville', '3'), 
  ('Columbia', '4'),
  ('Trailer', '5'),
  ('Camper', '7')
ON CONFLICT (number) DO NOTHING;

-- Add store_id to staff table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'store_id') THEN
        ALTER TABLE staff ADD COLUMN store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_staff_store_id ON staff(store_id);
    END IF;
END $$;

-- Add pay structure fields to staff table if they don't exist
DO $$ 
BEGIN
    -- Add pay_type field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'pay_type') THEN
        ALTER TABLE staff ADD COLUMN pay_type VARCHAR(20) DEFAULT 'hourly' CHECK (pay_type IN ('hourly', 'salary', 'salary+bonus'));
    END IF;
    
    -- Add hourly_rate field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'hourly_rate') THEN
        ALTER TABLE staff ADD COLUMN hourly_rate DECIMAL(8,2) DEFAULT 0;
    END IF;
    
    -- Add salary_amount field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'salary_amount') THEN
        ALTER TABLE staff ADD COLUMN salary_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add preferred_hours_per_week field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'preferred_hours_per_week') THEN
        ALTER TABLE staff ADD COLUMN preferred_hours_per_week DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    -- Add max_hours_per_week field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'max_hours_per_week') THEN
        ALTER TABLE staff ADD COLUMN max_hours_per_week DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;

-- Now update the scheduler tables to reference the stores table
-- First, let's drop the existing tables if they exist
DROP TABLE IF EXISTS schedule_assignments CASCADE;
DROP TABLE IF EXISTS schedule_slots CASCADE;

-- Recreate the tables with proper foreign key references
CREATE TABLE IF NOT EXISTS store_hours (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME,
  close_time TIME,
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS store_holidays (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  holiday_name VARCHAR(100) NOT NULL,
  holiday_date DATE NOT NULL,
  is_closed BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, holiday_date)
);

CREATE TABLE IF NOT EXISTS commission_tiers (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  tier_name VARCHAR(50) NOT NULL,
  sales_target DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, tier_name)
);

-- Staff-specific bonus tiers table
CREATE TABLE IF NOT EXISTS staff_bonus_tiers (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
  tier_name VARCHAR(50) NOT NULL,
  sales_target DECIMAL(10,2) NOT NULL,
  bonus_amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(staff_id, tier_name)
);

CREATE TABLE IF NOT EXISTS staff_commission_rates (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
  base_commission_rate DECIMAL(5,2) DEFAULT 0,
  commission_multiplier DECIMAL(3,2) DEFAULT 1.0,
  bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, staff_id)
);

-- Updated schedule_assignments table with direct fields
CREATE TABLE schedule_assignments (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(staff_id, date, start_time)
);

-- Create indexes for better performance (only if they don't exist)
DO $$ 
BEGIN
    -- Store hours indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_store_hours_store_id') THEN
        CREATE INDEX idx_store_hours_store_id ON store_hours(store_id);
    END IF;
    
    -- Store holidays indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_store_holidays_store_id') THEN
        CREATE INDEX idx_store_holidays_store_id ON store_holidays(store_id);
    END IF;
    
    -- Commission tiers indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_commission_tiers_store_id') THEN
        CREATE INDEX idx_commission_tiers_store_id ON commission_tiers(store_id);
    END IF;
    
    -- Staff commission rates indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_staff_commission_rates_store_id') THEN
        CREATE INDEX idx_staff_commission_rates_store_id ON staff_commission_rates(store_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_staff_commission_rates_staff_id') THEN
        CREATE INDEX idx_staff_commission_rates_staff_id ON staff_commission_rates(staff_id);
    END IF;
    
    -- Staff bonus tiers indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_staff_bonus_tiers_staff_id') THEN
        CREATE INDEX idx_staff_bonus_tiers_staff_id ON staff_bonus_tiers(staff_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_staff_bonus_tiers_active') THEN
        CREATE INDEX idx_staff_bonus_tiers_active ON staff_bonus_tiers(is_active);
    END IF;
    
    -- Schedule assignments indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_schedule_assignments_store_id') THEN
        CREATE INDEX idx_schedule_assignments_store_id ON schedule_assignments(store_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_schedule_assignments_staff_id') THEN
        CREATE INDEX idx_schedule_assignments_staff_id ON schedule_assignments(staff_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_schedule_assignments_date') THEN
        CREATE INDEX idx_schedule_assignments_date ON schedule_assignments(date);
    END IF;
END $$;

-- Payroll Records table for storing calculated payroll data
CREATE TABLE IF NOT EXISTS payroll_records (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  payroll_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for payroll records (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payroll_records_store_id') THEN
        CREATE INDEX idx_payroll_records_store_id ON payroll_records(store_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payroll_records_date_range') THEN
        CREATE INDEX idx_payroll_records_date_range ON payroll_records(date_range_start, date_range_end);
    END IF;
END $$; 