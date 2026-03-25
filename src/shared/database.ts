/**
 * Fetches a ket from cloudflare KV-Store
 * NOTE: parses the response as json if type T is other than string
 * parseAs defaults to string
 * */
export async function getDB<T = string>(
  db: KVNamespace,
  key: string,
  parseAs: "string" | "json" | undefined,
): Promise<T | null> {
  try {
    return parseAs === "json"
      ? await db.get<T>(key, { type: "json" })
      : await db.get<T>(key);
  } catch (error) {
    console.error("An error occurred fetching an item from the DB: ", {
      error,
    });
    return null;
  }
}
