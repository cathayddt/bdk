import format from 'string-format'

export interface Map {
  [key: string]: any
  [index: number]: any
}

export function iterateFormat (
  item: string | Map,
  formatObject: object,
): string | object {
  if (typeof item === 'object') {
    for (const key in item) {
      const parsedKey = format(key, formatObject)
      item[parsedKey] = iterateFormat(item[key], formatObject)
      parsedKey !== key && delete item[key]
    }
  } else if (typeof item === 'string') {
    return format(item, formatObject)
  }
  return item
}

export function tarDateFormat (date: Date): string {
  return date.toISOString().slice(0, 19).replace(/T/g, '_').replace(/:/g, '-')
}

export const randomFromArray = <T> (x: Array<T>) => x[Math.floor(Math.random() * x.length)]

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
