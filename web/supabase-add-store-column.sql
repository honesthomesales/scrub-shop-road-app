-- Add store column to trailer_history and camper_history tables
-- This column will track which store the sale came FROM (not where it was sold)

-- Add store column to trailer_history table
ALTER TABLE trailer_history 
ADD COLUMN IF NOT EXISTS store VARCHAR(50) DEFAULT 'Trailer';

-- Add store column to camper_history table  
ALTER TABLE camper_history 
ADD COLUMN IF NOT EXISTS store VARCHAR(50) DEFAULT 'Camper';

-- Create indexes for the new store columns
CREATE INDEX IF NOT EXISTS idx_trailer_history_store ON trailer_history(store);
CREATE INDEX IF NOT EXISTS idx_camper_history_store ON camper_history(store);

-- Update existing records to have proper store values
UPDATE trailer_history 
SET store = 'Trailer' 
WHERE store IS NULL OR store = '';

UPDATE camper_history 
SET store = 'Camper' 
WHERE store IS NULL OR store = '';

-- Add a comment explaining the store column
COMMENT ON COLUMN trailer_history.store IS 'Store where the sale originated from (Trailer, Camper, Spartanburg, Greenville, Columbia)';
COMMENT ON COLUMN camper_history.store IS 'Store where the sale originated from (Trailer, Camper, Spartanburg, Greenville, Columbia)';
