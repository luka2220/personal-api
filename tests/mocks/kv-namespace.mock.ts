export function createKVMock(seed?: Record<string, string>): KVNamespace {
  // DOC: When the seed exsits below it is converted to an array, then converted
  // to a map to preserve it's kv structure, biut represented as a map.
  // i.e seed -> { 'repos': [...]} ==> store -> Map(1) { 'repos' => [...] }
  const store = new Map<string, string>(
    seed ? Object.entries(seed) : undefined,
  );

  return {
    async get(key: string, options?: any) {
      const val = store.get(key);
      if (val === undefined) return null;
      if (options === "json" || options?.type === "json")
        return JSON.parse(val);
      return val;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async delete(key: string) {
      store.delete(key);
    },
    async list() {
      return {
        keys: [...store.keys()].map((name) => ({ name })),
        list_complete: true,
        cursor: "",
      };
    },
    async getWithMetadata(key: string, options?: any) {
      const val = await this.get(key, options);
      return { value: val, metadata: null };
    },
  } as unknown as KVNamespace;
}
