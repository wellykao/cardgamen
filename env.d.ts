/// <reference types="vite/client" />

declare module '*.svg' {
  const src: string
  export default src
}

declare module 'howler' {
  export { Howl } from 'howler'
}
