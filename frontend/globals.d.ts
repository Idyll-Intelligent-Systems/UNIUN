import * as React from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // allow any intrinsic element for quick scaffold
      [elemName: string]: any
    }
  }
}

export {}
