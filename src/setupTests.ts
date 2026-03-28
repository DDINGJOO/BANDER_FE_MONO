// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Radix Slider relies on ResizeObserver, which jsdom does not provide.
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

if (!global.fetch) {
  Object.defineProperty(global, 'fetch', {
    configurable: true,
    value: jest.fn(),
    writable: true,
  });
}
