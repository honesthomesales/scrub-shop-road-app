# How to Clear Cache and Get Latest Version

## Desktop Chrome/Edge

### Method 1: Hard Refresh (Fastest)
- **Windows/Linux**: Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: Press `Cmd + Shift + R`

### Method 2: Clear Site Data
1. Press `F12` to open DevTools
2. Right-click the refresh button (next to address bar)
3. Select **"Empty Cache and Hard Reload"**

### Method 3: Clear Browsing Data
1. Press `Ctrl + Shift + Delete` (or `Cmd + Shift + Delete` on Mac)
2. Select **"Cached images and files"**
3. Time range: **"Last hour"** or **"All time"**
4. Click **"Clear data"**
5. Refresh the page

## Mobile Chrome (Android)

### Method 1: Hard Refresh
1. Open Chrome menu (3 dots, top right)
2. Tap **"Settings"**
3. Tap **"Privacy and security"**
4. Tap **"Clear browsing data"**
5. Select:
   - ✅ **Cached images and files**
   - ✅ **Site settings**
6. Time range: **"Last hour"**
7. Tap **"Clear data"**
8. Close and reopen Chrome
9. Visit the site again

### Method 2: Clear Site Data (More Targeted)
1. Visit: `https://honesthomesales.github.io/scrub-shop-road-app/`
2. Tap the lock icon (or "i" icon) in the address bar
3. Tap **"Site settings"**
4. Tap **"Clear & Reset"**
5. Confirm
6. Refresh the page

### Method 3: Incognito Mode (Fresh Start)
1. Open Chrome menu
2. Tap **"New incognito tab"**
3. Visit: `https://honesthomesales.github.io/scrub-shop-road-app/`
4. Check version - should show latest

## Mobile Safari (iOS)

1. Go to **Settings** → **Safari**
2. Tap **"Clear History and Website Data"**
3. Confirm
4. Close and reopen Safari
5. Visit the site again

## Verify You Have Latest Version

After clearing cache, check:
- Version badge in header should show: **v1.3.0-PWA-DEBUG**
- If still showing v1.2.0, wait 2-3 minutes and try again (GitHub Pages may still be deploying)

## Force Service Worker Update

If service worker is caching the old version:

1. Open Chrome DevTools (F12 or long-press → Inspect)
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar
4. Click **"Unregister"** on any service workers
5. Hard refresh: `Ctrl + Shift + R`

