# Repo Setup — Track Changes Like iOS Fork

This project should live in its own Git repo so you can track changes, just like `app-store-connect-iap-fork` for iOS.

## Option A: Create a New GitHub Repo (Recommended)

1. **Create the repo on GitHub**
   - Go to [github.com/new](https://github.com/new)
   - Name: `google-play-iap-mcp` (or `store-iap-mcp` if you prefer)
   - Visibility: Private or Public
   - Do **not** initialize with README (you already have one)

2. **Push from local**
   ```powershell
   cd C:\Users\LSPDev\google-play-iap-mcp
   git init
   git add .
   git commit -m "Initial commit: Google Play IAP MCP"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/google-play-iap-mcp.git
   git push -u origin main
   ```

3. **Or use GitHub CLI**
   ```powershell
   cd C:\Users\LSPDev\google-play-iap-mcp
   gh repo create google-play-iap-mcp --private --source=. --push
   ```

## Option B: Unified Repo (Apple + Google)

If you prefer one repo for both stores (like RevenueCat/Adapty):

1. Create `store-iap-mcp` repo
2. Add the Apple IAP handlers from `app-store-connect-iap-fork` (or merge that fork into this)
3. This repo already has Google Play; you’d add Apple as a second platform

**Trade-off:** One repo is simpler to maintain; two repos keep Apple and Google changes separate.

## Current Structure (Standalone)

```
google-play-iap-mcp/
├── src/
│   ├── index.ts          # MCP server
│   ├── handlers/iap.ts   # Google Play IAP handlers
│   └── services/play-client.ts
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

## MCP Config (after clone)

When cloning elsewhere, update `~/.cursor/mcp.json`:

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

Replace placeholders with your actual paths and package name.
