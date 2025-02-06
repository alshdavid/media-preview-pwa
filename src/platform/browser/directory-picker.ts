export type DirectoryPickerOptions = {
  id?: string,
  mode?: "read" | "readwrite"
  startIn?: FileSystemHandle | string
}

export type DirectoryHandle = FileSystemDirectoryHandle & {
  entries(): AsyncIterable<[string, (FileSystemDirectoryHandle | FileSystemFileHandle)]>
}

export function directoryPicker(): Promise<DirectoryHandle> {
  if (!('showDirectoryPicker' in globalThis)) {
    throw new Error('Browser does not support FileSystem API')
  }
  // @ts-expect-error
  return globalThis.showDirectoryPicker()
}

export type FileSystemObserverInstance = {
  observe(handle: FileSystemHandle): Promise<void>
  unobserve(handle: FileSystemHandle): Promise<void>
  disconnect(): void
}

export function createFileSystemObserver(callback: () => void): Promise<FileSystemObserverInstance> {
  if (!('FileSystemObserver' in self)) {
    throw new Error('Browser does not support FileSystemObserver API')
  }
  // @ts-expect-error
  return new FileSystemObserver(callback)
}