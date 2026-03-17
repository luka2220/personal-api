/**
 * Fetches a ket from cloudflare KV-Store;
 *
 * NOTE: parses the response as json if type T is other than string
 *
 * parseAs defaults to string
 * */
export async function getDB<T = string>(
  db: KVNamespace,
  key: string,
  parseAs: 'string' | 'json' | undefined
): Promise<T | null> {
  try {
    if (parseAs == 'json') {
      return await db.get<T>(key, { type: 'json' });
    }

    return await db.get<T>(key);
  } catch (error) {
    throw new DBOperationError('Error fetching data', {
      operation: 'get',
      table: '',
    });
  }
}

export async function putDB(db: KVNamespace, key: string) {}
