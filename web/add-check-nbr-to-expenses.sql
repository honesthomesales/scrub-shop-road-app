-- Add Check_Nbr column to expenses table for Truist check/serial numbers

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS check_nbr VARCHAR(255);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_check_nbr ON expenses(check_nbr);

-- Add comment
COMMENT ON COLUMN expenses.check_nbr IS 'Check or Serial number from Truist transactions';

