-- Create Expenses Table for Scrub Shop Road App
-- This table stores expense data imported from various sources (e.g., AMEX)

CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT,
  card_member VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'AMEX',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_source ON expenses(source);
CREATE INDEX IF NOT EXISTS idx_expenses_card_member ON expenses(card_member);

-- Add comment to table
COMMENT ON TABLE expenses IS 'Stores expense data imported from various sources (AMEX, etc.)';

