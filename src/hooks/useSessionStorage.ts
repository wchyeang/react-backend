import { useState, useCallback, useEffect } from 'react';
import { StorageMethod } from '@/enums';
import { ENCRYPTION_KEY } from '@/constants';

/** 生产环境且 encrypt=true 时才加密 */
function shouldEncrypt(encrypt?: boolean): boolean {
  return import.meta.env.PROD && encrypt === true;
}

function encode(str: string): string {
  return btoa(encodeURIComponent(str));
}

function decode(str: string): string {
  return decodeURIComponent(atob(str));
}

function xorEncrypt(value: string, key: string): string {
  let result = '';
  for (let i = 0; i < value.length; i++) {
    result += String.fromCharCode(value.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return encode(result);
}

function xorDecrypt(value: string, key: string): string {
  const decoded = decode(value);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/** 从 sessionStorage 读取并解密 */
function readStorage<T = unknown>(key: string, encrypt?: boolean): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return null;
    const value = shouldEncrypt(encrypt) ? xorDecrypt(raw, ENCRYPTION_KEY) : raw;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  } catch {
    return null;
  }
}

/** 加密后写入 sessionStorage */
function writeStorage(key: string, value: unknown, encrypt?: boolean): void {
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    const final = shouldEncrypt(encrypt) ? xorEncrypt(str, ENCRYPTION_KEY) : str;
    sessionStorage.setItem(key, final);
  } catch {
    // Storage full or unavailable
  }
}

/** 批量删除 sessionStorage 中的 key */
function removeStorage(keys: string | string[]): void {
  const keyList = Array.isArray(keys) ? keys : [keys];
  keyList.forEach((k) => sessionStorage.removeItem(k));
}

/** 清空 sessionStorage */
function clearStorage(): void {
  sessionStorage.clear();
}

/**
 * 统一 sessionStorage 操作函数，可在任意位置使用（组件内外均可）
 *
 * @example
 * sessionStorageAction(StorageMethod.Get, 'token', true)          // 读取
 * sessionStorageAction(StorageMethod.Set, 'token', 'xxx', true)   // 写入
 * sessionStorageAction(StorageMethod.Remove, ['k1', 'k2'])        // 批量删除
 * sessionStorageAction(StorageMethod.Clear)                       // 清空
 */
export function sessionStorageAction<T = unknown>(
  method: StorageMethod.Get,
  key: string,
  encrypt?: boolean,
): T | null;
export function sessionStorageAction(
  method: StorageMethod.Set,
  key: string,
  value: unknown,
  encrypt?: boolean,
): void;
export function sessionStorageAction(method: StorageMethod.Remove, keys: string | string[]): void;
export function sessionStorageAction(method: StorageMethod.Clear): void;
export function sessionStorageAction(method: StorageMethod, ...args: unknown[]): unknown {
  switch (method) {
    case StorageMethod.Get:
      return readStorage<unknown>(args[0] as string, args[1] as boolean | undefined);
    case StorageMethod.Set:
      return writeStorage(args[0] as string, args[1], args[2] as boolean | undefined);
    case StorageMethod.Remove:
      return removeStorage(args[0] as string | string[]);
    case StorageMethod.Clear:
      return clearStorage();
  }
}

/**
 * sessionStorage React Hook，用于组件内响应式读写
 *
 * @param key      存储 key
 * @param initialValue 初始值
 * @param encrypt  生产环境是否加密（默认 false）
 * @returns [value, set, remove]
 */
export function useSessionStorage<T>(key: string, initialValue: T, encrypt?: boolean) {
  const [value, setValue] = useState<T>(() => {
    const stored = readStorage<T>(key, encrypt);
    return stored !== null ? stored : initialValue;
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key || e.storageArea !== sessionStorage) return;
      if (e.newValue === null) {
        setValue(initialValue);
      } else {
        try {
          const newVal = shouldEncrypt(encrypt)
            ? JSON.parse(xorDecrypt(e.newValue, ENCRYPTION_KEY))
            : JSON.parse(e.newValue);
          setValue(newVal as T);
        } catch {
          setValue(e.newValue as T);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, encrypt, initialValue]);

  const set = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
        writeStorage(key, resolved, encrypt);
        return resolved;
      });
    },
    [key, encrypt],
  );

  const remove = useCallback(() => {
    removeStorage(key);
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, set, remove] as const;
}
