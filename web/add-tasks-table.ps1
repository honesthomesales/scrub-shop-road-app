# PowerShell script to add tasks table to Supabase database
# This script runs the SQL commands to create the missing tasks table

Write-Host "Adding tasks table to Supabase database..." -ForegroundColor Green

# Check if the SQL file exists
$sqlFile = "add-tasks-table.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "Error: $sqlFile not found!" -ForegroundColor Red
    exit 1
}

Write-Host "SQL file found: $sqlFile" -ForegroundColor Yellow

# Read the SQL content
$sqlContent = Get-Content $sqlFile -Raw

Write-Host "SQL content to execute:" -ForegroundColor Cyan
Write-Host $sqlContent -ForegroundColor Gray

Write-Host "`nTo execute this SQL, you need to:" -ForegroundColor Yellow
Write-Host "1. Go to your Supabase dashboard" -ForegroundColor White
Write-Host "2. Navigate to the SQL Editor" -ForegroundColor White
Write-Host "3. Copy and paste the content from $sqlFile" -ForegroundColor White
Write-Host "4. Click 'Run' to execute the SQL commands" -ForegroundColor White

Write-Host "`nAlternatively, you can use the Supabase CLI if you have it installed:" -ForegroundColor Yellow
Write-Host "supabase db push --file $sqlFile" -ForegroundColor White

Write-Host "`nAfter running the SQL, the tasks table will be created with proper foreign key relationships." -ForegroundColor Green
Write-Host "The application should then work without the foreign key relationship errors." -ForegroundColor Green 