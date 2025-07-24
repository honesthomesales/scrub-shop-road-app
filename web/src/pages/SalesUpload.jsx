import React, { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X, Eye, Download } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import Papa from 'papaparse'
import supabaseAPI from '../services/supabaseAPI'

const SalesUpload = () => {
  const { currentSheet } = useApp()
  const [file, setFile] = useState(null)
  const [previewData, setPreviewData] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState(null)
  const [selectedStore, setSelectedStore] = useState('')
  const fileInputRef = useRef(null)

  const stores = [
    { id: 1, name: 'Store 1' },
    { id: 2, name: 'Store 2' },
    { id: 3, name: 'Store 3' },
    { id: 4, name: 'Store 4' },
    { id: 5, name: 'Store 5' }
  ]

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
        console.log('CSV Preview:', preview)
      },
      error: (error) => {
        console.error('CSV Parse Error:', error)
        alert('Error parsing CSV file')
      }
    })
  }

  const extractStoreFromInvoice = (invoiceNo) => {
    if (!invoiceNo) return null
    const match = invoiceNo.match(/-(\d+)/)
    return match ? parseInt(match[1]) : null
  }

  const transformRow = (row) => {
    const storeFromInvoice = extractStoreFromInvoice(row['Invoice No.'])
    const storeId = selectedStore || storeFromInvoice || 1 // Default to store 1 if no match

    return {
      store_id: storeId,
      invoice_date: row['Invoice Date'] ? new Date(row['Invoice Date']).toISOString().split('T')[0] : null,
      invoice_no: row['Invoice No.'] || '',
      po_no: row['PO No.'] || '',
      vendor: row['Vendor'] || '',
      style: row['Style'] || '',
      color: row['Color'] || '',
      size: row['Size'] || '',
      product: row['Product'] || '',
      description: row['Description'] || '',
      department: row['Department'] || '',
      sold_qty: parseInt(row['Sold Qty']) || 0,
      spec_qty: parseInt(row['Spec Qty']) || 0,
      total_qty: parseInt(row['Total Qty']) || 0,
      cost: parseFloat(row['Cost']) || 0,
      retail: parseFloat(row['Retail']) || 0,
      actual: parseFloat(row['Actual']) || 0
    }
  }

  const handleUpload = async () => {
    if (!file || !selectedStore) {
      alert('Please select a file and store')
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
          const transformedData = results.data.map(transformRow).filter(row => row.invoice_date)
          
          // Upload in batches of 100
          const batchSize = 100
          let uploaded = 0
          let failed = 0

          for (let i = 0; i < transformedData.length; i += batchSize) {
            const batch = transformedData.slice(i, i + batchSize)
            
            try {
              const result = await supabaseAPI.addSalesAnalysisBatch(batch)
              
              if (result.success) {
                uploaded += batch.length
              } else {
                failed += batch.length
                console.error('Batch upload failed:', result.error)
              }
              
              setUploadProgress((uploaded / transformedData.length) * 100)
            } catch (error) {
              console.error('Batch upload error:', error)
              failed += batch.length
            }
          }

          setUploadResult({
            success: true,
            uploaded,
            failed,
            total: transformedData.length
          })
          setIsUploading(false)
        },
        error: (error) => {
          console.error('Upload error:', error)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">
            Sales Data Upload
          </h1>
          <p className="mt-2 text-secondary-600">
            Upload CSV files to import sales analysis data
          </p>
        </div>

        {/* Store Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Store Selection</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => setSelectedStore(store.id)}
                className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                  selectedStore === store.id
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {store.name}
              </button>
            ))}
          </div>
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
          </div>
        )}

        {/* Upload Button */}
        {file && selectedStore && (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading... {Math.round(uploadProgress)}%
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesUpload 