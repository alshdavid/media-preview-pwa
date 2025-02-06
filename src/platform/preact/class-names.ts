import { h } from "preact"

export const classNames = (...inputs: Array<[string, boolean] | Record<string, boolean | undefined> |string | undefined | h.JSX.SignalLike<string | undefined>>): string => {
  let className = ''

  for (const input of inputs) {
    if (Array.isArray(input) && input[1] === true) {
      className += ` ${input[0]}`
    }
    else if (typeof input === 'object') {
      for (const [item, enabled] of Object.entries(input)) {
        if (enabled === false) continue
        className += ` ${item}`
      }
    } 
    else if (typeof input === 'string') {
      className += ` ${input}`
    }
  }

  return className
}
