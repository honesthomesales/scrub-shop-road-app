import React, { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X, Eye, Download } from 'lucide-react'
import Papa from 'papaparse'
import supabaseAPI from '../services/supabaseAPI'

const SalesUpload = () => {
  const [file, setFile] = useState(null)
  const [previewData, setPreviewData] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState(null)
  const fileInputRef = useRef(null)

  // Add state for Trailer History import
  const [trailerFile, setTrailerFile] = useState(null)
  const [trailerPreview, setTrailerPreview] = useState([])
  const [isTrailerUploading, setIsTrailerUploading] = useState(false)
  const [trailerUploadResult, setTrailerUploadResult] = useState(null)
  const trailerFileInputRef = useRef(null)

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      parseCSV(selectedFile)
    } else {
      alert('Please select a valid CSV file')
    }
  }

  const parseCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const preview = results.data.slice(0, 10) // Show first 10 rows
        setPreviewData(preview)
      },
      error: (error) => {
        alert('Error parsing CSV file')
      }
    })
  }

  const extractStoreFromInvoice = (invoiceNo) => {
    if (!invoiceNo) return 1 // Default to store 1 if no invoice number
    
    // Handle formats like "47489-3" (where 3 is the store number)
    const match = invoiceNo.match(/-(\d+)$/)
    if (match) {
      return parseInt(match[1])
    }
    
    // Handle formats like "163478-1" (where 1 is the store number)
    const dashMatch = invoiceNo.match(/-(\d+)$/)
    if (dashMatch) {
      return parseInt(dashMatch[1])
    }
    
    return 1 // Default to store 1 if no match
  }

  const transformRow = (row) => {
    // Log the row data to help debug
    console.log('Processing row:', row)
    
    const storeId = extractStoreFromInvoice(row['Invoice No.'] || row['Ref No.'] || row['ID'] || '')
    
    // Try to find the date field - Uniform Solutions might use different column names
    let dateValue = null
    if (row['Date'] || row['Invoice Date'] || row['Sale Date']) {
      dateValue = new Date(row['Date'] || row['Invoice Date'] || row['Sale Date'])
    } else if (row['8/01/25']) {
      // Handle if the date is in the first column
      dateValue = new Date(row['8/01/25'])
    }
    
    // Try to find quantity and price fields
    let quantity = 1
    let price = 0
    
    // Look for quantity in various possible columns
    if (row['Qty'] || row['Quantity'] || row['Sold Qty']) {
      quantity = parseInt(row['Qty'] || row['Quantity'] || row['Sold Qty']) || 1
    }
    
    // Look for price in various possible columns
    if (row['Price'] || row['Cost'] || row['Retail'] || row['Actual']) {
      price = parseFloat(row['Price'] || row['Cost'] || row['Retail'] || row['Actual']) || 0
    }
    
    // Calculate sales amounts
    const netSales = price * quantity
    const grossSales = price * quantity // Assuming same for now
    
    // VALIDATION: Skip rows with invalid data
    if (!dateValue || isNaN(dateValue.getTime())) {
      console.log('Skipping row - Invalid date:', row)
      return null
    }
    
    if (!storeId || storeId <= 0) {
      console.log('Skipping row - Invalid store ID:', storeId, 'from row:', row)
      return null
    }
    
    if (netSales <= 0 || grossSales <= 0) {
      console.log('Skipping row - Invalid sales amounts:', { netSales, grossSales }, 'from row:', row)
      return null
    }
    
    if (quantity <= 0) {
      console.log('Skipping row - Invalid quantity:', quantity, 'from row:', row)
      return null
    }
    
    if (price <= 0) {
      console.log('Skipping row - Invalid price:', price, 'from row:', row)
      return null
    }
    
    // Try to find vendor/product information
    let vendor = 'Unknown'
    let product = 'Unknown'
    
    if (row['Vendor'] || row['Company'] || row['Location']) {
      vendor = row['Vendor'] || row['Company'] || row['Location']
    }
    
    if (row['Product'] || row['Item'] || row['Description']) {
      product = row['Product'] || row['Item'] || row['Description']
    }

    return {
      date: dateValue.toISOString().split('T')[0],
      status: 'Confirmed',
      sales_tax: 0,
      net_sales: netSales,
      gross_sales: grossSales,
      common_venue_name: `${vendor} - ${product}`,
      Store: storeId,
      // Additional fields for sales data
      invoice_no: row['Invoice No.'] || row['Ref No.'] || row['ID'] || '',
      po_no: row['PO No.'] || '',
      vendor: vendor,
      style: row['Style'] || '',
      color: row['Color'] || '',
      size: row['Size'] || '',
      product: product,
      description: row['Description'] || '',
      department: row['Department'] || '',
      sold_qty: quantity,
      cost: price,
      retail: price,
      actual: price
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadResult(null)

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const transformedData = results.data.map(transformRow).filter(row => row) // Filter out null rows
          
          // Additional validation: Filter out any rows with $0 sales that might have slipped through
          const finalValidData = transformedData.filter(row => {
            const isValid = row.net_sales > 0 && row.gross_sales > 0
            if (!isValid) {
              console.log('Filtering out row with $0 sales:', row)
            }
            return isValid
          })
          
          // Calculate validation statistics
          const totalRows = results.data.length
          const validRows = finalValidData.length
          const skippedRows = totalRows - validRows
          
          console.log(`Validation Results: ${validRows} valid rows, ${skippedRows} skipped rows out of ${totalRows} total`)
          
          if (validRows === 0) {
            setUploadResult({
              success: false,
              error: `No valid rows found. All ${totalRows} rows were skipped due to validation errors.`
            })
            setIsUploading(false)
            return
          }
          
          // Upload in batches of 100
          const batchSize = 100
          let uploaded = 0
          let failed = 0

          for (let i = 0; i < finalValidData.length; i += batchSize) {
            const batch = finalValidData.slice(i, i + batchSize)
            
            try {
              // Upload to trailer_history table
              const result = await supabaseAPI.addRow('trailer_history', batch)
              
              if (result.success) {
                uploaded += batch.length
              } else {
                failed += batch.length
                console.error('Upload failed for batch:', result.error)
              }
              
              setUploadProgress((uploaded / finalValidData.length) * 100)
            } catch (error) {
              failed += batch.length
              console.error('Upload error for batch:', error)
            }
          }

          setUploadResult({
            success: true,
            uploaded,
            failed,
            total: finalValidData.length,
            skipped: skippedRows
          })
          setIsUploading(false)
        },
        error: (error) => {
          setUploadResult({
            success: false,
            error: error.message
          })
          setIsUploading(false)
        }
      })
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadResult({
        success: false,
        error: error.message
      })
      setIsUploading(false)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile)
      parseCSV(droppedFile)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const clearUpload = () => {
    setFile(null)
    setPreviewData([])
    setUploadResult(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleTrailerFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.type === 'text/tab-separated-values' || selectedFile.name.endsWith('.tsv'))) {
      setTrailerFile(selectedFile)
      parseTrailerFile(selectedFile)
    } else {
      alert('Please select a valid CSV or TSV file')
    }
  }

  const parseTrailerFile = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: file.name.endsWith('.tsv') ? '\t' : ',',
      complete: (results) => {
        // Transform and aggregate the data for preview
        const transformedData = results.data.map(transformTrailerRow).filter(row => row.date && row.store)
        
        // Aggregate data by date and store for preview
        const aggregatedData = {}
        for (const row of transformedData) {
          const key = `${row.date}_${row.store}`
          if (!aggregatedData[key]) {
            aggregatedData[key] = {
              date: row.date,
              store: row.store,
              sales_tax: 0,
              net_sales: 0,
              gross_sales: 0,
              record_count: 0
            }
          }
          aggregatedData[key].sales_tax += parseFloat(row.sales_tax || 0)
          aggregatedData[key].net_sales += parseFloat(row.net_sales || 0)
          aggregatedData[key].gross_sales += parseFloat(row.gross_sales || 0)
          aggregatedData[key].record_count += 1
        }
        
        const preview = Object.values(aggregatedData).slice(0, 10)
        setTrailerPreview(preview)
      },
      error: (error) => {
        alert('Error parsing Trailer History file')
      }
    })
  }

  const extractStoreFromRefNo = (refNo) => {
    if (!refNo) return null
    const match = refNo.match(/-(\d+)/)
    return match ? parseInt(match[1]) : null
  }

  const transformTrailerRow = (row) => {
    return {
      date: row['Date'] ? new Date(row['Date']).toISOString() : null,
      store: extractStoreFromRefNo(row['Ref No.']),
      sales_tax: parseFloat(row['Tax']) || 0,
      net_sales: parseFloat(row['Subtotal']) || 0,
      gross_sales: parseFloat(row['Total']) || 0
    }
  }

  const handleTrailerUpload = async () => {
    if (!trailerFile) {
      alert('Please select a file')
      return
    }
    setIsTrailerUploading(true)
    setTrailerUploadResult(null)
    try {
      Papa.parse(trailerFile, {
        header: true,
        skipEmptyLines: true,
        delimiter: trailerFile.name.endsWith('.tsv') ? '\t' : ',',
        complete: async (results) => {
          const transformedData = results.data.map(transformTrailerRow).filter(row => row.date && row.store)
          // Call new service function to upsert into Trailer_History
          const result = await supabaseAPI.importTrailerHistory(transformedData)
          setTrailerUploadResult(result)
          setIsTrailerUploading(false)
        },
        error: (error) => {
          setTrailerUploadResult({ success: false, error: error.message })
          setIsTrailerUploading(false)
        }
      })
    } catch (error) {
      setTrailerUploadResult({ success: false, error: error.message })
      setIsTrailerUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">
            Sales Data Upload
          </h1>
          <p className="mt-2 text-secondary-600">
            Upload CSV files to import sales analysis data for all stores
          </p>
        </div>

        {/* File Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!file ? (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop a CSV file here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary-600 hover:text-primary-500 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports CSV files with sales data
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Upload sales data files here
                </p>
              </div>
            ) : (
              <div>
                <FileText className="mx-auto h-12 w-12 text-primary-500" />
                <p className="mt-2 text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={clearUpload}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Remove file
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Trailer History Upload Section - NOW FIRST */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Trailer History File</h2>
          
          {/* Instructions moved here */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">📋 How to Export from Uniform Solutions:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li><strong>GO TO Uniform Solutions</strong></li>
              <li><strong>File → Export → Sales Invoices</strong></li>
              <li><strong>Choose Date Range and All Stores</strong></li>
              <li>Export the CSV file</li>
              <li>Upload the exported file here</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2">
              <strong>Note:</strong> The system will automatically detect store numbers from the invoice/reference numbers.
            </p>
          </div>
          
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              ref={trailerFileInputRef}
              type="file"
              accept=".csv,.tsv"
              onChange={handleTrailerFileSelect}
              className="hidden"
            />
            
            {!trailerFile ? (
              <div>
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  <button
                    onClick={() => trailerFileInputRef.current?.click()}
                    className="text-primary-600 hover:text-primary-500 font-medium"
                  >
                    Select CSV or TSV file
                  </button>
                  {' '}for Trailer History data
                </p>
                <p className="text-xs text-gray-500">
                  Supports CSV and TSV files with trailer sales data
                </p>
              </div>
            ) : (
              <div>
                <FileText className="mx-auto h-8 w-8 text-primary-500 mb-2" />
                <p className="text-sm font-medium text-gray-900">{trailerFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(trailerFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => {
                    setTrailerFile(null)
                    setTrailerPreview([])
                    setTrailerUploadResult(null)
                    if (trailerFileInputRef.current) {
                      trailerFileInputRef.current.value = ''
                    }
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Remove file
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Trailer Data Preview */}
        {trailerPreview.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Trailer History Preview (Aggregated by Store & Date)</h2>
              <span className="text-sm text-gray-500">Showing first {trailerPreview.length} aggregated records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Tax</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Sales</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Sales</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trailerPreview.map((row, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-sm text-gray-900">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{row.store}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">${row.sales_tax.toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">${row.net_sales.toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">${row.gross_sales.toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{row.record_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Data is automatically aggregated by store and date. Multiple records for the same store on the same date will be summed together.
              </p>
            </div>
          </div>
        )}

        {/* Trailer Upload Button */}
        {trailerFile && (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
            <button
              onClick={handleTrailerUpload}
              disabled={isTrailerUploading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTrailerUploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Importing...
                </div>
              ) : (
                'Import Trailer History'
              )}
            </button>
          </div>
        )}

        {/* Trailer Upload Result */}
        {trailerUploadResult && (
          <div className={`bg-white rounded-lg shadow-sm border p-6 ${
            trailerUploadResult.success ? 'border-green-200' : 'border-red-200'
          }`}>
            <div className="flex items-center">
              {trailerUploadResult.success ? (
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              )}
              <div>
                <h3 className={`text-lg font-medium ${
                  trailerUploadResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {trailerUploadResult.success ? 'Import Complete' : 'Import Failed'}
                </h3>
                <p className={`text-sm ${
                  trailerUploadResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {trailerUploadResult.success
                    ? `Successfully processed ${trailerUploadResult.processed || 0} records${trailerUploadResult.failed > 0 ? `, ${trailerUploadResult.failed} failed` : ''}`
                    : trailerUploadResult.error
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Data Preview */}
        {previewData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Data Preview</h2>
              <span className="text-sm text-gray-500">
                Showing first {previewData.length} rows
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(previewData[0] || {}).map(header => (
                      <th
                        key={header}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate"
                          title={String(value)}
                        >
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Debug Info:</strong> This shows the raw CSV data. Check the browser console for detailed processing information.
              </p>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {file && (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading... {uploadProgress.toFixed(1)}%
                </div>
              ) : (
                'Upload Sales Data'
              )}
            </button>
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div className={`bg-white rounded-lg shadow-sm border p-6 ${
            uploadResult.success ? 'border-green-200' : 'border-red-200'
          }`}>
            <div className="flex items-center">
              {uploadResult.success ? (
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              )}
              <div>
                <h3 className={`text-lg font-medium ${
                  uploadResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {uploadResult.success ? 'Upload Complete' : 'Upload Failed'}
                </h3>
                <p className={`text-sm ${
                  uploadResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {uploadResult.success
                    ? `Successfully uploaded ${uploadResult.uploaded} records${uploadResult.failed > 0 ? `, ${uploadResult.failed} failed` : ''}`
                    : uploadResult.error
                  }
                </p>
                {uploadResult.skipped > 0 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    ⚠️ {uploadResult.skipped} rows were skipped due to validation errors (negative/zero sales, invalid dates, etc.)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesUpload 