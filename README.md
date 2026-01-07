# Personal API

[![Deploy Worker](https://github.com/luka2220/personal-api/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/luka2220/personal-api/actions/workflows/deploy.yml)

_Live API Url:_ [api link](https://personal-api.piplicaluka64.workers.dev/)

## Deployment

Github actions are setup to automagically deploy the worker code to cloudflare on _push to main_

## Running Locally

Install packages and dependencies:

```txt
bun i
bun run dev
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
