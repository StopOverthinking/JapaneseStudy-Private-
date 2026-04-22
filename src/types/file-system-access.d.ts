declare global {
  interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite'
  }

  interface FileSystemHandle {
    kind: 'file' | 'directory'
    name: string
    queryPermission?(descriptor?: FileSystemHandlePermissionDescriptor): Promise<'granted' | 'denied' | 'prompt'>
    requestPermission?(descriptor?: FileSystemHandlePermissionDescriptor): Promise<'granted' | 'denied' | 'prompt'>
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: FileSystemWriteChunkType): Promise<void>
    close(): Promise<void>
  }

  type FileSystemWriteChunkType = BufferSource | Blob | string

  interface FileSystemFileHandle extends FileSystemHandle {
    createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>
    getFile(): Promise<File>
  }

  interface FileSystemGetDirectoryOptions {
    create?: boolean
  }

  interface FileSystemGetFileOptions {
    create?: boolean
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<FileSystemDirectoryHandle>
    getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>
  }

  interface Window {
    showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
  }
}

export {}
