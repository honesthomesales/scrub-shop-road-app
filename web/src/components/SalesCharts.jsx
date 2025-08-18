'use client';
import React, { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area
} from 'recharts';

// ---- helpers ----
const fmtCurrency = (v) =>
  v.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function getCurrentMonthData(rows) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  console.log('SalesCharts: Processing rows:', rows?.length || 0);
  console.log('SalesCharts: Current month/year:', currentMonth, currentYear);
  
  const filtered = rows.filter(row => {
    if (!row.date) {
      console.log('SalesCharts: Skipping row without date:', row);
      return false;
    }
    
    const rowDate = new Date(row.date);
    if (isNaN(rowDate.getTime())) {
      console.log('SalesCharts: Skipping row with invalid date:', row.date, row);
      return false;
    }
    
    const matchesMonth = rowDate.getMonth() === currentMonth && rowDate.getFullYear() === currentYear;
    if (matchesMonth) {
      console.log('SalesCharts: Including row:', row.date, row.store, row.grossSales);
    }
    
    return matchesMonth;
  });
  
  console.log('SalesCharts: Filtered to current month:', filtered.length);
  return filtered;
}

function groupTotalsByStore(rows) {
  const totals = new Map();
  for (const r of rows) {
    if (r.store && r.grossSales > 0) {
      totals.set(r.store, (totals.get(r.store) ?? 0) + r.grossSales);
    }
  }
  // return sorted array desc
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([store, total]) => ({ store, total }));
}

function buildStackedByDate(rows) {
  // date -> { date, [store]: value }
  const byDate = new Map();
  const stores = new Set();
  
  for (const r of rows) {
    if (!r.store || !r.grossSales || r.grossSales <= 0) continue;
    
    stores.add(r.store);
    const row = byDate.get(r.date) ?? { date: r.date };
    row[r.store] = (row[r.store] ?? 0) + r.grossSales;
    byDate.set(r.date, row);
  }
  
  // sort by date ASC for time series
  const data = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { data, stores: [...stores] };
}

// Format date for better display
function formatChartDate(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log('SalesCharts: Invalid date string:', dateString);
      return dateString;
    }
    
    // Format as "MMM DD" (e.g., "Aug 15")
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error('SalesCharts: Error formatting date:', dateString, error);
    return dateString;
  }
}

// simple stable palette
const palette = [
  '#4C6EF5','#12B886','#FA5252','#FAB005','#7950F2','#40C057','#228BE6','#E64980','#82C91E','#F76707'
];
const colorFor = (i) => palette[i % palette.length];

// ---- component ----
export default function SalesCharts({ rows }) {
  console.log('SalesCharts: Received rows:', rows?.length || 0, 'Sample:', rows?.slice(0, 3));
  
  // Filter to current month only
  const currentMonthRows = useMemo(() => getCurrentMonthData(rows), [rows]);
  
  const barData = useMemo(() => groupTotalsByStore(currentMonthRows), [currentMonthRows]);
  const { data: areaData, stores } = useMemo(() => buildStackedByDate(currentMonthRows), [currentMonthRows]);

  console.log('SalesCharts: Bar data:', barData);
  console.log('SalesCharts: Area data:', areaData?.length || 0, 'Stores:', stores);

  // Add month/year to chart titles
  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const year = now.getFullYear();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar: Monthly Gross by Store */}
      <div className="rounded-2xl border p-4">
        <h3 className="text-lg font-semibold mb-2">Monthly Gross by Store - {monthName} {year}</h3>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData} margin={{ left: 8, right: 8, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="store" 
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis tickFormatter={fmtCurrency} />
              <Tooltip formatter={(v) => fmtCurrency(v)} />
              <Bar dataKey="total" name="Gross Sales" fill="#4C6EF5" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            No sales data for {monthName} {year}
          </div>
        )}
      </div>

      {/* Stacked Area: Daily Gross by Store */}
      <div className="rounded-2xl border p-4">
        <h3 className="text-lg font-semibold mb-2">Daily Gross by Store - {monthName} {year}</h3>
        {areaData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={areaData} margin={{ left: 8, right: 8, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                tickFormatter={formatChartDate}
              />
              <YAxis tickFormatter={fmtCurrency} />
              <Tooltip 
                formatter={(v) => fmtCurrency(v)}
                labelFormatter={(label) => formatChartDate(label)}
              />
              <Legend />
              {stores.map((s, i) => (
                <Area
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stackId="1"
                  name={s}
                  fill={colorFor(i)}
                  stroke={colorFor(i)}
                  dot={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            No sales data for {monthName} {year}
          </div>
        )}
      </div>
    </div>
  );
}
