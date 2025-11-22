import React, { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'
import Papa from 'papaparse'
import { getSupabase } from '../services/supabaseAPI'

const ExpenseUpload = () => {
  // Format 1: Date, Description, Card Member, Amount
  const [file, setFile] = useState(null)
  const [previewData, setPreviewData] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState(null)
  const fileInputRef = useRef(null)

  // Format 2: Transaction Date, Description, Debit/Credit
  const [file2, setFile2] = useState(null)
  const [previewData2, setPreviewData2] = useState([])
  const [isUploading2, setIsUploading2] = useState(false)
  const [uploadProgress2, setUploadProgress2] = useState(0)
  const [uploadResult2, setUploadResult2] = useState(null)
  const fileInputRef2 = useRef(null)

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
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
        alert('Error parsing CSV file: ' + error.message)
      }
    })
  }

  // Transform function for Format 1: Date, Description, Card Member, Amount
  const transformRow = (row) => {
    // Map Amex CSV columns to our database fields
    // Expected columns: Date, Receipt, Description, Card Member, Account #, Amount
    
    // Try to find date field (case-insensitive) - but NOT Transaction Date (that's format 2)
    let dateValue = null
    const dateFields = ['Date', 'date', 'DATE']
    for (const field of dateFields) {
      if (row[field]) {
        dateValue = new Date(row[field])
        if (!isNaN(dateValue.getTime())) {
          break
        }
      }
    }
    
    // Try to find description field
    const descFields = ['Description', 'description', 'DESCRIPTION', 'Descriptio']
    let description = null
    for (const field of descFields) {
      if (row[field]) {
        description = row[field].trim()
        break
      }
    }
    
    // Try to find card member field
    const cardMemberFields = ['Card Member', 'Card member', 'card member', 'CARD MEMBER', 'CardMember']
    let cardMember = null
    for (const field of cardMemberFields) {
      if (row[field]) {
        cardMember = row[field].trim()
        break
      }
    }
    
    // Try to find amount field
    const amountFields = ['Amount', 'amount', 'AMOUNT', 'Charge Amount']
    let amount = null
    for (const field of amountFields) {
      if (row[field]) {
        // Remove currency symbols and commas
        const cleanedAmount = String(row[field]).replace(/[$,]/g, '').trim()
        amount = parseFloat(cleanedAmount)
        if (!isNaN(amount)) {
          break
        }
      }
    }
    
    // VALIDATION: Skip rows with invalid data
    if (!dateValue || isNaN(dateValue.getTime())) {
      console.log('Skipping row - Invalid date:', row)
      return null
    }
    
    if (!amount || amount <= 0) {
      console.log('Skipping row - Invalid amount:', amount, 'from row:', row)
      return null
    }
    
    // Description is optional but recommended
    if (!description) {
      description = 'No description provided'
    }
    
    return {
      date: dateValue.toISOString().split('T')[0], // Format as YYYY-MM-DD
      description: description,
      card_member: cardMember || null,
      amount: amount,
      source: 'AMEX'
    }
  }

  // Transform function for Format 2: Transaction Date, Description, Debit/Credit
  const transformRowFormat2 = (row) => {
    // Map Amex CSV columns to our database fields
    // Expected columns: Transaction Date, Posted Date, Card No., Description, Category, Debit, Credit
    
    // Try to find Transaction Date field
    let dateValue = null
    const dateFields = ['Transaction Date', 'Transaction date', 'transaction date', 'TRANSACTION DATE']
    for (const field of dateFields) {
      if (row[field]) {
        dateValue = new Date(row[field])
        if (!isNaN(dateValue.getTime())) {
          break
        }
      }
    }
    
    // Try to find description field
    const descFields = ['Description', 'description', 'DESCRIPTION', 'Descriptio']
    let description = null
    for (const field of descFields) {
      if (row[field]) {
        description = row[field].trim()
        break
      }
    }
    
    // Try to find Debit field (positive amount)
    const debitFields = ['Debit', 'debit', 'DEBIT']
    let debit = null
    for (const field of debitFields) {
      if (row[field]) {
        const cleanedAmount = String(row[field]).replace(/[$,]/g, '').trim()
        debit = parseFloat(cleanedAmount)
        if (!isNaN(debit) && debit > 0) {
          break
        }
      }
    }
    
    // Try to find Credit field (negative amount)
    const creditFields = ['Credit', 'credit', 'CREDIT']
    let credit = null
    for (const field of creditFields) {
      if (row[field]) {
        const cleanedAmount = String(row[field]).replace(/[$,]/g, '').trim()
        credit = parseFloat(cleanedAmount)
        if (!isNaN(credit) && credit > 0) {
          break
        }
      }
    }
    
    // Calculate amount: Debit is positive, Credit is negative
    let amount = null
    if (debit && debit > 0) {
      amount = debit
    } else if (credit && credit > 0) {
      amount = -credit // Make credit negative
    }
    
    // VALIDATION: Skip rows with invalid data
    if (!dateValue || isNaN(dateValue.getTime())) {
      console.log('Skipping row - Invalid date:', row)
      return null
    }
    
    if (!amount || amount === 0) {
      console.log('Skipping row - Invalid amount (no debit or credit):', row)
      return null
    }
    
    // Description is optional but recommended
    if (!description) {
      description = 'No description provided'
    }
    
    return {
      date: dateValue.toISOString().split('T')[0], // Format as YYYY-MM-DD
      description: description,
      card_member: null, // Card No. is ignored
      amount: amount,
      source: 'AMEX'
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
          
          // Additional validation: Filter out any rows with invalid amounts
          const finalValidData = transformedData.filter(row => {
            const isValid = row.amount > 0 && row.date
            if (!isValid) {
              console.log('Filtering out invalid row:', row)
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

          const supabase = getSupabase()
          if (!supabase) {
            setUploadResult({
              success: false,
              error: 'Supabase client not available'
            })
            setIsUploading(false)
            return
          }

          for (let i = 0; i < finalValidData.length; i += batchSize) {
            const batch = finalValidData.slice(i, i + batchSize)
            
            try {
              // Upload batch to expenses table
              const { data, error } = await supabase
                .from('expenses')
                .insert(batch)
                .select()
              
              if (error) {
                failed += batch.length
                console.error('Upload failed for batch:', error)
              } else {
                uploaded += batch.length
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
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
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

  // Format 2 handlers
  const handleFileSelect2 = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile2(selectedFile)
      parseCSV2(selectedFile)
    } else {
      alert('Please select a valid CSV file')
    }
  }

  const parseCSV2 = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const preview = results.data.slice(0, 10) // Show first 10 rows
        setPreviewData2(preview)
      },
      error: (error) => {
        alert('Error parsing CSV file: ' + error.message)
      }
    })
  }

  const handleUpload2 = async () => {
    if (!file2) {
      alert('Please select a file')
      return
    }

    setIsUploading2(true)
    setUploadProgress2(0)
    setUploadResult2(null)

    try {
      Papa.parse(file2, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const transformedData = results.data.map(transformRowFormat2).filter(row => row) // Filter out null rows
          
          // Additional validation: Filter out any rows with invalid amounts
          const finalValidData = transformedData.filter(row => {
            const isValid = row.amount !== 0 && row.date
            if (!isValid) {
              console.log('Filtering out invalid row:', row)
            }
            return isValid
          })
          
          // Calculate validation statistics
          const totalRows = results.data.length
          const validRows = finalValidData.length
          const skippedRows = totalRows - validRows
          
          console.log(`Validation Results: ${validRows} valid rows, ${skippedRows} skipped rows out of ${totalRows} total`)
          
          if (validRows === 0) {
            setUploadResult2({
              success: false,
              error: `No valid rows found. All ${totalRows} rows were skipped due to validation errors.`
            })
            setIsUploading2(false)
            return
          }
          
          // Upload in batches of 100
          const batchSize = 100
          let uploaded = 0
          let failed = 0

          const supabase = getSupabase()
          if (!supabase) {
            setUploadResult2({
              success: false,
              error: 'Supabase client not available'
            })
            setIsUploading2(false)
            return
          }

          for (let i = 0; i < finalValidData.length; i += batchSize) {
            const batch = finalValidData.slice(i, i + batchSize)
            
            try {
              // Upload batch to expenses table
              const { data, error } = await supabase
                .from('expenses')
                .insert(batch)
                .select()
              
              if (error) {
                failed += batch.length
                console.error('Upload failed for batch:', error)
              } else {
                uploaded += batch.length
              }
              
              setUploadProgress2((uploaded / finalValidData.length) * 100)
            } catch (error) {
              failed += batch.length
              console.error('Upload error for batch:', error)
            }
          }

          setUploadResult2({
            success: true,
            uploaded,
            failed,
            total: finalValidData.length,
            skipped: skippedRows
          })
          setIsUploading2(false)
        },
        error: (error) => {
          setUploadResult2({
            success: false,
            error: error.message
          })
          setIsUploading2(false)
        }
      })
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadResult2({
        success: false,
        error: error.message
      })
      setIsUploading2(false)
    }
  }

  const handleDrop2 = (event) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile2(droppedFile)
      parseCSV2(droppedFile)
    }
  }

  const handleDragOver2 = (event) => {
    event.preventDefault()
  }

  const clearUpload2 = () => {
    setFile2(null)
    setPreviewData2([])
    setUploadResult2(null)
    setUploadProgress2(0)
    if (fileInputRef2.current) {
      fileInputRef2.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">
            Expense Data Upload
          </h1>
          <p className="mt-2 text-secondary-600">
            Upload CSV files to import Amex expense data
          </p>
        </div>

        {/* File Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File</h2>
          
          {/* Expected CSV Format */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Expected CSV Format - Required columns:</strong>
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li><strong>Date</strong> - Transaction date</li>
              <li><strong>Description</strong> - Expense description</li>
              <li><strong>Card Member</strong> - Name of card member</li>
              <li><strong>Amount</strong> - Expense amount</li>
            </ul>
            <p className="text-xs text-blue-600 mt-3">
              <strong>Note:</strong> Receipt and Account # columns will be ignored. All expenses imported from this page will have source set to "AMEX".
            </p>
          </div>
          
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
                  Supports CSV files with Amex expense data
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
                <strong>Note:</strong> This shows the raw CSV data. The system will map Date, Description, Card Member, and Amount fields automatically.
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
                'Upload Expense Data'
              )}
            </button>
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div className={`bg-white rounded-lg shadow-sm border p-6 mb-6 ${
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
                    ⚠️ {uploadResult.skipped} rows were skipped due to validation errors (invalid dates, amounts, etc.)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Format 2: Transaction Date, Debit/Credit Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File (Transaction Date Format)</h2>
          
          {/* Expected CSV Format */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Expected CSV Format - Required columns:</strong>
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li><strong>Transaction Date</strong> - Transaction date</li>
              <li><strong>Description</strong> - Expense description</li>
              <li><strong>Debit</strong> - Expense amount (positive)</li>
              <li><strong>Credit</strong> - Credit amount (negative)</li>
            </ul>
            <p className="text-xs text-blue-600 mt-3">
              <strong>Note:</strong> Card No., Category, and Posted Date columns will be ignored. Debit values are stored as positive amounts, Credit values as negative amounts. All expenses imported from this page will have source set to "AMEX".
            </p>
          </div>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file2 ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop2}
            onDragOver={handleDragOver2}
          >
            <input
              ref={fileInputRef2}
              type="file"
              accept=".csv"
              onChange={handleFileSelect2}
              className="hidden"
            />
            
            {!file2 ? (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop a CSV file here, or{' '}
                  <button
                    onClick={() => fileInputRef2.current?.click()}
                    className="text-primary-600 hover:text-primary-500 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports CSV files with Transaction Date, Debit/Credit format
                </p>
              </div>
            ) : (
              <div>
                <FileText className="mx-auto h-12 w-12 text-primary-500" />
                <p className="mt-2 text-sm font-medium text-gray-900">{file2.name}</p>
                <p className="text-xs text-gray-500">
                  {(file2.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={clearUpload2}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Remove file
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Format 2 Data Preview */}
        {previewData2.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Data Preview</h2>
              <span className="text-sm text-gray-500">
                Showing first {previewData2.length} rows
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(previewData2[0] || {}).map(header => (
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
                  {previewData2.map((row, index) => (
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
                <strong>Note:</strong> This shows the raw CSV data. The system will map Transaction Date, Description, and Debit/Credit fields automatically. Debit values become positive amounts, Credit values become negative amounts.
              </p>
            </div>
          </div>
        )}

        {/* Format 2 Upload Button */}
        {file2 && (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
            <button
              onClick={handleUpload2}
              disabled={isUploading2}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading2 ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading... {uploadProgress2.toFixed(1)}%
                </div>
              ) : (
                'Upload Expense Data'
              )}
            </button>
          </div>
        )}

        {/* Format 2 Upload Result */}
        {uploadResult2 && (
          <div className={`bg-white rounded-lg shadow-sm border p-6 ${
            uploadResult2.success ? 'border-green-200' : 'border-red-200'
          }`}>
            <div className="flex items-center">
              {uploadResult2.success ? (
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              )}
              <div>
                <h3 className={`text-lg font-medium ${
                  uploadResult2.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {uploadResult2.success ? 'Upload Complete' : 'Upload Failed'}
                </h3>
                <p className={`text-sm ${
                  uploadResult2.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {uploadResult2.success
                    ? `Successfully uploaded ${uploadResult2.uploaded} records${uploadResult2.failed > 0 ? `, ${uploadResult2.failed} failed` : ''}`
                    : uploadResult2.error
                  }
                </p>
                {uploadResult2.skipped > 0 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    ⚠️ {uploadResult2.skipped} rows were skipped due to validation errors (invalid dates, amounts, etc.)
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

export default ExpenseUpload

