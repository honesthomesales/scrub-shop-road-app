# Deploy to HTTPS (GitHub Pages) - Quick Guide

## ✅ Your Setup

Your app is already configured for GitHub Pages deployment with HTTPS:
- **Repository**: `honesthomesales/scrub-shop-road-app`
- **URL**: `https://honesthomesales.github.io/scrub-shop-road-app`
- **Deploy Script**: Already configured in `package.json`

---

## 🚀 Deployment Steps

### Option 1: Quick Deploy (Recommended)

1. **Build and Deploy in one command:**
   ```powershell
   cd web
   npm run deploy
   ```

   This will:
   - Build your app (`npm run build`)
   - Deploy to GitHub Pages (`gh-pages -d dist`)
   - Automatically use HTTPS

2. **Wait for deployment** (usually 1-2 minutes)

3. **Access your app** at:
   ```
   https://honesthomesales.github.io/scrub-shop-road-app
   ```

---

### Option 2: Manual Steps

1. **Build the app:**
   ```powershell
   cd web
   npm run build
   ```

2. **Deploy to GitHub Pages:**
   ```powershell
   npx gh-pages -d dist
   ```

---

## ✅ Verify HTTPS Deployment

After deployment, check:

1. **Visit your app URL:**
   ```
   https://honesthomesales.github.io/scrub-shop-road-app
   ```

2. **Check for HTTPS:**
   - Look for 🔒 lock icon in browser address bar
   - URL should start with `https://`

3. **Test PWA Install:**
   - Open on Android Chrome
   - Check console for: `✅ beforeinstallprompt event fired`
   - Install prompt should appear

---

## 🔧 GitHub Pages Configuration

If deployment doesn't work, verify GitHub Pages settings:

1. Go to: `https://github.com/honesthomesales/scrub-shop-road-app/settings/pages`

2. **Source**: Should be set to:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`

3. **Custom domain** (if you have one):
   - Add your domain
   - Enable "Enforce HTTPS" checkbox

---

## 📱 Testing PWA on Android

After deployment to HTTPS:

1. **Open on Android Chrome:**
   ```
   https://honesthomesales.github.io/scrub-shop-road-app
   ```

2. **Check Service Worker:**
   - Chrome DevTools → Application → Service Workers
   - Should show: "activated and running"

3. **Check Install Prompt:**
   - Look for custom install banner (blue banner at bottom)
   - Or native Chrome install prompt in address bar
   - Console should show: `✅ beforeinstallprompt event fired`

4. **Install the app:**
   - Tap "Install" button
   - App will be added to home screen
   - Opens in standalone mode (no browser UI)

---

## 🐛 Troubleshooting

### Issue: "404 Not Found" after deployment

**Solution:**
- Check that `vite.config.js` has `base: ''` (empty string for root)
- Verify GitHub Pages is serving from `gh-pages` branch
- Wait a few minutes for GitHub to update

### Issue: Install prompt doesn't appear

**Check:**
1. ✅ App is on HTTPS (not HTTP)
2. ✅ Service worker is active (DevTools → Application → Service Workers)
3. ✅ Manifest is accessible: `https://honesthomesales.github.io/scrub-shop-road-app/manifest.webmanifest`
4. ✅ Console shows: `✅ beforeinstallprompt event fired`

**If still not working:**
- Clear browser cache
- Unregister old service workers
- Try incognito mode
- Check console for errors

### Issue: Service worker not registering

**Solution:**
- Make sure you're on HTTPS (not HTTP)
- Check that `dist/sw.js` exists after build
- Verify `registerSW.js` is in the HTML
- Clear browser cache and reload

---

## 🔄 Update Deployment

To update your deployed app:

1. **Make your changes**

2. **Deploy again:**
   ```powershell
   cd web
   npm run deploy
   ```

3. **Wait 1-2 minutes** for GitHub Pages to update

---

## 📝 Notes

- **HTTPS is automatic** - GitHub Pages provides free SSL certificate
- **Deployment is instant** - Changes appear within 1-2 minutes
- **No configuration needed** - Just run `npm run deploy`
- **PWA works automatically** - Service worker and manifest are included

---

## ✅ Success Checklist

After deployment, verify:

- [ ] App loads at HTTPS URL
- [ ] 🔒 Lock icon shows in browser
- [ ] Service worker is active (DevTools)
- [ ] Manifest is accessible
- [ ] Install prompt appears on Android Chrome
- [ ] App installs successfully
- [ ] App opens in standalone mode

---

**Your app URL:**
```
https://honesthomesales.github.io/scrub-shop-road-app
```

**Ready to deploy?** Just run:
```powershell
cd web
npm run deploy
```

