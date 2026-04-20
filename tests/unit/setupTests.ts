import '@testing-library/jest-dom';

if (typeof global.setImmediate !== 'function') {
  global.setImmediate = ((callback: (...args: unknown[]) => void, ...args: unknown[]) =>
    setTimeout(callback, 0, ...args)) as unknown as typeof setImmediate;
}
