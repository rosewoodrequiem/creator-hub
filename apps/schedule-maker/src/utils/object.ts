import { isArray, isPlainObject, isString } from "lodash"

export async function deepMapStringsAsync<T>(
  value: T,
  mapper: (s: string) => Promise<string>,
): Promise<T> {
  if (isString(value)) {
    return (await mapper(value)) as unknown as T
  }
  if (isArray(value)) {
    const out = await Promise.all(
      value.map((v) => deepMapStringsAsync(v, mapper)),
    )
    return out as unknown as T
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value as Record<string, unknown>)
    const mapped = await Promise.all(
      entries.map(
        async ([k, v]) => [k, await deepMapStringsAsync(v, mapper)] as const,
      ),
    )
    return Object.fromEntries(mapped) as unknown as T
  }
  return value
}

export function deepForEachString(
  value: unknown,
  fn: (s: string) => void,
): void {
  if (isString(value)) {
    fn(value)
    return
  }
  if (isArray(value)) {
    for (const v of value) deepForEachString(v, fn)
    return
  }
  if (isPlainObject(value)) {
    for (const v of Object.values(value as Record<string, unknown>)) {
      deepForEachString(v, fn)
    }
  }
}
