const fs = require('fs');
const path = require('path');

// Function to clean and format data for SQL
function cleanValue(value) {
    if (!value || value.trim() === '' || value.trim() === '########') {
        return 'NULL';
    }
    
    // Remove quotes and escape single quotes for SQL
    const cleaned = value.trim().replace(/'/g, "''");
    return `'${cleaned}'`;
}

// Function to parse TSV file and generate SQL
function generateSQLFromTSV(filePath, tableName, columnMapping) {
    try {
        console.log(`📖 Reading file: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
            console.log(`❌ File not found: ${filePath}`);
            return '';
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            console.log(`❌ No data found in ${filePath}`);
            return '';
        }
        
        const headers = lines[0].split('\t');
        const dataLines = lines.slice(1);
        
        console.log(`📊 Processing ${dataLines.length} rows from ${path.basename(filePath)}`);
        console.log(`📋 Headers found: ${headers.join(', ')}`);
        
        let sql = `-- Import ${tableName} data from ${path.basename(filePath)}\n`;
        sql += `-- Generated on ${new Date().toISOString()}\n\n`;
        
        const insertStatements = dataLines.map((line, index) => {
            const values = line.split('\t');
            const mappedValues = columnMapping.map(mapping => {
                const headerIndex = headers.findIndex(h => 
                    h.toLowerCase().includes(mapping.source.toLowerCase())
                );
                
                if (headerIndex === -1) {
                    console.log(`⚠️  Warning: Column '${mapping.source}' not found in headers`);
                    return 'NULL';
                }
                
                const value = values[headerIndex] || '';
                return mapping.transform ? mapping.transform(value) : cleanValue(value);
            });
            
            return `(${mappedValues.join(', ')})`;
        });
        
        // Split into batches of 100 for better performance
        const batchSize = 100;
        for (let i = 0; i < insertStatements.length; i += batchSize) {
            const batch = insertStatements.slice(i, i + batchSize);
            const columns = columnMapping.map(m => m.target).join(', ');
            sql += `INSERT INTO ${tableName} (${columns}) VALUES\n`;
            sql += batch.join(',\n') + ';\n\n';
        }
        
        return sql;
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return '';
    }
}

// Main execution
function main() {
    console.log('🚀 TSV Import Script for Specific Files\n');
    
    const outputFile = 'supabase-import-from-files.sql';
    let fullSQL = `-- Auto-generated Supabase Import Script from TSV files\n`;
    fullSQL += `-- Generated on ${new Date().toISOString()}\n\n`;
    
    // Clear existing data
    fullSQL += `-- Clear existing data\n`;
    fullSQL += `TRUNCATE TABLE trailer_history CASCADE;\n`;
    fullSQL += `TRUNCATE TABLE camper_history CASCADE;\n`;
    fullSQL += `TRUNCATE TABLE venues CASCADE;\n\n`;
    
    // Process Venues file
    const venuesPath = 'C:\\Users\\hones\\Downloads\\venues.tsv';
    console.log(`\n🏢 Processing venues file: ${venuesPath}`);
    const venuesSQL = generateSQLFromTSV(venuesPath, 'venues', [
        { source: 'Promo', target: 'common_venue_name' },
        { source: 'Promo', target: 'promo' },
        { source: 'Promo To Send', target: 'promo_to_send' },
        { source: 'Address / City', target: 'address_city' },
        { source: 'Contact', target: 'contact' },
        { source: 'Phone', target: 'phone' },
        { source: 'Email', target: 'email' },
        { source: 'Times', target: 'times' },
        { source: 'Show Info', target: 'show_info' },
        { source: 'Forecast Will', target: 'forecast' }
    ]);
    fullSQL += venuesSQL;
    
    // Process Trailer History file
    const trailerPath = 'C:\\Users\\hones\\Downloads\\trailer-history.tsv';
    console.log(`\n🚛 Processing trailer history file: ${trailerPath}`);
    const trailerSQL = generateSQLFromTSV(trailerPath, 'trailer_history', [
        { 
            source: 'Date', 
            target: 'date',
            transform: (value) => {
                if (!value || value.trim() === '') return 'NULL';
                // Convert Excel date format to PostgreSQL timestamp
                const cleaned = value.trim().replace(/\s+0:00:00$/, '');
                return `'${cleaned}'::timestamp with time zone`;
            }
        },
        { source: 'Status', target: 'status' },
        { 
            source: 'Sales Tax', 
            target: 'sales_tax',
            transform: (value) => {
                if (!value || value.trim() === '' || value.trim() === '########') {
                    return 'NULL';
                }
                const num = parseFloat(value.trim());
                return isNaN(num) ? 'NULL' : num.toString();
            }
        },
        { 
            source: 'Net Sales', 
            target: 'net_sales',
            transform: (value) => {
                if (!value || value.trim() === '' || value.trim() === '########') {
                    return 'NULL';
                }
                const num = parseFloat(value.trim());
                return isNaN(num) ? 'NULL' : num.toString();
            }
        },
        { 
            source: 'Gross Sales', 
            target: 'gross_sales',
            transform: (value) => {
                if (!value || value.trim() === '' || value.trim() === '########') {
                    return 'NULL';
                }
                const num = parseFloat(value.trim());
                return isNaN(num) ? 'NULL' : num.toString();
            }
        },
        { source: 'Venue ID', target: 'common_venue_name' }
    ]);
    fullSQL += trailerSQL;
    
    // Process Camper History file
    const camperPath = 'C:\\Users\\hones\\Downloads\\camper-history.tsv';
    console.log(`\n🏕️  Processing camper history file: ${camperPath}`);
    const camperSQL = generateSQLFromTSV(camperPath, 'camper_history', [
        { 
            source: 'Date', 
            target: 'date',
            transform: (value) => {
                if (!value || value.trim() === '') return 'NULL';
                // Convert Excel date format to PostgreSQL timestamp
                const cleaned = value.trim().replace(/\s+0:00:00$/, '');
                return `'${cleaned}'::timestamp with time zone`;
            }
        },
        { source: 'Status', target: 'status' },
        { 
            source: 'Sales Tax', 
            target: 'sales_tax',
            transform: (value) => {
                if (!value || value.trim() === '' || value.trim() === '########') {
                    return 'NULL';
                }
                const num = parseFloat(value.trim());
                return isNaN(num) ? 'NULL' : num.toString();
            }
        },
        { 
            source: 'Net Sales', 
            target: 'net_sales',
            transform: (value) => {
                if (!value || value.trim() === '' || value.trim() === '########') {
                    return 'NULL';
                }
                const num = parseFloat(value.trim());
                return isNaN(num) ? 'NULL' : num.toString();
            }
        },
        { 
            source: 'Gross Sales', 
            target: 'gross_sales',
            transform: (value) => {
                if (!value || value.trim() === '' || value.trim() === '########') {
                    return 'NULL';
                }
                const num = parseFloat(value.trim());
                return isNaN(num) ? 'NULL' : num.toString();
            }
        },
        { source: 'Venue ID', target: 'common_venue_name' }
    ]);
    fullSQL += camperSQL;
    
    // Add verification queries
    fullSQL += `-- Verification queries\n`;
    fullSQL += `SELECT 'Venues imported:' as info, COUNT(*) as count FROM venues\n`;
    fullSQL += `UNION ALL\n`;
    fullSQL += `SELECT 'Trailer History imported:', COUNT(*) FROM trailer_history\n`;
    fullSQL += `UNION ALL\n`;
    fullSQL += `SELECT 'Camper History imported:', COUNT(*) FROM camper_history;\n\n`;
    
    fullSQL += `-- Sample data verification\n`;
    fullSQL += `SELECT 'Sample Venues:' as table_name, common_venue_name, promo, address_city FROM venues LIMIT 5;\n`;
    fullSQL += `SELECT 'Sample Trailer History:' as table_name, date, status, gross_sales, common_venue_name FROM trailer_history LIMIT 5;\n`;
    fullSQL += `SELECT 'Sample Camper History:' as table_name, date, status, gross_sales, common_venue_name FROM camper_history LIMIT 5;\n`;
    
    // Write to file
    fs.writeFileSync(outputFile, fullSQL);
    console.log(`\n✅ SQL import script generated: ${outputFile}`);
    console.log(`📋 Copy and paste the contents of ${outputFile} into your Supabase SQL Editor`);
    console.log(`🚀 The script will import all your TSV data with proper data cleaning and formatting`);
}

// Run the script
main(); 