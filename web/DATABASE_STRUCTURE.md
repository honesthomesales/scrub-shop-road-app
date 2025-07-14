# 📊 Database Structure Reference

This document shows the exact structure of your Supabase database tables.

## 🚛 Trailer History Table

**Table Name**: `trailer_history`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `date` | DATE | NOT NULL | Sale date |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'Confirmed' | Sale status |
| `sales_tax` | DECIMAL(10,2) | DEFAULT 0 | Sales tax amount |
| `net_sales` | DECIMAL(10,2) | DEFAULT 0 | Net sales amount |
| `gross_sales` | DECIMAL(10,2) | DEFAULT 0 | Gross sales amount |
| `venue_id` | VARCHAR(255) | | Venue identifier |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record update time |

**Indexes**:
- `idx_trailer_history_date` on `date`
- `idx_trailer_history_venue_id` on `venue_id`

## 🏕️ Camper History Table

**Table Name**: `camper_history`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `date` | DATE | NOT NULL | Sale date |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'Confirmed' | Sale status |
| `sales_tax` | DECIMAL(10,2) | DEFAULT 0 | Sales tax amount |
| `net_sales` | DECIMAL(10,2) | DEFAULT 0 | Net sales amount |
| `gross_sales` | DECIMAL(10,2) | DEFAULT 0 | Gross sales amount |
| `venue_id` | VARCHAR(255) | | Venue identifier |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record update time |

**Indexes**:
- `idx_camper_history_date` on `date`
- `idx_camper_history_venue_id` on `venue_id`

## 🏢 Venues Table

**Table Name**: `venues`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `promo` | VARCHAR(255) | NOT NULL | Promotional name |
| `promo_to_send` | VARCHAR(255) | | Promo to send flag |
| `address_city` | VARCHAR(255) | | Address and city |
| `contact` | VARCHAR(255) | | Contact person |
| `phone` | VARCHAR(50) | | Phone number |
| `email` | VARCHAR(255) | | Email address |
| `times` | VARCHAR(255) | | Operating times |
| `show_info` | TEXT | | Show information |
| `forecast_will` | VARCHAR(50) | | Forecast will value |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record update time |

**Indexes**:
- `idx_venues_promo` on `promo`

## 👥 Staff Table

**Table Name**: `staff`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `name` | VARCHAR(255) | NOT NULL | Staff member name |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| `phone` | VARCHAR(50) | | Phone number |
| `role` | VARCHAR(50) | DEFAULT 'Worker' | Staff role |
| `status` | VARCHAR(50) | DEFAULT 'Active' | Employment status |
| `hire_date` | DATE | | Date of hire |
| `notes` | TEXT | | Additional notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record update time |

**Constraints**:
- `role` must be one of: 'Manager', 'Worker', 'Driver', 'Sales', 'Support'
- `status` must be one of: 'Active', 'Inactive', 'On Leave', 'Terminated'

**Indexes**:
- `idx_staff_email` on `email`
- `idx_staff_status` on `status`
- `idx_staff_role` on `role`

## 🔗 Data Relationships

### Sales to Venues
- `trailer_history.venue_id` → `venues.id` (optional relationship)
- `camper_history.venue_id` → `venues.id` (optional relationship)

### Calendar Events
- Calendar events are generated from sales data and staff assignments
- Events can reference venues and staff members

## 📝 Sample Data

### Trailer History Sample:
```sql
INSERT INTO trailer_history (date, status, sales_tax, net_sales, gross_sales, venue_id) VALUES
('2024-01-15', 'Confirmed', 45.00, 855.00, 900.00, 'Venue 1'),
('2024-01-20', 'Closed', 52.50, 997.50, 1050.00, 'Venue 2');
```

### Camper History Sample:
```sql
INSERT INTO camper_history (date, status, sales_tax, net_sales, gross_sales, venue_id) VALUES
('2024-01-10', 'Confirmed', 38.00, 722.00, 760.00, 'Venue 3'),
('2024-01-25', 'Pending', 60.00, 1140.00, 1200.00, 'Venue 1');
```

### Venues Sample:
```sql
INSERT INTO venues (promo, promo_to_send, address_city, contact, phone, email, times, show_info, forecast_will) VALUES
('Summer Festival', 'Yes', '123 Main St, City A', 'John Smith', '555-123-4567', 'john@venue.com', '9 AM - 5 PM', 'Outdoor event', 'High');
```

### Staff Sample:
```sql
INSERT INTO staff (name, email, phone, role, status, hire_date, notes) VALUES
('John Smith', 'john@scrubshop.com', '555-123-4567', 'Worker', 'Active', '2024-01-01', 'Experienced team member');
```

## 🔒 Security Policies

All tables have Row Level Security (RLS) enabled with public access policies:

- **SELECT**: Allow public read access
- **INSERT**: Allow public insert access  
- **UPDATE**: Allow public update access
- **DELETE**: Allow public delete access

*Note: You can modify these policies based on your authentication requirements.*

## 📊 Performance Optimizations

### Indexes
- Date-based queries are optimized with indexes on `date` columns
- Venue lookups are optimized with indexes on `venue_id` columns
- Staff queries are optimized with indexes on `email`, `status`, and `role` columns

### Triggers
- `updated_at` columns are automatically updated when records are modified
- All tables have automatic timestamp management

## 🚀 Migration Notes

1. **Data Types**: Ensure your CSV data matches the expected types
2. **Constraints**: Check that role and status values match the allowed options
3. **Unique Constraints**: Email addresses in staff table must be unique
4. **Date Format**: Use ISO date format (YYYY-MM-DD) for date columns
5. **Decimal Precision**: Sales amounts use DECIMAL(10,2) for precision 