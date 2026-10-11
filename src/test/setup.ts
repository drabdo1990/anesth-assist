import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom does not implement these browser APIs that Radix primitives query.
if (typeof window !== 'undefined') {
  const globals = window as unknown as {
    ResizeObserver?: typeof ResizeObserver
    matchMedia?: typeof window.matchMedia
  }
  if (!globals.ResizeObserver) {
    globals.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
  }
  if (!globals.matchMedia) {
    globals.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  }
}
// React 19 uses this flag to decide whether to warn about act().
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  if (typeof document !== 'undefined') cleanup()
})
