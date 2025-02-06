// This is my DIY version of MobX. There are
// lots of improvements to make for performance, 
// but it does the trick for now

export type ChangeType = typeof ChangeType[keyof typeof ChangeType];
export const ChangeType = Object.freeze({
  Proxy: Symbol('proxy'),
  Push: Symbol('push'),
})

export type KeyType = string | number | symbol

const Observe = Symbol('Observe')

export function makeObservable<T, K extends keyof T>(target: T, properties: { [U in K]: ChangeType }) {
  const targetInner: any = target
  const inner: Record<string | number | symbol, any> = {}
  const observer = new EventTarget

  let emitting = false
  let queue: string[][] = []

  // Send the first event then batch all
  // subsequent events in 10ms intervals
  function emit(...keys: string[][]) {
    if (emitting === true) {
      queue.push(...keys)
      return
    }
    emitting = true
    
    observer.dispatchEvent(new CustomEvent('change', { detail: keys }))

    setTimeout(() => {
      emitting = false
      if (queue.length) {
        const q = queue
        queue = []
        emit(...q)
      }
    }, 10)
  }

  Object.defineProperty(targetInner, Observe, {
    enumerable: false,
    writable: false,
    value: observer
  })

  for (const [key, k] of Object.entries(properties)) {
    inner[key] = targetInner[key]
    
    if (k === ChangeType.Push) {
      Object.defineProperty(targetInner, key, {
        get() {
          return inner[key]
        },
        set(value: any) {
          inner[key] = value
          emit([key, k as any])
        },
      })
    }
    else if (k === ChangeType.Proxy) {
      inner[key] = buildProxy(targetInner[key], (keys: any) => emit(keys))

      Object.defineProperty(targetInner, key, {
        get() {
          return inner[key]
        },
        set(value: any) {
          inner[key] = buildProxy(value, (keys: any) => emit(keys))
          emit([key])
        },
      })      
    }
  }
}

export function notifyChange(target: any, ...keys: string[]) {
  target[Observe].dispatchEvent(new CustomEvent('change', { detail: keys }))
}

function buildProxy(poj: any, callback: any, tree: any = []) {
  return new Proxy(poj, {
    get: (target, prop)  =>{
      const value = Reflect.get(target, prop);

      if (
        value &&
        typeof value === "object" &&
        ["Array", "Object"].includes(value.constructor.name)
      )
        return buildProxy(value, callback, tree.concat(prop));

      return value;
    },

    set: (target, prop, value) => {
      callback(tree.concat(prop));
      return Reflect.set(target, prop, value);
    },

    deleteProperty: (target, prop) => {
      callback(tree.concat(prop));
      return Reflect.deleteProperty(target, prop);
    },
  });
}

export function subscribe(target: any, callback: (key: string) => any | Promise<any>): () => void {
  if (!(Observe in target)) {
    return () => {}
  }
  const fn = ({ detail }: CustomEvent) => callback(detail)
  target[Observe].addEventListener('change', fn)
  return () => target[Observe].removeEventListener('change', fn)
}
