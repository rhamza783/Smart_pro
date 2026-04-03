/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Retrieves data from localStorage with a fallback to a default value.
 * @param key The localStorage key to retrieve.
 * @param defaultValue The value to return if the key is not found or invalid.
 */
export function getData<T>(key: string, defaultValue: T): T {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null) {
      return defaultValue;
    }
    return JSON.parse(storedValue) as T;
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Stores data in localStorage.
 * @param key The localStorage key to set.
 * @param value The value to store.
 */
export function setData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}
