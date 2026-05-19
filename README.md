# ForgePunchlist

Drop-in vanilla JavaScript punchlist widget for frontend apps.

The widget renders a helper box in the bottom-right corner, captures user issue details, current URL, and recent console logs, then submits to Buildly Labs APIs.

## Features

- Framework-agnostic: plain JavaScript (no React dependency)
- Floating helper button + polished issue panel UI
- Captures runtime context automatically:
	- current page URL
	- recent `console.log/info/warn/error`
	- window errors and unhandled promise rejections
	- user agent and viewport
- Supports Buildly auth options:
	- `Authorization: Bearer <token>` (recommended)
	- query token fallback (`?access_token=...`)
- Product-aware reporting:
	- includes `product_id` in payload
	- optional `X-Product-Id` header
- Custom payload transform hook for exact API field matching

## Install

### Option 1: npm package (after publishing)

```bash
npm install @buildly/forge-punchlist
```

```js
import { initForgePunchlistWidget } from "@buildly/forge-punchlist";
```

### Option 2: Git submodule

```bash
git submodule add https://github.com/Buildly-Marketplace/ForgePunchlist.git shared/forge-punchlist
git submodule update --init --recursive
```

Then import directly:

```js
import { initForgePunchlistWidget } from "./shared/forge-punchlist/forge-punchlist.js";
```

### Option 3: script tag

```html
<script src="./forge-punchlist.js"></script>
<script>
	window.ForgePunchlist.init({
		apiUrl: "https://labs-api.buildly.io/punchlist/punchlist-item/",
		bearerToken: "YOUR_API_TOKEN",
		productId: 123,
		appName: "My App"
	});
</script>
```

## Quick start

```js
import { initForgePunchlistWidget } from "./forge-punchlist.js";

const cleanup = initForgePunchlistWidget({
	apiUrl: "https://labs-api.buildly.io/punchlist/punchlist-item/",
	bearerToken: "YOUR_API_TOKEN",
	productId: 123,
	appName: "My App",
});

// later if needed
cleanup.destroy();
```

## Buildly Labs setup

### 1. Get your API token

Use your Labs API token with bearer auth:

```http
Authorization: Bearer YOUR_API_TOKEN
```

### 2. Find product ID

Fetch your products and pick the correct one:

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
	"https://labs-api.buildly.io/product/product/"
```

Use the product ID returned by that endpoint as `productId`.

### 3. Configure endpoint

Set `apiUrl` to your punchlist create endpoint in Labs (example placeholder):

```txt
https://labs-api.buildly.io/punchlist/punchlist-item/
```

If your environment uses a different route, update `apiUrl` accordingly.

## Configuration options

- `apiUrl` (required): Labs punchlist create endpoint
- `bearerToken`: Labs API token (without `Bearer` prefix)
- `productId`: numeric/string product ID for issue association
- `useQueryToken`: use `?access_token=` instead of auth header
- `accessTokenQueryParamName`: token query key (default `access_token`)
- `includeUrlByDefault`: include URL checkbox default
- `includeLogsByDefault`: include logs checkbox default
- `title`, `subtitle`, `buttonLabel`: widget copy
- `appName`: app identifier included in payload
- `metadata`: additional object merged into payload metadata
- `sendProductIdHeader`: include `X-Product-Id` header (default `true`)
- `maxLogEntries`: rolling log memory cap (default `80`)
- `transformPayload(payload, values, context)`: rewrite outbound payload

## Default payload

```json
{
	"title": "Button overlaps footer",
	"description": "On iPhone viewport the save button overlaps content.",
	"category": "ui_bug",
	"source": "forge-punchlist-widget",
	"app_name": "My App",
	"product_id": 123,
	"metadata": {
		"url": "https://example.app/settings",
		"logs": [],
		"user_agent": "...",
		"viewport": { "width": 390, "height": 844 },
		"timestamp": "2026-05-19T00:00:00.000Z",
		"extra": {}
	},
	"context": {
		"url": "https://example.app/settings",
		"logs": [],
		"userAgent": "...",
		"viewport": { "width": 390, "height": 844 },
		"timestamp": "2026-05-19T00:00:00.000Z"
	}
}
```

If Labs expects different fields, use `transformPayload`.

## License

MIT
