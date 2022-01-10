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

export const randomFromArray = <T> (x: Array<T>) => x[Math.floor(Math.random() * x.length)]
// export function iterateObject2 (obj: Map, callback: (x: string) => any) {
//   for (const key in obj) {
//     if (typeof obj[key] === 'object') {
//       iterateObject(obj[key], callback)
//       if (callback(key) !== key) {
//         obj[callback(key)] = obj[key]
//         delete obj[key]
//       }
//     } else {
//       obj[key] = callback(obj[key])
//     }
//   }
// }
