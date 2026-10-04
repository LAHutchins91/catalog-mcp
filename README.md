# Catalog

Catalog keeps a store’s approved product specs, the price the store allows an assistant to state, and availability, then lets an assistant read that catalog before it writes. A check rejects draft shopping copy that states a spec, a price, or a stock level that is not in the approved catalog.

Availability is in stock, out of stock, or a quantity the store approved. Retired products are not current facts.

It works with ChatGPT, Claude, Gemini, Grok, and Cursor, plus any other MCP client that can do Streamable HTTP and OAuth. It is not a ChatGPT-only plugin.

Sign in with your Catalog account when the assistant opens OAuth. Do not paste an API key or password into a header. Catalog does not accept API keys. Catalog tools need Pro or an active trial. The site offers a 14-day trial, then Pro.

The MCP path on a deployment is `/mcp`. Registry metadata is in `server.json` (`io.github.LAHutchins91/catalog`).

## What the assistant can do

After you approve the connection, the server exposes these tools:

- list_stores
- create_store
- get_store_catalog
- save_product
- check_shopping_copy

`check_shopping_copy` does not save the draft. Do not deliver copy when its verdict is rejected. A stored product price is data the assistant may repeat. It is the price the store saved, not a price for Catalog itself. The assistant only calls these tools when you and the host allow it.

## Connect

Cursor, in `~/.cursor/mcp.json` or a project `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "catalog": {
      "url": "https://YOUR_CATALOG_HOST/mcp"
    }
  }
}
```

Claude Code:

```bash
claude mcp add --transport http catalog https://YOUR_CATALOG_HOST/mcp
```

Other clients: add the same URL, choose OAuth, and leave client id and secret empty. Catalog supports dynamic client registration. Full steps for each assistant are on the connect page.

## Run

```bash
npm install
npm run build
npm start
```

`npm start` runs `node dist/src/server.js`. When stdin is not a terminal, the process also speaks MCP on stdio so a sandbox can list tools without a token. A terminal keeps the HTTP listener only.

The server starts with empty Supabase and Stripe settings. Discovery (`initialize`, `notifications/initialized`, `tools/list`, and `ping`) does not need a user token. Saving or reading a catalog requires a signed-in subscriber.

Copy `supabase/schema.sql` into the Supabase SQL editor before catalog tools can read or write. Set these environment variables in the host, not in the repo:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_YEARLY`
- `APP_BASE_URL`
- `PORT`
- `OPENAI_APPS_CHALLENGE` (optional)

Stripe Checkout shows the billing interval and trial before purchase.
