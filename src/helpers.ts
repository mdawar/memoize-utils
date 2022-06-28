/**
 * Get an ID from all the arguments casted to a string and joined together.
 *
 * **Note**: does not work with objects.
 *
 * @param args - Any number or arguments
 * @returns String ID
 */
export function all(...args: readonly any[]): string {
  return args.map(String).join('-');
}

/**
 * Get a JSON string ID from the arguments.
 *
 * **Note**: does not work with `RegExp` objects.
 *
 * @param args - Any number or arguments
 * @returns String ID
 */
export function json(...args: readonly any[]): string {
  return JSON.stringify(args);
}

/**
 * Get the same ID from a set of arguments passed in any order.
 *
 * The passed arguments are sorted and then casted to a string and then joined together.
 *
 * **Note**: does not work with objects.
 *
 * @param args - Any number or arguments
 * @returns String ID
 */
export function anyOrder(...args: readonly any[]): string {
  return args.slice().sort().map(String).join('-');
}
