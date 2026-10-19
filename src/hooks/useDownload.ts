import { useState, useCallback, useRef } from 'react';
import { StorageMethod } from '@/enums';
import { localStorageAction } from './useLocalStorage';
import { ACCESS_TOKEN_KEY, TOKEN_ENCRYPT } from '@/constants';

interface DownloadOptions {
  url: string;
  suggestedName?: string;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

interface DownloadState {
  downloading: boolean;
  progress: number;
  error: string | null;
}

export function useDownload() {
  const [state, setState] = useState<DownloadState>({
    downloading: false,
    progress: 0,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const download = useCallback(async (options: DownloadOptions): Promise<boolean> => {
    const { url, suggestedName = 'download', onProgress, onError } = options;

    const token = localStorageAction<string>(StorageMethod.Get, ACCESS_TOKEN_KEY, TOKEN_ENCRYPT);

    const abortController = new AbortController();
    abortRef.current = abortController;

    setState({ downloading: true, progress: 0, error: null });

    try {
      const response = await fetch(url, {
        signal: abortController.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      if ('showSaveFilePicker' in window) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName,
          types: [
            {
              description: 'All Files',
              accept: { 'application/octet-stream': ['.*'] },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        const reader = response.body.getReader();
        let received = 0;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await writable.write(value);
            received += value.length;
            const pct = total ? Math.round((received / total) * 100) : 0;
            setState((prev) => ({ ...prev, progress: pct }));
            onProgress?.(pct);
          }
        } finally {
          reader.releaseLock();
          await writable.close();
        }
      } else {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = suggestedName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(blobUrl);
        setState((prev) => ({ ...prev, progress: 100 }));
        onProgress?.(100);
      }

      setState({ downloading: false, progress: 100, error: null });
      return true;
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') {
        setState({ downloading: false, progress: 0, error: null });
        return false;
      }
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ downloading: false, progress: 0, error: error.message });
      onError?.(error);
      return false;
    } finally {
      if (abortRef.current === abortController) {
        abortRef.current = null;
      }
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { ...state, download, cancel };
}
