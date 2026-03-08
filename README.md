# Google Play IAP MCP

MCP server for creating Google Play in-app products and subscriptions via API—similar to the App Store Connect IAP fork.

## Setup

1. **Service account**: Create a service account in Google Cloud with the Android Publisher API enabled. Download the JSON key and place it somewhere secure (e.g. `~/.google/credentials.json`).

2. **Play Console**: Add the service account to your app in Play Console → Users and permissions → Invite new users. Grant "Manage orders and subscriptions" (or equivalent).

3. **Environment variables**:
   - `GOOGLE_APPLICATION_CREDENTIALS` – path to service account JSON (required)
   - `GOOGLE_PLAY_PACKAGE_NAME` – your app package (e.g. `com.example.yourapp`)

## Cursor MCP config

Add to `~/.cursor/mcp.json`:

```json
"google-play-iap": {
  "command": "node",
  "args": ["/path/to/google-play-iap-mcp/dist/index.js"],
  "cwd": "/path/to/google-play-iap-mcp",
  "env": {
    "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/your-service-account.json",
    "GOOGLE_PLAY_PACKAGE_NAME": "com.example.yourapp"
  }
}
```

Replace `/path/to/` with your actual paths and `com.example.yourapp` with your app's package name.

## Tools

| Tool | Description |
|------|-------------|
| `list_in_app_products` | List managed products (one-time purchases) |
| `create_in_app_product` | Create a managed product (e.g. `lytquiz_pro_lifetime_`) |
| `list_subscriptions` | List subscriptions |
| `create_subscription` | Create a subscription (monthly P1M or yearly P1Y) |

## Example product IDs

- `yourapp_pro_monthly` – subscription (P1M)
- `yourapp_pro_yearly` – subscription (P1Y)
- `yourapp_pro_lifetime` – one-time managed product

## Notes

- Subscriptions are created in **DRAFT** state. Activate base plans in Play Console.
- Managed products (lifetime) are created **active**.
- `regionsVersion` defaults to `2022/01`; use `2022/02` if needed per [Google's docs](https://support.google.com/googleplay/android-developer/answer/10532353).
