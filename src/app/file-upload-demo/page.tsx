/**
 * File Upload Demo Page
 * 
 * Demonstration page showcasing the complete file upload functionality
 * including drag-and-drop, progress tracking, and error handling
 */

'use client'

import React, { useState } from 'react'
import { Provider } from 'react-redux'
import { store } from '@/shared/lib/store'
import { 
  FileUploadManager,
  FileUploadZone,
  FileUploadProgress 
} from '@/features/file-upload'
import { 
  SupportedFileType,
  FileValidationRule,
  DEFAULT_VALIDATION_RULES 
} from '@/entities/file'

const FileUploadDemoPage: React.FC = () => {
  const [selectedFileType, setSelectedFileType] = useState<SupportedFileType>('video')
  const [autoUpload, setAutoUpload] = useState(false)
  const [showProgressList, setShowProgressList] = useState(true)
  const [allowBatchOperations, setAllowBatchOperations] = useState(true)
  const [uploadComplete, setUploadComplete] = useState<any[]>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])

  const handleUploadComplete = (metadata: any) => {
    setUploadComplete(prev => [...prev, metadata])
    console.log('Upload completed:', metadata)
  }

  const handleUploadError = (error: string) => {
    setUploadErrors(prev => [...prev, error])
    console.error('Upload error:', error)
  }

  const clearResults = () => {
    setUploadComplete([])
    setUploadErrors([])
  }

  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              File Upload System Demo
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Complete file upload functionality with drag-and-drop, validation, and progress tracking
            </p>
          </div>

          {/* Configuration Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* File Type */}
              <div>
                <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-2">
                  File Type
                </label>
                <select
                  id="fileType"
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value as SupportedFileType)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                  <option value="document">Document</option>
                  <option value="audio">Audio</option>
                  <option value="archive">Archive</option>
                </select>
              </div>

              {/* Auto Upload */}
              <div className="flex items-center">
                <input
                  id="autoUpload"
                  type="checkbox"
                  checked={autoUpload}
                  onChange={(e) => setAutoUpload(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoUpload" className="ml-2 block text-sm font-medium text-gray-700">
                  Auto Upload
                </label>
              </div>

              {/* Show Progress List */}
              <div className="flex items-center">
                <input
                  id="showProgressList"
                  type="checkbox"
                  checked={showProgressList}
                  onChange={(e) => setShowProgressList(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showProgressList" className="ml-2 block text-sm font-medium text-gray-700">
                  Show Progress List
                </label>
              </div>

              {/* Batch Operations */}
              <div className="flex items-center">
                <input
                  id="allowBatchOperations"
                  type="checkbox"
                  checked={allowBatchOperations}
                  onChange={(e) => setAllowBatchOperations(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allowBatchOperations" className="ml-2 block text-sm font-medium text-gray-700">
                  Batch Operations
                </label>
              </div>
            </div>
          </div>

          {/* File Upload Manager */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              File Upload Manager
            </h2>
            
            <FileUploadManager
              fileType={selectedFileType}
              autoUpload={autoUpload}
              showProgressList={showProgressList}
              allowBatchOperations={allowBatchOperations}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              maxConcurrentUploads={3}
            />
          </div>

          {/* Individual Components Demo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Upload Zone Only */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Zone Only
              </h2>
              
              <FileUploadZone
                fileType={selectedFileType}
                onFilesSelected={(files, results) => {
                  console.log('Files selected:', files, results)
                }}
                onError={(error) => {
                  console.error('Upload zone error:', error)
                }}
                multiple={true}
                maxFiles={5}
              />
            </div>

            {/* Validation Rules Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Validation Rules ({selectedFileType})
              </h2>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Max Size:</span>
                  <span className="ml-2 text-gray-600">
                    {(DEFAULT_VALIDATION_RULES[selectedFileType].maxSize / (1024 * 1024)).toFixed(0)} MB
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Allowed Types:</span>
                  <div className="ml-2 text-gray-600">
                    {DEFAULT_VALIDATION_RULES[selectedFileType].allowedTypes.map(type => (
                      <span key={type} className="inline-block bg-gray-100 rounded px-2 py-1 text-xs mr-1 mb-1">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Extensions:</span>
                  <div className="ml-2 text-gray-600">
                    {DEFAULT_VALIDATION_RULES[selectedFileType].allowedExtensions.map(ext => (
                      <span key={ext} className="inline-block bg-blue-100 rounded px-2 py-1 text-xs mr-1 mb-1">
                        {ext}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Content Validation:</span>
                  <span className="ml-2 text-gray-600">
                    {DEFAULT_VALIDATION_RULES[selectedFileType].validateContent ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Completed Uploads */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Completed Uploads ({uploadComplete.length})
                </h2>
                {uploadComplete.length > 0 && (
                  <button
                    onClick={clearResults}
                    className="text-sm text-red-600 hover:text-red-800 focus:outline-none focus:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {uploadComplete.length === 0 ? (
                <p className="text-gray-500 text-sm">No completed uploads yet</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {uploadComplete.map((metadata, index) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-800 text-sm">
                        {metadata.name}
                      </p>
                      <p className="text-green-600 text-xs">
                        {metadata.size} bytes • {metadata.mimeType}
                      </p>
                      <p className="text-green-500 text-xs">
                        {metadata.createdAt}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Errors */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upload Errors ({uploadErrors.length})
                </h2>
                {uploadErrors.length > 0 && (
                  <button
                    onClick={() => setUploadErrors([])}
                    className="text-sm text-red-600 hover:text-red-800 focus:outline-none focus:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {uploadErrors.length === 0 ? (
                <p className="text-gray-500 text-sm">No upload errors</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {uploadErrors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Usage Examples */}
          <div className="mt-8 bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Usage Examples
            </h2>
            
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-gray-300 mb-2">Basic Usage</h3>
                <pre className="bg-gray-800 text-gray-300 p-3 rounded text-xs overflow-x-auto">
{`import { FileUploadManager } from '@/features/file-upload'

<FileUploadManager
  fileType="video"
  autoUpload={false}
  onUploadComplete={(metadata) => {
    console.log('Upload completed:', metadata)
  }}
  onUploadError={(error) => {
    console.error('Upload failed:', error)
  }}
/>`}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-gray-300 mb-2">Custom Validation</h3>
                <pre className="bg-gray-800 text-gray-300 p-3 rounded text-xs overflow-x-auto">
{`const customRules = {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['video/mp4', 'video/webm'],
  allowedExtensions: ['.mp4', '.webm'],
  validateContent: true
}

<FileUploadZone
  validationRules={customRules}
  onFilesSelected={handleFiles}
/>`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Provider>
  )
}

export default FileUploadDemoPage