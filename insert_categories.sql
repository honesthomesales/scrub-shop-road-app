-- Insert default expense categories
-- Run this after creating the categories table

INSERT INTO categories (name, keywords, description) VALUES
  ('Product', ARRAY[]::TEXT[], 'Product-related expenses'),
  ('Payroll', ARRAY['payroll', 'salary', 'wages', 'pay', 'employee'], 'Payroll and employee compensation'),
  ('Taxes', ARRAY['tax', 'irs', 'federal', 'state', 'sales tax'], 'Tax payments and obligations'),
  ('Rent', ARRAY['rent', 'lease', 'rental'], 'Rent and lease payments'),
  ('Loans', ARRAY['loan', 'payment', 'financing'], 'Loan payments and financing'),
  ('Personal', ARRAY['personal'], 'Personal expenses'),
  ('Insurance', ARRAY['insurance', 'premium'], 'Insurance premiums and payments'),
  ('Shipping', ARRAY['shipping', 'freight', 'delivery', 'postage'], 'Shipping and delivery costs'),
  ('Office', ARRAY['office', 'supplies', 'stationery'], 'Office supplies and expenses'),
  ('Equipment', ARRAY['equipment', 'machinery', 'tools'], 'Equipment purchases and maintenance'),
  ('Gas', ARRAY['gas', 'fuel', 'gasoline', 'petrol'], 'Gas and fuel expenses'),
  ('Utilities', ARRAY['utilities', 'electric', 'water', 'sewer'], 'Utility bills'),
  ('Phone & Internet', ARRAY['phone', 'internet', 'telephone', 'cellular', 'mobile', 'wifi'], 'Phone and internet services'),
  ('Road Other', ARRAY['road', 'travel', 'mileage'], 'Other road-related expenses'),
  ('Embroidery', ARRAY['embroidery', 'embroidery machine', 'thread'], 'Embroidery-related expenses'),
  ('Advertising', ARRAY['advertising', 'ad', 'marketing', 'promotion'], 'Advertising and marketing expenses'),
  ('CPA', ARRAY['cpa', 'accountant', 'accounting', 'bookkeeping'], 'CPA and accounting services'),
  ('Misc', ARRAY['misc', 'miscellaneous', 'other'], 'Miscellaneous expenses'),
  ('Charity', ARRAY['charity', 'donation', 'donate'], 'Charitable donations')
ON CONFLICT (name) DO NOTHING;

