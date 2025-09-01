import React, { useState, useRef } from 'react'
import { FileText, Download, Eye, Upload, Plus } from 'lucide-react'

const Documents = () => {
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [documents, setDocuments] = useState([
    {
      id: 'summary',
      title: '1 Page Summary',
      description: 'Quick reference guide for daily operations',
      filename: '1-page-summary.pdf',
      icon: FileText,
      isUploaded: false
    },
    {
      id: 'handbook',
      title: 'Road Handbook',
      description: 'Complete operational procedures and guidelines',
      filename: 'road-handbook.pdf',
      icon: FileText,
      isUploaded: false
    }
  ])
  const fileInputRef = useRef(null)

  const handleViewDocument = (document) => {
    if (document.isUploaded) {
      setSelectedDocument(document)
    } else {
      alert('Please upload a PDF file first')
    }
  }

  const handleDownloadDocument = (document) => {
    if (document.isUploaded) {
      const link = document.createElement('a')
      link.href = document.fileUrl
      link.download = document.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      alert('Please upload a PDF file first')
    }
  }

  const handleFileUpload = (event, documentId) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/pdf') {
      const fileUrl = URL.createObjectURL(file)
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === documentId 
            ? { ...doc, isUploaded: true, fileUrl, uploadedFile: file }
            : doc
        )
      )
      alert('PDF uploaded successfully!')
    } else {
      alert('Please select a valid PDF file')
    }
  }

  const handleUploadClick = (documentId) => {
    fileInputRef.current = document.createElement('input')
    fileInputRef.current.type = 'file'
    fileInputRef.current.accept = '.pdf'
    fileInputRef.current.onchange = (e) => handleFileUpload(e, documentId)
    fileInputRef.current.click()
  }

  const closeViewer = () => {
    setSelectedDocument(null)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-1">Access important operational documents and guides</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map((doc) => {
            const Icon = doc.icon
            return (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
                    <p className="text-gray-600 mb-4">{doc.description}</p>
                    <div className="flex space-x-3">
                      {doc.isUploaded ? (
                        <>
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUploadClick(doc.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload PDF
                        </button>
                      )}
                    </div>
                    {doc.isUploaded && (
                      <div className="mt-2 text-sm text-green-600">
                        ✓ PDF uploaded and ready
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{selectedDocument.title}</h2>
              <button
                onClick={closeViewer}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
                                <div className="flex-1 p-4">
                      <iframe
                        src={selectedDocument.fileUrl}
                        className="w-full h-full border-0 rounded"
                        title={selectedDocument.title}
                      />
                    </div>
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">{selectedDocument.description}</p>
              <button
                onClick={() => handleDownloadDocument(selectedDocument)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Documents
