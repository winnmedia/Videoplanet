/**
 * Server-side polyfill for self
 * Next.js SSR/SSG에서 self is not defined 에러 방지
 */

if (typeof self === 'undefined') {
  global.self = global;
}