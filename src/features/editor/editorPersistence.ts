const DB_NAME = 'japanese-study-editor'
const STORE_NAME = 'workspace'
const HANDLE_KEY = 'last-workspace-handle'

type PermissionTarget = {
  queryPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<'granted' | 'denied' | 'prompt'>
  requestPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<'granted' | 'denied' | 'prompt'>
}

export type ReadWritePermissionState = 'granted' | 'denied' | 'prompt'

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb()

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const request = action(store)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
  })
}

export async function loadSavedWorkspaceHandle() {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return null
  }

  try {
    return await withStore<FileSystemDirectoryHandle | null>('readonly', (store) => store.get(HANDLE_KEY))
  } catch {
    return null
  }
}

export async function saveWorkspaceHandle(handle: FileSystemDirectoryHandle) {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return
  }

  await withStore('readwrite', (store) => store.put(handle, HANDLE_KEY))
}

export async function getReadWritePermissionState(handle: PermissionTarget | null): Promise<ReadWritePermissionState> {
  if (!handle) {
    return 'denied'
  }

  if (!handle.queryPermission) {
    return 'granted'
  }

  try {
    return await handle.queryPermission({ mode: 'readwrite' })
  } catch {
    return 'prompt'
  }
}

export async function ensureReadWritePermission(handle: PermissionTarget | null) {
  if (!handle) {
    return false
  }

  if (!handle.queryPermission || !handle.requestPermission) {
    return true
  }

  const current = await getReadWritePermissionState(handle)
  if (current === 'granted') {
    return true
  }

  return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted'
}

export function supportsDirectoryPicker() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

export async function pickWorkspaceDirectory() {
  if (!supportsDirectoryPicker() || !window.showDirectoryPicker) {
    return null
  }

  return window.showDirectoryPicker({ mode: 'readwrite' })
}

export async function verifyWorkspaceDirectory(handle: FileSystemDirectoryHandle) {
  try {
    await handle.getFileHandle('package.json')
    const srcDirectory = await handle.getDirectoryHandle('src')
    const featuresDirectory = await srcDirectory.getDirectoryHandle('features')
    const vocabDirectory = await featuresDirectory.getDirectoryHandle('vocab')
    await vocabDirectory.getDirectoryHandle('data')
    return true
  } catch {
    return false
  }
}

export async function writeTextFile(
  rootHandle: FileSystemDirectoryHandle,
  pathSegments: readonly string[],
  content: string,
) {
  const [fileName, ...reversedDirectorySegments] = [...pathSegments].reverse()

  if (!fileName) {
    throw new Error('file path missing')
  }

  let directoryHandle = rootHandle
  for (const segment of reversedDirectorySegments.reverse()) {
    directoryHandle = await directoryHandle.getDirectoryHandle(segment, { create: true })
  }

  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

export function downloadBlobFile(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadTextFile(fileName: string, content: string) {
  downloadBlobFile(fileName, new Blob([content], { type: 'text/plain;charset=utf-8' }))
}
