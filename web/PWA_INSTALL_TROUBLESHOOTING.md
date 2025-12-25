# PWA Install Prompt Troubleshooting

## Why "Add to Home Screen" Instead of "Install"?

If you're seeing "Add to Home Screen" instead of the "Install" prompt on Android, here are the most common reasons:

---

## 🔍 Diagnostic Steps

### 1. Check Browser Console

Open Chrome DevTools (F12 or long-press → Inspect) and look for these messages:

**✅ Good signs:**
- `✅ Service Worker registered`
- `✅ Service Worker ready`
- `✅ Manifest accessible`
- `✅ beforeinstallprompt event fired - PWA is installable!`

**⚠️ Warning signs:**
- `⚠️ Service Worker not registered`
- `⚠️ Manifest not accessible`
- `❌ Service Worker check failed`

### 2. Check Service Worker Status

**In Chrome DevTools:**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar
4. Should show: **"activated and running"**

**If not active:**
- Click **Unregister** to remove old service workers
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check console for errors

### 3. Check Manifest

**In Chrome DevTools:**
1. Go to **Application** tab
2. Click **Manifest** in left sidebar
3. Should show your app name, icons, etc.

**Or manually check:**
```
https://honesthomesales.github.io/scrub-shop-road-app/manifest.webmanifest
```

Should return valid JSON with your app details.

### 4. Check Icons

**In Chrome DevTools:**
1. Go to **Application** → **Manifest**
2. Scroll to **Icons** section
3. Click each icon URL - should load successfully

**Or manually check:**
```
https://honesthomesales.github.io/scrub-shop-road-app/icon-192.svg
https://honesthomesales.github.io/scrub-shop-road-app/icon-512.svg
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Service Worker Not Active

**Symptoms:**
- Console shows: `⚠️ Service Worker not registered`
- DevTools shows no active service worker

**Solutions:**
1. **Clear old service workers:**
   - DevTools → Application → Service Workers
   - Click **Unregister** on any old workers
   - Hard refresh (Ctrl+Shift+R)

2. **Check if service worker file exists:**
   ```
   https://honesthomesales.github.io/scrub-shop-road-app/sw.js
   ```
   Should return JavaScript code (not 404)

3. **Check registerSW.js is loading:**
   - View page source
   - Look for: `<script id="vite-plugin-pwa:register-sw" src="./registerSW.js"></script>`

### Issue 2: Manifest Not Accessible

**Symptoms:**
- Console shows: `⚠️ Manifest not accessible`
- DevTools → Manifest shows errors

**Solutions:**
1. **Check manifest URL:**
   ```
   https://honesthomesales.github.io/scrub-shop-road-app/manifest.webmanifest
   ```

2. **Verify manifest link in HTML:**
   - View page source
   - Look for: `<link rel="manifest" href="/manifest.webmanifest" />`

3. **Check CORS headers** (should be fine on GitHub Pages)

### Issue 3: Icons Not Loading

**Symptoms:**
- Manifest shows icons but they don't load
- Console shows 404 errors for icons

**Solutions:**
1. **Verify icon files exist:**
   ```
   https://honesthomesales.github.io/scrub-shop-road-app/icon-192.svg
   https://honesthomesales.github.io/scrub-shop-road-app/icon-512.svg
   ```

2. **Check icon paths in manifest** (should be `/icon-192.svg`, not `./icon-192.svg`)

### Issue 4: Browser Engagement Heuristics

**This is the most common reason!**

Android Chrome requires:
- ✅ User has visited the site at least once
- ✅ User has interacted with the site (clicked, scrolled, etc.)
- ✅ Site has been open for at least 30 seconds
- ✅ User hasn't dismissed the prompt before

**Solutions:**
1. **Interact with the site:**
   - Click around
   - Scroll pages
   - Use features
   - Wait 30+ seconds

2. **Clear browser data** (if you've dismissed the prompt before):
   - Chrome → Settings → Site Settings → Clear & Reset
   - Or use incognito mode

3. **Wait and try again:**
   - Close and reopen the site
   - The prompt might appear on a later visit

### Issue 5: Already Installed

**Symptoms:**
- App is already on home screen
- Console shows: `ℹ️ App is already installed (standalone mode)`

**Solution:**
- Uninstall the app from home screen
- Clear browser data
- Visit site again

### Issue 6: Browser Cache

**Symptoms:**
- Old version of site loading
- Service worker not updating

**Solutions:**
1. **Hard refresh:**
   - Desktop: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Mobile: Long-press refresh button → "Hard Reload"

2. **Clear site data:**
   - Chrome → Settings → Privacy → Clear browsing data
   - Select "Cached images and files"
   - Clear data for your site

3. **Unregister service workers:**
   - DevTools → Application → Service Workers
   - Click **Unregister**
   - Reload page

---

## 🧪 Testing Checklist

Run through this checklist on Android Chrome:

- [ ] Site is on HTTPS (not HTTP)
- [ ] Service worker is active (DevTools → Application → Service Workers)
- [ ] Manifest is accessible (DevTools → Application → Manifest)
- [ ] Icons load successfully (check icon URLs)
- [ ] Console shows: `✅ beforeinstallprompt event fired`
- [ ] User has interacted with site (clicked, scrolled)
- [ ] Site has been open for 30+ seconds
- [ ] Not already installed
- [ ] Browser cache cleared
- [ ] No console errors

---

## 🔧 Quick Fixes to Try

### Fix 1: Force Service Worker Registration

If service worker isn't registering, try this in console:
```javascript
navigator.serviceWorker.register('/sw.js')
  .then(reg => console.log('✅ Registered:', reg))
  .catch(err => console.error('❌ Failed:', err))
```

### Fix 2: Check Installability

Run this in console to check installability:
```javascript
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ Install prompt available!', e);
});
```

### Fix 3: Manual Install Check

Check if browser thinks app is installable:
```javascript
// Check if app is already installed
console.log('Standalone:', window.matchMedia('(display-mode: standalone)').matches);

// Check service worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length);
});

// Check manifest
fetch('/manifest.webmanifest')
  .then(r => r.json())
  .then(m => console.log('Manifest:', m))
  .catch(e => console.error('Manifest error:', e));
```

---

## 📱 Android Chrome Specific Notes

### Engagement Heuristics

Android Chrome uses "engagement heuristics" to determine when to show install prompts:

1. **First visit:** Usually shows mini-infobar (small banner at bottom)
2. **After interaction:** May show full install prompt
3. **After dismissal:** Won't show again for a while (can be days)

### Why "Add to Home Screen" Appears

If you see "Add to Home Screen" instead of "Install":

1. **Browser thinks it's not fully installable** (check diagnostics above)
2. **Engagement heuristics not met** (need more interaction/time)
3. **Already dismissed before** (browser remembers)
4. **Service worker not active** (most common)

---

## 🎯 Next Steps

1. **Open the deployed site on Android Chrome:**
   ```
   https://honesthomesales.github.io/scrub-shop-road-app
   ```

2. **Open Chrome DevTools:**
   - Connect phone via USB debugging, OR
   - Use Chrome DevTools remote debugging

3. **Check console for diagnostic messages:**
   - Look for the `🔍 Checking PWA Installability...` messages
   - Note any warnings or errors

4. **Check Service Worker:**
   - DevTools → Application → Service Workers
   - Should show "activated and running"

5. **Interact with the site:**
   - Click around
   - Use features
   - Wait 30+ seconds

6. **Look for install prompt:**
   - Custom blue banner (from PWARegistration component)
   - Or Chrome's native prompt in address bar

---

## 💡 Pro Tips

- **Use incognito mode** to test fresh (no cache, no dismissed prompts)
- **Wait 30+ seconds** after page load before expecting prompt
- **Interact with the site** - don't just open and wait
- **Check console first** - diagnostics will tell you what's wrong
- **Clear everything** if you've tested before (cache, service workers, site data)

---

## 🆘 Still Not Working?

If after all this the install prompt still doesn't appear:

1. **Share console output** - The diagnostic messages will show what's wrong
2. **Check service worker status** - Is it active?
3. **Verify manifest** - Is it accessible and valid?
4. **Try incognito mode** - Rules out cache/dismissal issues
5. **Wait and interact** - Engagement heuristics need time

The diagnostic code I added will log everything to the console - check those messages first!

