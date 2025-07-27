-- Add Tasks Table to Supabase Database
-- This script adds the missing tasks table with proper foreign key relationships

-- Create Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_by BIGINT REFERENCES staff(id) ON DELETE SET NULL,
  assigned_to BIGINT REFERENCES staff(id) ON DELETE SET NULL,
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_category ON tasks(category);

-- Apply updated_at trigger
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to tasks" ON tasks FOR DELETE USING (true);

-- Insert sample task data
INSERT INTO tasks (title, description, assigned_by, assigned_to, priority, status, due_date, category) VALUES
('Prepare trailer for weekend shows', 'Clean and stock the trailer for upcoming events', 1, 2, 'high', 'pending', NOW() + INTERVAL '1 day', 'maintenance'),
('Contact new venue', 'Follow up with the new venue we discussed', 1, 3, 'normal', 'in_progress', NOW() + INTERVAL '2 days', 'venue'),
('Update inventory system', 'Review and update the current inventory tracking', 2, 1, 'normal', 'pending', NOW() + INTERVAL '3 days', 'admin'),
('Schedule staff training', 'Organize training session for new procedures', 3, 2, 'high', 'pending', NOW() + INTERVAL '1 week', 'training'); 