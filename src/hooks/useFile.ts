import { useState } from 'react'

interface FileState {
  files: File[]
  previews: string[]
}

const useFile = () => {
  const [fileState, setFileState] = useState<FileState>({
    files: [],
    previews: []
  })
  
  const addFiles = (newFiles: FileList | File[]) => {
    const filesArray = Array.from(newFiles)
    const newPreviews = filesArray.map(file => URL.createObjectURL(file))
    
    setFileState(prev => ({
      files: [...prev.files, ...filesArray],
      previews: [...prev.previews, ...newPreviews]
    }))
  }
  
  const removeFile = (index: number) => {
    setFileState(prev => {
      // Clean up preview URL
      if (prev.previews[index]) {
        URL.revokeObjectURL(prev.previews[index])
      }
      
      return {
        files: prev.files.filter((_, i) => i !== index),
        previews: prev.previews.filter((_, i) => i !== index)
      }
    })
  }
  
  const clearFiles = () => {
    // Clean up all preview URLs
    fileState.previews.forEach(preview => {
      URL.revokeObjectURL(preview)
    })
    
    setFileState({
      files: [],
      previews: []
    })
  }
  
  return {
    files: fileState.files,
    previews: fileState.previews,
    addFiles,
    removeFile,
    clearFiles
  }
}

export default useFile