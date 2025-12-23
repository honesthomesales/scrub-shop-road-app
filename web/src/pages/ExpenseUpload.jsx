import React, { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'
import Papa from 'papaparse'
import { getSupabase } from '../services/supabaseAPI'
import { parseCSVDate } from '../utils/dateUtils'

const ExpenseUpload = () => {
  // Format 1: Date, Description, Card Member, Amount
  const [file, setFile] = useState(null)
  const [previewData, setPreviewData] = useState([])
  const [transformedPreview, setTransformedPreview] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState(null)
  const [duplicates, setDuplicates] = useState([])
  const [duplicatesTotal, setDuplicatesTotal] = useState(0)
  const [selectedDuplicates, setSelectedDuplicates] = useState(new Set())
  const [validationErrors, setValidationErrors] = useState([])
  const [validationErrorsTotal, setValidationErrorsTotal] = useState(0)
  const [selectedValidationErrors, setSelectedValidationErrors] = useState(new Set())
  const fileInputRef = useRef(null)

  // Format 2: Transaction Date, Description, Debit/Credit
  const [file2, setFile2] = useState(null)
  const [previewData2, setPreviewData2] = useState([])
  const [isUploading2, setIsUploading2] = useState(false)
  const [uploadProgress2, setUploadProgress2] = useState(0)
  const [uploadResult2, setUploadResult2] = useState(null)
  const [duplicates2, setDuplicates2] = useState([])
  const [duplicatesTotal2, setDuplicatesTotal2] = useState(0)
  const [selectedDuplicates2, setSelectedDuplicates2] = useState(new Set())
  const [validationErrors2, setValidationErrors2] = useState([])
  const [validationErrorsTotal2, setValidationErrorsTotal2] = useState(0)
  const [selectedValidationErrors2, setSelectedValidationErrors2] = useState(new Set())
  const fileInputRef2 = useRef(null)

  // Format 3: Truist - Transaction Date, Full description, Check/Serial #, Amount
  const [file3, setFile3] = useState(null)
  const [previewData3, setPreviewData3] = useState([])
  const [isUploading3, setIsUploading3] = useState(false)
  const [uploadProgress3, setUploadProgress3] = useState(0)
  const [uploadResult3, setUploadResult3] = useState(null)
  const [duplicates3, setDuplicates3] = useState([])
  const [duplicatesTotal3, setDuplicatesTotal3] = useState(0)
  const [selectedDuplicates3, setSelectedDuplicates3] = useState(new Set())
  const [validationErrors3, setValidationErrors3] = useState([])
  const [validationErrorsTotal3, setValidationErrorsTotal3] = useState(0)
  const [selectedValidationErrors3, setSelectedValidationErrors3] = useState(new Set())
  const fileInputRef3 = useRef(null)

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
        // Also show transformed data preview
        const transformed = preview.map(transformRow).filter(row => row !== null)
        setTransformedPreview(transformed)
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
        const rawDate = row[field]
        dateValue = parseCSVDate(rawDate)
        if (dateValue) {
          console.log(`[AMEX Format] Parsed date: "${rawDate}" -> "${dateValue}"`)
          break
        } else {
          console.warn(`[AMEX Format] Failed to parse date: "${rawDate}" from row:`, row)
        }
      }
    }
    
    // Log if no date found
    if (!dateValue) {
      console.error('[AMEX Format] No date field found in row. Available fields:', Object.keys(row))
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
    
    // Try to find amount field - handle positive and negative values (including parentheses for credits/refunds)
    const amountFields = ['Amount', 'amount', 'AMOUNT', 'Charge Amount']
    let amount = null
    let originalIsNegative = false
    for (const field of amountFields) {
      if (row[field]) {
        let rawAmount = String(row[field]).trim()
        // Handle negative amounts in parentheses like "($339.22)" or negative sign like "-$339.22"
        const isNegative = rawAmount.startsWith('(') && rawAmount.endsWith(')') || rawAmount.startsWith('-')
        originalIsNegative = isNegative
        
        // For AMEX: Do NOT import negative amounts (credits/refunds) - skip them silently
        // AMEX CSV shows expenses as positive, but we store as negative (matching other sources)
        if (isNegative) {
          console.log('[AMEX Format] Skipping row - Negative amount (credit/refund) not imported:', rawAmount, 'from row:', row)
          return null // Silently skip, don't show as validation error
        }
        
        // Remove currency symbols and commas
        let cleanedAmount = rawAmount.replace(/[$,]/g, '').trim()
        let parsed = parseFloat(cleanedAmount)
        if (!isNaN(parsed)) {
          // For AMEX: CSV shows expenses as positive amounts
          // Convert to negative for storage (all sources: negative = expense, positive = income)
          amount = -Math.abs(parsed) // Positive CSV expense → Negative in database
          break
        }
      }
    }
    
    // VALIDATION: Skip rows with invalid data
    if (!dateValue) {
      console.log('[AMEX Format] Skipping row - Invalid date:', row)
      return { _validationError: true, _errorReason: 'Invalid or missing date', _originalRow: row }
    }
    
    // Amount must be non-zero (can be positive for income or negative for expenses)
    if (amount === null || amount === 0 || isNaN(amount)) {
      console.log('[AMEX Format] Skipping row - Invalid amount (zero or NaN):', amount, 'from row:', row)
      return { _validationError: true, _errorReason: 'Invalid amount (zero, null, or NaN)', _originalRow: row }
    }
    
    // Description is optional but recommended
    if (!description) {
      description = 'No description provided'
    }
    
    const result = {
      date: dateValue, // Already in YYYY-MM-DD format from parseCSVDate
      description: description,
      card_member: cardMember || null,
      amount: amount, // After swap and flip: Positive = expense, Negative = income
      source: 'AMEX'
    }
    console.log('[AMEX Format] Transformed row result:', result)
    return result
    console.log('[AMEX Format] Transformed row result:', result)
    return result
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
        const rawDate = row[field]
        dateValue = parseCSVDate(rawDate)
        if (dateValue) {
          console.log(`[CAPITAL ONE Format] Parsed date: "${rawDate}" -> "${dateValue}"`)
          break
        } else {
          console.warn(`[CAPITAL ONE Format] Failed to parse date: "${rawDate}" from row:`, row)
        }
      }
    }
    
    // Log if no date found
    if (!dateValue) {
      console.error('[CAPITAL ONE Format] No Transaction Date field found in row. Available fields:', Object.keys(row))
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
    
    // Calculate amount: Flip all signs directly from CSV
    // Capital One CSV: Debit = expense (positive), Credit = income (positive)
    // User wants: all positive values become negative, all negative values become positive
    // So: Debit (positive) → negative, Credit (positive) → negative
    let amount = null
    if (debit && debit > 0) {
      amount = -debit // Debit (positive) → Negative
    } else if (credit && credit > 0) {
      amount = -credit // Credit (positive) → Negative
    }
    
    // VALIDATION: Skip rows with invalid data
    if (!dateValue) {
      console.log('Skipping row - Invalid date:', row)
      return { _validationError: true, _errorReason: 'Invalid or missing Transaction Date', _originalRow: row }
    }
    
    if (!amount || amount === 0) {
      console.log('Skipping row - Invalid amount (no debit or credit):', row)
      return { _validationError: true, _errorReason: 'Invalid amount (no debit or credit found)', _originalRow: row }
    }
    
    // Description is optional but recommended
    if (!description) {
      description = 'No description provided'
    }
    
    const result = {
      date: dateValue, // Already in YYYY-MM-DD format from parseCSVDate
      description: description,
      card_member: null, // Card No. is ignored
      amount: amount,
      source: 'CAPITAL ONE' // Fixed: should be CAPITAL ONE, not AMEX
    }
    console.log('[CAPITAL ONE Format] Transformed row result:', result)
    return result
  }

  const handleUpload = async (includeSelectedDuplicates = false) => {
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
          const transformedData = results.data.map(transformRow)
          
          // Separate valid data from validation errors
          const validData = []
          const validationErrorRecords = []
          
          transformedData.forEach((row, index) => {
            if (row && row._validationError) {
              // This is a validation error - store it with the transformed data if available
              const errorRecord = {
                ...row,
                _errorIndex: index,
                date: row.date || 'N/A',
                description: row.description || row._originalRow?.Description || 'N/A',
                card_member: row.card_member || row._originalRow?.['Card Member'] || 'N/A',
                amount: row.amount || row._originalRow?.Amount || 'N/A',
                source: 'AMEX'
              }
              validationErrorRecords.push(errorRecord)
            } else if (row) {
              // Additional validation check
              const hasValidAmount = row.amount !== 0 && !isNaN(row.amount)
              const hasValidDate = !!row.date
              if (hasValidAmount && hasValidDate) {
                validData.push(row)
              } else {
                // Secondary validation error
                const errorReason = !hasValidDate ? 'Invalid or missing date' : 'Invalid amount (zero, null, or NaN)'
                const errorRecord = {
                  _validationError: true,
                  _errorReason: errorReason,
                  _errorIndex: index,
                  date: row.date || 'N/A',
                  description: row.description || 'N/A',
                  card_member: row.card_member || 'N/A',
                  amount: row.amount || 'N/A',
                  source: 'AMEX'
                }
                validationErrorRecords.push(errorRecord)
              }
            }
          })
          
          // Calculate validation statistics
          const totalRows = results.data.length
          const validRows = validData.length
          const skippedRows = validationErrorRecords.length
          
          console.log(`Validation Results: ${validRows} valid rows, ${skippedRows} skipped rows out of ${totalRows} total`)
          
          // Store validation errors for user review (first 10)
          if (validationErrorRecords.length > 0) {
            const first10Errors = validationErrorRecords.slice(0, 10)
            setValidationErrors(first10Errors)
            setValidationErrorsTotal(validationErrorRecords.length)
            setSelectedValidationErrors(new Set())
          }
          
          if (validRows === 0 && validationErrorRecords.length === 0) {
            setUploadResult({
              success: false,
              error: `No valid rows found. All ${totalRows} rows were skipped.`
            })
            setIsUploading(false)
            return
          }
          
          // Use validData instead of finalValidData
          const finalValidData = validData
          
          const supabase = getSupabase()
          if (!supabase) {
            setUploadResult({
              success: false,
              error: 'Supabase client not available'
            })
            setIsUploading(false)
            return
          }

          // Check for duplicates before uploading
          const { unique: uniqueData, duplicates: duplicateRecords } = await filterDuplicates(finalValidData, supabase)
          
          // CRITICAL: If duplicates or validation errors are found on first upload attempt, ALWAYS stop and show them
          if (!includeSelectedDuplicates) {
            if (duplicateRecords.length > 0 || validationErrorRecords.length > 0) {
              // Store duplicates for user review (first 10)
              if (duplicateRecords.length > 0) {
                const first10Duplicates = duplicateRecords.slice(0, 10)
                setDuplicates(first10Duplicates)
                setDuplicatesTotal(duplicateRecords.length)
                setSelectedDuplicates(new Set())
              }
              // Always stop to show duplicates/errors for user review - DO NOT PROCEED
              setIsUploading(false)
              return
            }
          }
          
          // If including selected duplicates and/or validation errors, merge them with unique data
          let dataToUpload = [...uniqueData]
          
          // Add selected validation errors
          if (includeSelectedDuplicates && validationErrors.length > 0) {
            const selected = validationErrors.filter((_, index) => selectedValidationErrors.has(index))
            // Remove the tracking fields before upload
            const cleanedSelected = selected.map(({ _validationError, _errorReason, _errorIndex, _originalRow, ...rest }) => rest)
            dataToUpload = [...dataToUpload, ...cleanedSelected]
          }
          
          // Add selected duplicates
          if (includeSelectedDuplicates && duplicates.length > 0) {
            const selected = duplicates.filter((_, index) => selectedDuplicates.has(index))
            // Remove the tracking fields before upload
            const cleanedSelected = selected.map(({ _duplicateIndex, _duplicateKey, ...rest }) => rest)
            dataToUpload = [...dataToUpload, ...cleanedSelected]
          }
          
          if (dataToUpload.length === 0) {
            setUploadResult({
              success: false,
              error: `No valid records to upload.`
            })
            setIsUploading(false)
            return
          }

          // Upload in batches of 100
          const batchSize = 100
          let uploaded = 0
          let failed = 0

          for (let i = 0; i < dataToUpload.length; i += batchSize) {
            const batch = dataToUpload.slice(i, i + batchSize)
            
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
              
              setUploadProgress((uploaded / dataToUpload.length) * 100)
            } catch (error) {
              failed += batch.length
              console.error('Upload error for batch:', error)
            }
          }

          // Only show duplicate count if duplicates were actually skipped (not selected for import)
          const duplicatesSkipped = includeSelectedDuplicates && duplicates.length > 0 
            ? duplicatesTotal - selectedDuplicates.size 
            : 0
          
          setUploadResult({
            success: true,
            uploaded,
            failed,
            total: finalValidData.length,
            skipped: skippedRows,
            duplicates: duplicatesSkipped
          })
          setIsUploading(false)
          // Clear duplicates and validation errors after successful upload
          setDuplicates([])
          setDuplicatesTotal(0)
          setSelectedDuplicates(new Set())
          setValidationErrors([])
          setValidationErrorsTotal(0)
          setSelectedValidationErrors(new Set())
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
    setTransformedPreview([])
    setUploadResult(null)
    setUploadProgress(0)
    setDuplicates([])
    setDuplicatesTotal(0)
    setSelectedDuplicates(new Set())
    setValidationErrors([])
    setValidationErrorsTotal(0)
    setSelectedValidationErrors(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Helper function to normalize description for duplicate checking
  const normalizeDescription = (desc) => {
    if (!desc) return ''
    return desc
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Helper function to check for duplicates and return them separately
  // Duplicates are defined as: same date, description, amount, and source
  const filterDuplicates = async (expenseData, supabase) => {
    if (!expenseData || expenseData.length === 0) return { unique: [], duplicates: [] }

    // Get date range from the data
    const dates = expenseData.map(e => e.date).filter(Boolean)
    if (dates.length === 0) return { unique: expenseData, duplicates: [] }

    const minDate = dates.reduce((min, d) => d < min ? d : min)
    const maxDate = dates.reduce((max, d) => d > max ? d : max)

    // Fetch existing expenses in the date range
    const { data: existingExpenses, error } = await supabase
      .from('expenses')
      .select('date, description, amount, source')
      .gte('date', minDate)
      .lte('date', maxDate)

    if (error) {
      console.error('Error checking for duplicates:', error)
      // If we can't check, proceed with all data but log warning
      return { unique: expenseData, duplicates: [], error: 'Could not check for duplicates' }
    }

    // Create a Set of existing expense keys (date + normalized description + amount + source)
    // Use signed amount so refunds are not treated as duplicates of charges
    const existingKeys = new Set()
    if (existingExpenses) {
      existingExpenses.forEach(exp => {
        const normalizedDesc = normalizeDescription(exp.description || '')
        const amount = (parseFloat(exp.amount) || 0).toFixed(2) // Keep sign (positive/negative)
        const source = (exp.source || '').trim().toUpperCase()
        const key = `${exp.date}_${normalizedDesc}_${amount}_${source}`
        existingKeys.add(key)
      })
    }

    // Separate unique and duplicate records
    const unique = []
    const duplicates = []
    const seenInBatch = new Set()

    expenseData.forEach((exp, index) => {
      const normalizedDesc = normalizeDescription(exp.description || '')
      const amount = (parseFloat(exp.amount) || 0).toFixed(2) // Keep sign (positive/negative)
      const source = (exp.source || '').trim().toUpperCase()
      const key = `${exp.date}_${normalizedDesc}_${amount}_${source}`

      if (existingKeys.has(key) || seenInBatch.has(key)) {
        // Add index to track which record this is
        duplicates.push({ ...exp, _duplicateIndex: index, _duplicateKey: key })
      } else {
        unique.push(exp)
        // Add to set to prevent duplicates within the same batch
        seenInBatch.add(key)
        existingKeys.add(key)
      }
    })

    return { unique, duplicates }
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

  const handleUpload2 = async (includeSelectedDuplicates = false) => {
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
          const transformedData = results.data.map(transformRowFormat2)
          
          // Separate valid data from validation errors
          const validData = []
          const validationErrorRecords = []
          
          transformedData.forEach((row, index) => {
            if (row && row._validationError) {
              // This is a validation error - store it with the transformed data if available
              const errorRecord = {
                ...row,
                _errorIndex: index,
                date: row.date || 'N/A',
                description: row.description || row._originalRow?.Description || 'N/A',
                card_member: row.card_member || null,
                amount: row.amount || row._originalRow?.Debit || row._originalRow?.Credit || 'N/A',
                source: 'CAPITAL ONE'
              }
              validationErrorRecords.push(errorRecord)
            } else if (row) {
              // Additional validation check
              const hasValidAmount = row.amount !== 0 && !isNaN(row.amount)
              const hasValidDate = !!row.date
              if (hasValidAmount && hasValidDate) {
                validData.push(row)
              } else {
                // Secondary validation error
                const errorReason = !hasValidDate ? 'Invalid or missing date' : 'Invalid amount (zero, null, or NaN)'
                const errorRecord = {
                  _validationError: true,
                  _errorReason: errorReason,
                  _errorIndex: index,
                  date: row.date || 'N/A',
                  description: row.description || 'N/A',
                  card_member: row.card_member || null,
                  amount: row.amount || 'N/A',
                  source: 'CAPITAL ONE'
                }
                validationErrorRecords.push(errorRecord)
              }
            }
          })
          
          // Calculate validation statistics
          const totalRows = results.data.length
          const validRows = validData.length
          const skippedRows = validationErrorRecords.length
          
          console.log(`Validation Results: ${validRows} valid rows, ${skippedRows} skipped rows out of ${totalRows} total`)
          
          // Store validation errors for user review (first 10)
          if (validationErrorRecords.length > 0) {
            const first10Errors = validationErrorRecords.slice(0, 10)
            setValidationErrors2(first10Errors)
            setValidationErrorsTotal2(validationErrorRecords.length)
            setSelectedValidationErrors2(new Set())
          }
          
          if (validRows === 0 && validationErrorRecords.length === 0) {
            setUploadResult2({
              success: false,
              error: `No valid rows found. All ${totalRows} rows were skipped.`
            })
            setIsUploading2(false)
            return
          }
          
          // Use validData instead of finalValidData
          const finalValidData = validData
          
          const supabase = getSupabase()
          if (!supabase) {
            setUploadResult2({
              success: false,
              error: 'Supabase client not available'
            })
            setIsUploading2(false)
            return
          }

          // Check for duplicates before uploading
          const { unique: uniqueData, duplicates: duplicateRecords } = await filterDuplicates(finalValidData, supabase)
          
          // CRITICAL: If duplicates or validation errors are found on first upload attempt, ALWAYS stop and show them
          if (!includeSelectedDuplicates) {
            if (duplicateRecords.length > 0 || validationErrorRecords.length > 0) {
              // Store duplicates for user review (first 10)
              if (duplicateRecords.length > 0) {
                const first10Duplicates = duplicateRecords.slice(0, 10)
                setDuplicates2(first10Duplicates)
                setDuplicatesTotal2(duplicateRecords.length)
                setSelectedDuplicates2(new Set())
              }
              // Always stop to show duplicates/errors for user review - DO NOT PROCEED
              setIsUploading2(false)
              return
            }
          }
          
          // If including selected duplicates and/or validation errors, merge them with unique data
          let dataToUpload = [...uniqueData]
          
          // Add selected validation errors
          if (includeSelectedDuplicates && validationErrors2.length > 0) {
            const selected = validationErrors2.filter((_, index) => selectedValidationErrors2.has(index))
            // Remove the tracking fields before upload
            const cleanedSelected = selected.map(({ _validationError, _errorReason, _errorIndex, _originalRow, ...rest }) => rest)
            dataToUpload = [...dataToUpload, ...cleanedSelected]
          }
          
          // Add selected duplicates
          if (includeSelectedDuplicates && duplicates2.length > 0) {
            const selected = duplicates2.filter((_, index) => selectedDuplicates2.has(index))
            // Remove the tracking fields before upload
            const cleanedSelected = selected.map(({ _duplicateIndex, _duplicateKey, ...rest }) => rest)
            dataToUpload = [...dataToUpload, ...cleanedSelected]
          }
          
          if (dataToUpload.length === 0) {
            setUploadResult2({
              success: false,
              error: `No valid records to upload.`
            })
            setIsUploading2(false)
            return
          }

          // Upload in batches of 100
          const batchSize = 100
          let uploaded = 0
          let failed = 0

          for (let i = 0; i < dataToUpload.length; i += batchSize) {
            const batch = dataToUpload.slice(i, i + batchSize)
            
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
              
              setUploadProgress2((uploaded / dataToUpload.length) * 100)
            } catch (error) {
              failed += batch.length
              console.error('Upload error for batch:', error)
            }
          }

          // Only show duplicate count if duplicates were actually skipped (not selected for import)
          const duplicatesSkipped = includeSelectedDuplicates && duplicates2.length > 0 
            ? duplicatesTotal2 - selectedDuplicates2.size 
            : 0
          
          setUploadResult2({
            success: true,
            uploaded,
            failed,
            total: finalValidData.length,
            skipped: skippedRows,
            duplicates: duplicatesSkipped
          })
          setIsUploading2(false)
          // Clear duplicates and validation errors after successful upload
          setDuplicates2([])
          setDuplicatesTotal2(0)
          setSelectedDuplicates2(new Set())
          setValidationErrors2([])
          setValidationErrorsTotal2(0)
          setSelectedValidationErrors2(new Set())
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
    setDuplicates2([])
    setDuplicatesTotal2(0)
    setSelectedDuplicates2(new Set())
    setValidationErrors2([])
    setValidationErrorsTotal2(0)
    setSelectedValidationErrors2(new Set())
    if (fileInputRef2.current) {
      fileInputRef2.current.value = ''
    }
  }

  // Format 3: Truist handlers
  const handleFileSelect3 = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile3(selectedFile)
      parseCSV3(selectedFile)
    } else {
      alert('Please select a valid CSV file')
    }
  }

  const parseCSV3 = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const preview = results.data.slice(0, 10) // Show first 10 rows
        setPreviewData3(preview)
      },
      error: (error) => {
        alert('Error parsing CSV file: ' + error.message)
      }
    })
  }

  // Transform function for Format 3: Truist - Transaction Date, Full description, Check/Serial #, Amount
  const transformRowFormat3 = (row) => {
    // Map Truist CSV columns to our database fields
    // Expected columns: Posted Date, Transaction Date, Transaction Type, Check/Serial #, Full description, Merchant name, Sub-category name, Amount, Daily Posted Balance
    
    // Try to find Transaction Date field first, then fall back to Posted Date
    let dateValue = null
    const dateFields = ['Transaction Date', 'Transaction date', 'transaction date', 'TRANSACTION DATE', 'Posted Date', 'Posted date', 'POSTED DATE']
    for (const field of dateFields) {
      if (row[field]) {
        const rawDate = String(row[field]).trim()
        // Skip dates that are clearly invalid (like "########" or empty)
        if (!rawDate || rawDate === '########' || /^#+$/.test(rawDate) || rawDate.toLowerCase() === 'n/a' || rawDate.toLowerCase() === 'na') {
          continue
        }
        dateValue = parseCSVDate(rawDate)
        if (dateValue) {
          console.log(`[TRUIST Format] Parsed date: "${rawDate}" -> "${dateValue}"`)
          break
        } else {
          console.warn(`[TRUIST Format] Failed to parse date: "${rawDate}" from row:`, row)
        }
      }
    }
    
    // Log if no date found
    if (!dateValue) {
      console.error('[TRUIST Format] No valid Transaction Date or Posted Date field found in row. Available fields:', Object.keys(row))
    }
    
    // Try to find Full description field
    const descFields = ['Full description', 'Full Description', 'FULL DESCRIPTION', 'Description', 'description']
    let description = null
    for (const field of descFields) {
      if (row[field]) {
        description = row[field].trim()
        break
      }
    }
    
    // Try to find Check/Serial # field
    const checkFields = ['Check/Serial #', 'Check/Serial Number', 'Check Serial', 'Check/Serial', 'CHECK/SERIAL #']
    let checkNbr = null
    for (const field of checkFields) {
      if (row[field]) {
        checkNbr = String(row[field]).trim()
        if (checkNbr) {
          break
        }
      }
    }
    
    // Try to find Amount field - handle negative amounts in parentheses like "(339)" = -339
    const amountFields = ['Amount', 'amount', 'AMOUNT']
    let amount = null
    for (const field of amountFields) {
      if (row[field]) {
        let cleanedAmount = String(row[field]).trim()
        // Handle negative amounts in parentheses: "(339)" -> -339
        const isNegative = cleanedAmount.startsWith('(') && cleanedAmount.endsWith(')')
        if (isNegative) {
          cleanedAmount = cleanedAmount.replace(/[()]/g, '')
        }
        // Remove currency symbols, commas, and other non-numeric characters except minus sign
        cleanedAmount = cleanedAmount.replace(/[$,]/g, '').trim()
        amount = parseFloat(cleanedAmount)
        if (!isNaN(amount)) {
          // Apply negative sign if it was in parentheses
          if (isNegative) {
            amount = -Math.abs(amount)
          }
          break
        }
      }
    }
    
    // VALIDATION: Skip rows with invalid data
    if (!dateValue) {
      console.log('[TRUIST Format] Skipping row - Invalid date:', row)
      return { _validationError: true, _errorReason: 'Invalid or missing Transaction Date/Posted Date', _originalRow: row }
    }
    
    if (!amount || amount === 0 || isNaN(amount)) {
      console.log('[TRUIST Format] Skipping row - Invalid amount:', amount, 'from row:', row)
      return { _validationError: true, _errorReason: 'Invalid amount (zero, null, or NaN)', _originalRow: row }
    }
    
    // Description is optional but recommended
    if (!description) {
      description = 'No description provided'
    }
    
    // For TRUIST: Keep signs as-is (no flip)
    // - Amounts in parentheses like "(339)" are debits (expenses) → parsed as negative → keep as negative
    // - Amounts without parentheses are credits (income) → parsed as positive → keep as positive
    // User wants: negative amounts stay negative, positive amounts stay positive (opposite of previous behavior)
    let finalAmount = amount
    
    const result = {
      date: dateValue, // Already in YYYY-MM-DD format from parseCSVDate
      description: description,
      card_member: null, // Leave blank for Truist
      amount: finalAmount, // After swap and flip: Positive = expense, Negative = income
      source: 'TRUIST',
      check_nbr: checkNbr || null // Store check number for later use during insert
    }
    console.log('[TRUIST Format] Transformed row result:', result)
    return result
  }

  const handleUpload3 = async (includeSelectedDuplicates = false) => {
    if (!file3) {
      alert('Please select a file')
      return
    }

    setIsUploading3(true)
    setUploadProgress3(0)
    setUploadResult3(null)

    try {
      Papa.parse(file3, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const transformedData = results.data.map(transformRowFormat3)
          
          // Separate valid data from validation errors
          const validData = []
          const validationErrorRecords = []
          
          transformedData.forEach((row, index) => {
            if (row && row._validationError) {
              // This is a validation error - store it with the transformed data if available
              const errorRecord = {
                ...row,
                _errorIndex: index,
                date: row.date || 'N/A',
                description: row.description || row._originalRow?.['Full description'] || 'N/A',
                card_member: row.card_member || null,
                amount: row.amount || row._originalRow?.Amount || 'N/A',
                source: 'TRUIST',
                check_nbr: row.check_nbr || row._originalRow?.['Check/Serial #'] || null
              }
              validationErrorRecords.push(errorRecord)
            } else if (row) {
              // Additional validation check
              const hasValidDate = row.date && typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date)
              const hasValidAmount = row.amount !== undefined && row.amount !== null && row.amount !== 0 && !isNaN(row.amount)
              const hasDescription = row.description && row.description.trim()
              
              if (hasValidDate && hasValidAmount && hasDescription) {
                validData.push(row)
              } else {
                // Secondary validation error
                let errorReason = ''
                if (!hasValidDate) errorReason = 'Invalid or missing date'
                else if (!hasValidAmount) errorReason = 'Invalid amount (zero, null, or NaN)'
                else if (!hasDescription) errorReason = 'Missing description'
                
                const errorRecord = {
                  _validationError: true,
                  _errorReason: errorReason,
                  _errorIndex: index,
                  date: row.date || 'N/A',
                  description: row.description || 'N/A',
                  card_member: row.card_member || null,
                  amount: row.amount || 'N/A',
                  source: 'TRUIST',
                  check_nbr: row.check_nbr || null
                }
                validationErrorRecords.push(errorRecord)
              }
            }
          })
          
          // Calculate validation statistics
          const totalRows = results.data.length
          const validRows = validData.length
          const skippedRows = validationErrorRecords.length
          
          console.log(`Validation Results: ${validRows} valid rows, ${skippedRows} skipped rows out of ${totalRows} total`)
          
          // Store validation errors for user review (first 10)
          if (validationErrorRecords.length > 0) {
            const first10Errors = validationErrorRecords.slice(0, 10)
            setValidationErrors3(first10Errors)
            setValidationErrorsTotal3(validationErrorRecords.length)
            setSelectedValidationErrors3(new Set())
          }
          
          if (validRows === 0 && validationErrorRecords.length === 0) {
            setUploadResult3({
              success: false,
              error: `No valid rows found. All ${totalRows} rows were skipped.`
            })
            setIsUploading3(false)
            return
          }
          
          // Use validData instead of finalValidData
          const finalValidData = validData
          
          const supabase = getSupabase()
          if (!supabase) {
            setUploadResult3({
              success: false,
              error: 'Supabase client not available'
            })
            setIsUploading3(false)
            return
          }

          // Check for duplicates before uploading
          const { unique: uniqueData, duplicates: duplicateRecords } = await filterDuplicates(finalValidData, supabase)
          
          // CRITICAL: If duplicates or validation errors are found on first upload attempt, ALWAYS stop and show them
          if (!includeSelectedDuplicates) {
            if (duplicateRecords.length > 0 || validationErrorRecords.length > 0) {
              // Store duplicates for user review (first 10)
              if (duplicateRecords.length > 0) {
                const first10Duplicates = duplicateRecords.slice(0, 10)
                setDuplicates3(first10Duplicates)
                setDuplicatesTotal3(duplicateRecords.length)
                setSelectedDuplicates3(new Set())
              }
              // Always stop to show duplicates/errors for user review - DO NOT PROCEED
              setIsUploading3(false)
              return
            }
          }
          
          // If including selected duplicates and/or validation errors, merge them with unique data
          let dataToUpload = [...uniqueData]
          
          // Add selected validation errors
          if (includeSelectedDuplicates && validationErrors3.length > 0) {
            const selected = validationErrors3.filter((_, index) => selectedValidationErrors3.has(index))
            // Remove the tracking fields before upload
            const cleanedSelected = selected.map(({ _validationError, _errorReason, _errorIndex, _originalRow, ...rest }) => rest)
            dataToUpload = [...dataToUpload, ...cleanedSelected]
          }
          
          // Add selected duplicates
          if (includeSelectedDuplicates && duplicates3.length > 0) {
            const selected = duplicates3.filter((_, index) => selectedDuplicates3.has(index))
            // Remove the tracking fields before upload
            const cleanedSelected = selected.map(({ _duplicateIndex, _duplicateKey, ...rest }) => rest)
            dataToUpload = [...dataToUpload, ...cleanedSelected]
          }
          
          if (dataToUpload.length === 0) {
            setUploadResult3({
              success: false,
              error: `No valid records to upload.`
            })
            setIsUploading3(false)
            return
          }

          // Upload in batches of 100
          const batchSize = 100
          let uploaded = 0
          let failed = 0

          for (let i = 0; i < dataToUpload.length; i += batchSize) {
            const batch = dataToUpload.slice(i, i + batchSize)
            
            try {
              // Clean the batch - ensure all required fields are present and properly formatted
              const cleanedBatch = batch.map(item => {
                // Ensure amount is a valid number (can be positive for expenses or negative for deposits/credits)
                const amountValue = typeof item.amount === 'number' 
                  ? item.amount 
                  : parseFloat(String(item.amount).replace(/[^0-9.-]/g, ''))
                
                if (isNaN(amountValue) || amountValue === 0) {
                  console.warn('[TRUIST Format] Invalid amount in batch item (must be non-zero):', item)
                }
                
                const cleaned = {
                  date: item.date,
                  description: String(item.description || 'No description provided').trim(),
                  card_member: item.card_member ? String(item.card_member).trim() : null,
                  amount: amountValue, // Decimal number
                  source: String(item.source || 'TRUIST').trim()
                }
                
                // Only include Check_Nbr if it exists (check_nbr or Check_Nbr)
                if (item.check_nbr || item.Check_Nbr) {
                  cleaned.Check_Nbr = item.check_nbr || item.Check_Nbr
                }
                
                return cleaned
              })
              
              // Upload batch to expenses table
              const { data, error } = await supabase
                .from('expenses')
                .insert(cleanedBatch)
                .select()
              
              if (error) {
                // If error mentions Check_Nbr column doesn't exist, try again without it
                if (error.message && error.message.includes('Check_Nbr') && error.message.includes('does not exist')) {
                  console.warn('[TRUIST Format] Check_Nbr column not found, retrying without it')
                  const batchWithoutCheckNbr = cleanedBatch.map(item => {
                    const { Check_Nbr, ...rest } = item
                    return rest
                  })
                  
                  const { data: retryData, error: retryError } = await supabase
                    .from('expenses')
                    .insert(batchWithoutCheckNbr)
                    .select()
                  
                  if (retryError) {
                    failed += batch.length
                    console.error(`[TRUIST Format] Upload failed for batch ${i / batchSize + 1} (after retry):`, retryError)
                    console.error('[TRUIST Format] Error message:', retryError.message)
                    console.error('[TRUIST Format] Error details:', retryError.details)
                    console.error('[TRUIST Format] First item in failed batch:', batchWithoutCheckNbr[0])
                  } else {
                    uploaded += batch.length
                  }
                } else {
                  failed += batch.length
                  console.error(`[TRUIST Format] Upload failed for batch ${i / batchSize + 1}:`, error)
                  console.error('[TRUIST Format] First item in failed batch:', cleanedBatch[0])
                  console.error('[TRUIST Format] Error message:', error.message)
                  console.error('[TRUIST Format] Error details:', error.details)
                  console.error('[TRUIST Format] Error code:', error.code)
                  console.error('[TRUIST Format] Error hint:', error.hint)
                }
              } else {
                uploaded += batch.length
              }
              
              setUploadProgress3((uploaded / dataToUpload.length) * 100)
            } catch (error) {
              failed += batch.length
              console.error('[TRUIST Format] Upload exception for batch:', error)
              console.error('[TRUIST Format] Error message:', error.message)
              console.error('[TRUIST Format] Error stack:', error.stack)
            }
          }

          // Only show duplicate count if duplicates were actually skipped (not selected for import)
          const duplicatesSkipped = includeSelectedDuplicates && duplicates3.length > 0 
            ? duplicatesTotal3 - selectedDuplicates3.size 
            : 0
          
          setUploadResult3({
            success: true,
            uploaded,
            failed,
            total: finalValidData.length,
            skipped: skippedRows,
            duplicates: duplicatesSkipped
          })
          setIsUploading3(false)
          // Clear duplicates and validation errors after successful upload
          setDuplicates3([])
          setDuplicatesTotal3(0)
          setSelectedDuplicates3(new Set())
          setValidationErrors3([])
          setValidationErrorsTotal3(0)
          setSelectedValidationErrors3(new Set())
        },
        error: (error) => {
          setUploadResult3({
            success: false,
            error: error.message
          })
          setIsUploading3(false)
        }
      })
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadResult3({
        success: false,
        error: error.message
      })
      setIsUploading3(false)
    }
  }

  const handleDrop3 = (event) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile3(droppedFile)
      parseCSV3(droppedFile)
    }
  }

  const handleDragOver3 = (event) => {
    event.preventDefault()
  }

  const clearUpload3 = () => {
    setFile3(null)
    setPreviewData3([])
    setUploadResult3(null)
    setUploadProgress3(0)
    setDuplicates3([])
    setDuplicatesTotal3(0)
    setSelectedDuplicates3(new Set())
    setValidationErrors3([])
    setValidationErrorsTotal3(0)
    setSelectedValidationErrors3(new Set())
    if (fileInputRef3.current) {
      fileInputRef3.current.value = ''
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
            Upload CSV files to import from Amex, Truist or CAPITAL ONE
          </p>
        </div>

        {/* File Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Upload CSV File - AMEX</h2>
            <button
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading... {uploadProgress.toFixed(1)}%
                </div>
              ) : (
                'Upload Expense Data'
              )}
            </button>
          </div>
          
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

        {/* Transformed Data Preview - Shows what will be stored */}
        {transformedPreview.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Parsed Data Preview (What will be stored)</h2>
              <span className="text-sm text-gray-500">
                Showing first {transformedPreview.length} valid rows
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date (YYYY-MM-DD)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Card Member</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transformedPreview.map((row, index) => (
                    <tr key={index} className={!row.date ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2 text-sm font-mono text-gray-900">
                        {row.date || <span className="text-red-600">INVALID</span>}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={row.description}>
                        {row.description}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">
                        {row.card_member || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                        ${parseFloat(row.amount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">
                        {row.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {previewData.length > transformedPreview.length && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Warning:</strong> {previewData.length - transformedPreview.length} row(s) from the preview were skipped due to invalid dates or amounts.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Validation Errors Review - AMEX */}
        {validationErrors.length > 0 && (
          <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-orange-900">
                  Validation Errors Found (Showing first 10 of {validationErrorsTotal} total)
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  The following records have validation errors (invalid dates, amounts, etc.).
                  Select which ones you want to import anyway.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const allSelected = new Set(validationErrors.map((_, i) => i))
                    setSelectedValidationErrors(allSelected)
                  }}
                  className="text-sm text-orange-800 hover:text-orange-900 underline"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedValidationErrors(new Set())}
                  className="text-sm text-orange-800 hover:text-orange-900 underline"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-96 overflow-y-auto mb-4">
              <table className="min-w-full divide-y divide-orange-200">
                <thead className="bg-orange-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase w-12">
                      <input
                        type="checkbox"
                        checked={validationErrors.length > 0 && validationErrors.every((_, i) => selectedValidationErrors.has(i))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedValidationErrors(new Set(validationErrors.map((_, i) => i)))
                          } else {
                            setSelectedValidationErrors(new Set())
                          }
                        }}
                        className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Card Member</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Error Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-orange-200">
                  {validationErrors.map((error, index) => (
                    <tr key={index} className={selectedValidationErrors.has(index) ? 'bg-orange-100' : ''}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedValidationErrors.has(index)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedValidationErrors)
                            if (e.target.checked) {
                              newSelected.add(index)
                            } else {
                              newSelected.delete(index)
                            }
                            setSelectedValidationErrors(newSelected)
                          }}
                          className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-mono text-gray-900">{error.date}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={error.description}>
                        {error.description}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">{error.card_member || 'N/A'}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                        {typeof error.amount === 'number' ? `$${error.amount.toFixed(2)}` : error.amount}
                      </td>
                      <td className="px-3 py-2 text-sm text-orange-700 font-medium">{error._errorReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setValidationErrors([])
                  setValidationErrorsTotal(0)
                  setSelectedValidationErrors(new Set())
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip All Validation Errors
              </button>
            </div>
          </div>
        )}

        {/* Duplicate Records Review - AMEX */}
        {duplicates.length > 0 && (
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-yellow-900">
                  Duplicate Records Found (Showing first 10 of {duplicatesTotal} total)
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The following records appear to be duplicates (same date, amount, description, and source already exist in database).
                  Select which ones you want to import anyway.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const allSelected = new Set(duplicates.map((_, i) => i))
                    setSelectedDuplicates(allSelected)
                  }}
                  className="text-sm text-yellow-800 hover:text-yellow-900 underline"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedDuplicates(new Set())}
                  className="text-sm text-yellow-800 hover:text-yellow-900 underline"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-96 overflow-y-auto mb-4">
              <table className="min-w-full divide-y divide-yellow-200">
                <thead className="bg-yellow-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase w-12">
                      <input
                        type="checkbox"
                        checked={duplicates.length > 0 && duplicates.every((_, i) => selectedDuplicates.has(i))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDuplicates(new Set(duplicates.map((_, i) => i)))
                          } else {
                            setSelectedDuplicates(new Set())
                          }
                        }}
                        className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Card Member</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Source</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-yellow-200">
                  {duplicates.map((dup, index) => (
                    <tr key={index} className={selectedDuplicates.has(index) ? 'bg-yellow-100' : ''}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedDuplicates.has(index)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedDuplicates)
                            if (e.target.checked) {
                              newSelected.add(index)
                            } else {
                              newSelected.delete(index)
                            }
                            setSelectedDuplicates(newSelected)
                          }}
                          className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-mono text-gray-900">{dup.date}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={dup.description}>
                        {dup.description}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">{dup.card_member || 'N/A'}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                        ${parseFloat(dup.amount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">{dup.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDuplicates([])
                  setDuplicatesTotal(0)
                  setSelectedDuplicates(new Set())
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip All Duplicates
              </button>
              <button
                onClick={() => handleUpload(true)}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload {selectedDuplicates.size + selectedValidationErrors.size > 0 ? `(${selectedDuplicates.size + selectedValidationErrors.size} selected)` : ''}
              </button>
            </div>
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
                {uploadResult.duplicates > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    ℹ️ {uploadResult.duplicates} duplicate rows were found and skipped (same date, amount, and description already exist)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Format 2: Transaction Date, Debit/Credit Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Upload CSV File - CAPITAL ONE</h2>
            <button
              onClick={handleUpload2}
              disabled={isUploading2 || !file2}
              className="bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading2 ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading... {uploadProgress2.toFixed(1)}%
                </div>
              ) : (
                'Upload Expense Data'
              )}
            </button>
          </div>
          
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
              <strong>Note:</strong> Card No., Category, and Posted Date columns will be ignored. Debit values are stored as positive amounts, Credit values as negative amounts. All expenses imported from this section will have source set to "CAPITAL ONE".
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

        {/* Validation Errors Review - CAPITAL ONE */}
        {validationErrors2.length > 0 && (
          <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-orange-900">
                  Validation Errors Found (Showing first 10 of {validationErrorsTotal2} total)
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  The following records have validation errors (invalid dates, amounts, etc.).
                  Select which ones you want to import anyway.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const allSelected = new Set(validationErrors2.map((_, i) => i))
                    setSelectedValidationErrors2(allSelected)
                  }}
                  className="text-sm text-orange-800 hover:text-orange-900 underline"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedValidationErrors2(new Set())}
                  className="text-sm text-orange-800 hover:text-orange-900 underline"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-96 overflow-y-auto mb-4">
              <table className="min-w-full divide-y divide-orange-200">
                <thead className="bg-orange-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase w-12">
                      <input
                        type="checkbox"
                        checked={validationErrors2.length > 0 && validationErrors2.every((_, i) => selectedValidationErrors2.has(i))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedValidationErrors2(new Set(validationErrors2.map((_, i) => i)))
                          } else {
                            setSelectedValidationErrors2(new Set())
                          }
                        }}
                        className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Error Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-orange-200">
                  {validationErrors2.map((error, index) => (
                    <tr key={index} className={selectedValidationErrors2.has(index) ? 'bg-orange-100' : ''}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedValidationErrors2.has(index)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedValidationErrors2)
                            if (e.target.checked) {
                              newSelected.add(index)
                            } else {
                              newSelected.delete(index)
                            }
                            setSelectedValidationErrors2(newSelected)
                          }}
                          className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-mono text-gray-900">{error.date}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={error.description}>
                        {error.description}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                        {typeof error.amount === 'number' ? `$${error.amount.toFixed(2)}` : error.amount}
                      </td>
                      <td className="px-3 py-2 text-sm text-orange-700 font-medium">{error._errorReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setValidationErrors2([])
                  setValidationErrorsTotal2(0)
                  setSelectedValidationErrors2(new Set())
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip All Validation Errors
              </button>
            </div>
          </div>
        )}

        {/* Duplicate Records Review - CAPITAL ONE */}
        {duplicates2.length > 0 && (
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-yellow-900">
                  Duplicate Records Found (Showing first 10 of {duplicatesTotal2} total)
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The following records appear to be duplicates (same date, amount, description, and source already exist in database).
                  Select which ones you want to import anyway.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const allSelected = new Set(duplicates2.map((_, i) => i))
                    setSelectedDuplicates2(allSelected)
                  }}
                  className="text-sm text-yellow-800 hover:text-yellow-900 underline"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedDuplicates2(new Set())}
                  className="text-sm text-yellow-800 hover:text-yellow-900 underline"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-96 overflow-y-auto mb-4">
              <table className="min-w-full divide-y divide-yellow-200">
                <thead className="bg-yellow-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase w-12">
                      <input
                        type="checkbox"
                        checked={duplicates2.length > 0 && duplicates2.every((_, i) => selectedDuplicates2.has(i))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDuplicates2(new Set(duplicates2.map((_, i) => i)))
                          } else {
                            setSelectedDuplicates2(new Set())
                          }
                        }}
                        className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Source</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-yellow-200">
                  {duplicates2.map((dup, index) => (
                    <tr key={index} className={selectedDuplicates2.has(index) ? 'bg-yellow-100' : ''}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedDuplicates2.has(index)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedDuplicates2)
                            if (e.target.checked) {
                              newSelected.add(index)
                            } else {
                              newSelected.delete(index)
                            }
                            setSelectedDuplicates2(newSelected)
                          }}
                          className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-mono text-gray-900">{dup.date}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={dup.description}>
                        {dup.description}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                        ${parseFloat(dup.amount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">{dup.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDuplicates2([])
                  setDuplicatesTotal2(0)
                  setSelectedDuplicates2(new Set())
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip All Duplicates
              </button>
              <button
                onClick={() => handleUpload2(true)}
                disabled={isUploading2}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload {selectedDuplicates2.size + selectedValidationErrors2.size > 0 ? `(${selectedDuplicates2.size + selectedValidationErrors2.size} selected)` : ''}
              </button>
            </div>
          </div>
        )}

        {/* Format 2 Upload Result */}
        {uploadResult2 && (
          <div className={`bg-white rounded-lg shadow-sm border p-6 mb-6 ${
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
                {uploadResult2.duplicates > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    ℹ️ {uploadResult2.duplicates} duplicate rows were found and skipped (same date, amount, and description already exist)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Format 3: Truist Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Upload CSV File - TRUIST (v2.0)</h2>
            <button
              onClick={handleUpload3}
              disabled={isUploading3 || !file3}
              className="bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading3 ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading... {uploadProgress3.toFixed(1)}%
                </div>
              ) : (
                'Upload Expense Data'
              )}
            </button>
          </div>
          
          {/* Expected CSV Format */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Expected CSV Format - Required columns:</strong>
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li><strong>Transaction Date</strong> - Transaction date</li>
              <li><strong>Full description</strong> - Expense description</li>
              <li><strong>Check/Serial #</strong> - Check or serial number</li>
              <li><strong>Amount</strong> - Expense amount</li>
            </ul>
            <p className="text-xs text-blue-600 mt-3">
              <strong>Note:</strong> Posted Date, Transaction Type, Merchant name, Sub-category name, and Daily Posted Balance columns will be ignored. Card Member will be left blank. All expenses imported from this section will have source set to "TRUIST".
            </p>
          </div>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file3 ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop3}
            onDragOver={handleDragOver3}
          >
            <input
              ref={fileInputRef3}
              type="file"
              accept=".csv"
              onChange={handleFileSelect3}
              className="hidden"
            />
            
            {!file3 ? (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop a CSV file here, or{' '}
                  <button
                    onClick={() => fileInputRef3.current?.click()}
                    className="text-primary-600 hover:text-primary-500 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports CSV files with Truist transaction data
                </p>
              </div>
            ) : (
              <div>
                <FileText className="mx-auto h-12 w-12 text-primary-500" />
                <p className="mt-2 text-sm font-medium text-gray-900">{file3.name}</p>
                <p className="text-xs text-gray-500">
                  {(file3.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={clearUpload3}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Remove file
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Format 3 Data Preview */}
        {previewData3.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Data Preview</h2>
              <span className="text-sm text-gray-500">
                Showing first {previewData3.length} rows
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(previewData3[0] || {}).map(header => (
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
                  {previewData3.map((row, index) => (
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
                <strong>Note:</strong> This shows the raw CSV data. The system will map Transaction Date, Full description, Check/Serial #, and Amount fields automatically.
              </p>
            </div>
          </div>
        )}

        {/* Validation Errors Review - TRUIST */}
        {validationErrors3.length > 0 && (
          <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-orange-900">
                  Validation Errors Found (Showing first 10 of {validationErrorsTotal3} total)
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  The following records have validation errors (invalid dates, amounts, etc.).
                  Select which ones you want to import anyway.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const allSelected = new Set(validationErrors3.map((_, i) => i))
                    setSelectedValidationErrors3(allSelected)
                  }}
                  className="text-sm text-orange-800 hover:text-orange-900 underline"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedValidationErrors3(new Set())}
                  className="text-sm text-orange-800 hover:text-orange-900 underline"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-96 overflow-y-auto mb-4">
              <table className="min-w-full divide-y divide-orange-200">
                <thead className="bg-orange-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase w-12">
                      <input
                        type="checkbox"
                        checked={validationErrors3.length > 0 && validationErrors3.every((_, i) => selectedValidationErrors3.has(i))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedValidationErrors3(new Set(validationErrors3.map((_, i) => i)))
                          } else {
                            setSelectedValidationErrors3(new Set())
                          }
                        }}
                        className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Check #</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase">Error Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-orange-200">
                  {validationErrors3.map((error, index) => (
                    <tr key={index} className={selectedValidationErrors3.has(index) ? 'bg-orange-100' : ''}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedValidationErrors3.has(index)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedValidationErrors3)
                            if (e.target.checked) {
                              newSelected.add(index)
                            } else {
                              newSelected.delete(index)
                            }
                            setSelectedValidationErrors3(newSelected)
                          }}
                          className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-mono text-gray-900">{error.date}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={error.description}>
                        {error.description}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                        {typeof error.amount === 'number' ? `$${error.amount.toFixed(2)}` : error.amount}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">{error.check_nbr || 'N/A'}</td>
                      <td className="px-3 py-2 text-sm text-orange-700 font-medium">{error._errorReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setValidationErrors3([])
                  setValidationErrorsTotal3(0)
                  setSelectedValidationErrors3(new Set())
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip All Validation Errors
              </button>
            </div>
          </div>
        )}

        {/* Duplicate Records Review - TRUIST */}
        {duplicates3.length > 0 && (
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-yellow-900">
                  Duplicate Records Found (Showing first 10 of {duplicatesTotal3} total)
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The following records appear to be duplicates (same date, amount, description, and source already exist in database).
                  Select which ones you want to import anyway.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const allSelected = new Set(duplicates3.map((_, i) => i))
                    setSelectedDuplicates3(allSelected)
                  }}
                  className="text-sm text-yellow-800 hover:text-yellow-900 underline"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedDuplicates3(new Set())}
                  className="text-sm text-yellow-800 hover:text-yellow-900 underline"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-96 overflow-y-auto mb-4">
              <table className="min-w-full divide-y divide-yellow-200">
                <thead className="bg-yellow-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase w-12">
                      <input
                        type="checkbox"
                        checked={duplicates3.length > 0 && duplicates3.every((_, i) => selectedDuplicates3.has(i))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDuplicates3(new Set(duplicates3.map((_, i) => i)))
                          } else {
                            setSelectedDuplicates3(new Set())
                          }
                        }}
                        className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Source</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Check #</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-yellow-200">
                  {duplicates3.map((dup, index) => (
                    <tr key={index} className={selectedDuplicates3.has(index) ? 'bg-yellow-100' : ''}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedDuplicates3.has(index)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedDuplicates3)
                            if (e.target.checked) {
                              newSelected.add(index)
                            } else {
                              newSelected.delete(index)
                            }
                            setSelectedDuplicates3(newSelected)
                          }}
                          className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-mono text-gray-900">{dup.date}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={dup.description}>
                        {dup.description}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                        ${parseFloat(dup.amount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">{dup.source}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{dup.check_nbr || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDuplicates3([])
                  setDuplicatesTotal3(0)
                  setSelectedDuplicates3(new Set())
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip All Duplicates
              </button>
              <button
                onClick={() => handleUpload3(true)}
                disabled={isUploading3}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload {selectedDuplicates3.size + selectedValidationErrors3.size > 0 ? `(${selectedDuplicates3.size + selectedValidationErrors3.size} selected)` : ''}
              </button>
            </div>
          </div>
        )}

        {/* Format 3 Upload Result */}
        {uploadResult3 && (
          <div className={`bg-white rounded-lg shadow-sm border p-6 ${
            uploadResult3.success ? 'border-green-200' : 'border-red-200'
          }`}>
            <div className="flex items-center">
              {uploadResult3.success ? (
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              )}
              <div>
                <h3 className={`text-lg font-medium ${
                  uploadResult3.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {uploadResult3.success ? 'Upload Complete' : 'Upload Failed'}
                </h3>
                <p className={`text-sm ${
                  uploadResult3.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {uploadResult3.success
                    ? `Successfully uploaded ${uploadResult3.uploaded} records${uploadResult3.failed > 0 ? `, ${uploadResult3.failed} failed` : ''}`
                    : uploadResult3.error
                  }
                </p>
                {uploadResult3.skipped > 0 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    ⚠️ {uploadResult3.skipped} rows were skipped due to validation errors (invalid dates, amounts, etc.)
                  </p>
                )}
                {uploadResult3.duplicates > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    ℹ️ {uploadResult3.duplicates} duplicate rows were found and skipped (same date, amount, and description already exist)
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

