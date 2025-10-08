require('@testing-library/jest-dom')

// Polyfill IntersectionObserver for jsdom
if (typeof global.IntersectionObserver === 'undefined') {
	class IO {
		constructor(callback, options) { this._cb = callback; this._options = options }
		observe() {}
		unobserve() {}
		disconnect() {}
		takeRecords() { return [] }
	}
	global.IntersectionObserver = IO
}
