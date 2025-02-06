export type PanZoomInstance = {
  dispose(): void
}

export function panzoom(element: HTMLElement): PanZoomInstance {
  // @ts-expect-error
  return globalThis.panzoom(element, {
    filterKey: function(/* e, dx, dy, dz */) {
      // don't let panzoom handle this event:
      return true;
    }
  })
}
