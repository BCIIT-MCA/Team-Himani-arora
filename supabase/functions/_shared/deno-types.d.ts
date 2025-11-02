/**
 * Deno type declarations for VS Code compatibility
 * This file provides type definitions for Deno APIs when using VS Code
 */

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    has(key: string): boolean;
    toObject(): Record<string, string>;
  }

  export const env: Env;

  export interface Reader {
    read(p: Uint8Array): Promise<number | null>;
  }

  export interface Writer {
    write(p: Uint8Array): Promise<number>;
  }

  export interface Closer {
    close(): void;
  }

  export interface ReaderSync {
    readSync(p: Uint8Array): number | null;
  }

  export interface WriterSync {
    writeSync(p: Uint8Array): number;
  }
}

// Global type declarations for Deno runtime
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
      set(key: string, value: string): void;
      delete(key: string): void;
      has(key: string): boolean;
      toObject(): Record<string, string>;
    };
  };
}

export {};
