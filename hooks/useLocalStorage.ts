"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";

const isBrowser = typeof window !== "undefined";

function readLocalStorageValue<T>(key: string, initialValue: T): T {
  if (!isBrowser) return initialValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : initialValue;
  } catch (error) {
    console.warn(`Failed to read localStorage key “${key}”`, error);
    return initialValue;
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() =>
    readLocalStorageValue<T>(key, initialValue),
  );

  useEffect(() => {
    setStoredValue(readLocalStorageValue<T>(key, initialValue));
  }, [key, initialValue]);

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      try {
        setStoredValue((currentValue) => {
          const nextValue =
            value instanceof Function ? value(currentValue) : value;

          if (isBrowser) {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
            window.dispatchEvent(
              new CustomEvent("local-storage", {
                detail: { key, value: nextValue },
              }),
            );
          }

          return nextValue;
        });
      } catch (error) {
        console.warn(`Failed to set localStorage key “${key}”`, error);
      }
    },
    [key],
  );

  const removeValue = useCallback(() => {
    if (!isBrowser) return;

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      window.dispatchEvent(
        new CustomEvent("local-storage", {
          detail: { key, value: initialValue },
        }),
      );
    } catch (error) {
      console.warn(`Failed to remove localStorage key “${key}”`, error);
    }
  }, [initialValue, key]);

  useEffect(() => {
    if (!isBrowser) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key !== key) return;
      setStoredValue(readLocalStorageValue<T>(key, initialValue));
    };

    const handleCustomStorageChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>;
      if (customEvent.detail?.key !== key) return;
      setStoredValue(readLocalStorageValue<T>(key, initialValue));
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage", handleCustomStorageChange);
    };
  }, [initialValue, key]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
