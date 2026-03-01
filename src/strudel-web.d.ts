declare module '@strudel/web' {
  interface StrudelOptions {
    prebake?: () => void | Promise<void>;
  }
  export function initStrudel(options?: StrudelOptions): Promise<void>;
}
