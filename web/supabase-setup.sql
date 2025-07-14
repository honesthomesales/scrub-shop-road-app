-- Supabase Database Schema for Scrub Shop Road App
-- Migration from Google Sheets

-- Create tables based on Google Sheets structure

-- Trailer History Table (matches Google Sheets Trailer_History)
CREATE TABLE trailer_history (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Confirmed',
  sales_tax DECIMAL(10,2) DEFAULT 0,
  net_sales DECIMAL(10,2) DEFAULT 0,
  gross_sales DECIMAL(10,2) DEFAULT 0,
  venue_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Camper History Table (identical structure to trailer_history)
CREATE TABLE camper_history (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Confirmed',
  sales_tax DECIMAL(10,2) DEFAULT 0,
  net_sales DECIMAL(10,2) DEFAULT 0,
  gross_sales DECIMAL(10,2) DEFAULT 0,
  venue_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venues Table
CREATE TABLE venues (
  id BIGSERIAL PRIMARY KEY,
  promo VARCHAR(255) NOT NULL,
  promo_to_send VARCHAR(255),
  address_city VARCHAR(255),
  contact VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  times VARCHAR(255),
  show_info TEXT,
  forecast_will VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff Table
CREATE TABLE staff (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'Worker' CHECK (role IN ('Manager', 'Worker', 'Driver', 'Sales', 'Support')),
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave', 'Terminated')),
  hire_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_trailer_history_date ON trailer_history(date);
CREATE INDEX idx_trailer_history_venue_id ON trailer_history(venue_id);
CREATE INDEX idx_camper_history_date ON camper_history(date);
CREATE INDEX idx_camper_history_venue_id ON camper_history(venue_id);
CREATE INDEX idx_venues_promo ON venues(promo);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_role ON staff(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_trailer_history_updated_at BEFORE UPDATE ON trailer_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_camper_history_updated_at BEFORE UPDATE ON camper_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE trailer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE camper_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these based on your auth requirements)
CREATE POLICY "Allow public read access to trailer_history" ON trailer_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to trailer_history" ON trailer_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to trailer_history" ON trailer_history FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to trailer_history" ON trailer_history FOR DELETE USING (true);

CREATE POLICY "Allow public read access to camper_history" ON camper_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to camper_history" ON camper_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to camper_history" ON camper_history FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to camper_history" ON camper_history FOR DELETE USING (true);

CREATE POLICY "Allow public read access to venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to venues" ON venues FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to venues" ON venues FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to venues" ON venues FOR DELETE USING (true);

CREATE POLICY "Allow public read access to staff" ON staff FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to staff" ON staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to staff" ON staff FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to staff" ON staff FOR DELETE USING (true);

-- Insert sample data (optional - for testing)
INSERT INTO venues (promo, promo_to_send, address_city, contact, phone, email, times, show_info, forecast_will) VALUES
('Summer Festival', 'Yes', '123 Main St, City A', 'John Smith', '555-123-4567', 'john@venue.com', '9 AM - 5 PM', 'Outdoor event', 'High'),
('Winter Market', 'No', '456 Oak Ave, City B', 'Jane Doe', '555-987-6543', 'jane@venue.com', '10 AM - 6 PM', 'Indoor market', 'Medium');

INSERT INTO staff (name, email, phone, role, status, hire_date, notes) VALUES
('John Smith', 'john@scrubshop.com', '555-123-4567', 'Worker', 'Active', '2024-01-01', 'Experienced team member'),
('Jane Doe', 'jane@scrubshop.com', '555-987-6543', 'Worker', 'Active', '2024-01-15', 'New hire'),
('Mike Johnson', 'mike@scrubshop.com', '555-456-7890', 'Manager', 'Active', '2023-12-01', 'Team lead');

INSERT INTO trailer_history (date, status, sales_tax, net_sales, gross_sales, venue_id) VALUES
('2024-01-15', 'Confirmed', 45.00, 855.00, 900.00, 'Venue 1'),
('2024-01-20', 'Closed', 52.50, 997.50, 1050.00, 'Venue 2'),
('2024-01-10', 'Confirmed', 38.00, 722.00, 760.00, 'Venue 3');

INSERT INTO camper_history (date, status, sales_tax, net_sales, gross_sales, venue_id) VALUES
('2024-01-15', 'Confirmed', 45.00, 855.00, 900.00, 'Venue 1'),
('2024-01-20', 'Closed', 52.50, 997.50, 1050.00, 'Venue 2'),
('2024-01-10', 'Confirmed', 38.00, 722.00, 760.00, 'Venue 3'); 