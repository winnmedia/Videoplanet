/**
 * 두 숫자를 더합니다.
 * @param a 첫 번째 숫자
 * @param b 두 번째 숫자
 * @returns 두 숫자의 합
 */
export function add(a: number, b: number): number {
  return a + b
}

/**
 * 두 숫자를 곱합니다.
 * @param a 첫 번째 숫자
 * @param b 두 번째 숫자
 * @returns 두 숫자의 곱
 */
export function multiply(a: number, b: number): number {
  return a * b
}

/**
 * 숫자가 짝수인지 확인합니다.
 * @param n 확인할 숫자
 * @returns 짝수면 true, 홀수면 false
 */
export function isEven(n: number): boolean {
  return n % 2 === 0
}