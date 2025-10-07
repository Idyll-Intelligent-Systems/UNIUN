declare global {
  namespace JSX {
    interface IntrinsicElements {
      // allow any intrinsic element for quick scaffold
      [elemName: string]: any
    }
  }
}

export {}

declare module '*.css'
