declare module 'readable-stream' {
  import { Readable as NodeReadable } from 'stream';
  export { NodeReadable as Readable };
}

