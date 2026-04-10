/*------------------------------------- Element Operations -------------------------------------*/

/** Removes all duplicate elements in an array */
export function uniqueOrdered(names: string[]): string[] {
  const seen = new Set<string>();

  return names.filter((n) => {
    if (seen.has(n)) {
      return false;
    }

    seen.add(n);
    return true;
  });
}
