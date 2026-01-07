## Running Locally

```txt
bun i
bun run dev
```

```txt
bun run deploy
```

For installing worker types:

```txt
bun add --dev @cloudflare/workers-types
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>();
```
