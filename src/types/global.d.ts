/// <reference types="vite/client" />

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.module.scss' {
  const content: Record<string, string>;
  export default content;
}

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface FilePickerOptions {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

interface FileSystemFileHandle {
  kind: 'file';
  name: string;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface Window {
  showSaveFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle>;
}
