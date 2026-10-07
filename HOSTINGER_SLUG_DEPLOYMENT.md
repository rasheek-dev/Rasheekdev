# MindLedger Lite - Hostinger Slug Deployment

Deploy MindLedger Lite to your Hostinger shared hosting as a subdirectory slug.

## 🎯 Quick Start

Your app will be accessible at: **`https://yourdomain.com/mindledger/`**

### Option A: Automated Upload (Recommended)

#### On macOS/Linux:
```bash
./prepare-hostinger-upload.sh
```

#### On Windows:
```bash
prepare-hostinger-upload.bat
```

This creates `mindledger-hostinger-upload.zip` with all necessary files.

### Option B: Manual Upload

1. **Build the app locally:**
   ```bash
   npm run build
   ```

2. **Files to upload to Hostinger** (from `dist/` folder):
   - `index.html`
   - `assets/` folder (all CSS and JS files)
   - `.htaccess` (from `public/` folder)

## 📋 Step-by-Step Hostinger Setup

### Step 1: Create Folder
1. Log in to [Hostinger Control Panel](https://hpanel.hostinger.com)
2. Click **File Manager**
3. Navigate to `/public_html`
4. Right-click → **Create Folder**
5. Name it: `mindledger`

### Step 2: Upload Files

#### Using Upload Package (Fastest):
1. Upload `mindledger-hostinger-upload.zip` to `/public_html/`
2. Right-click the zip → **Extract**
3. You'll see a `mindledger` folder created
4. Delete the zip file

#### Manual Upload:
1. Open `/public_html/mindledger/`
2. Upload all files from `dist/`:
   - `index.html` (upload directly)
   - `assets/` folder with all contents
3. Upload `.htaccess` from `public/` folder

### Step 3: Verify .htaccess
The `.htaccess` file is crucial for client-side routing:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /mindledger/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [QSA,L]
</IfModule>
```

If `.htaccess` is missing:
1. In File Manager, show hidden files (icon in toolbar)
2. Right-click → **Create New File**
3. Name: `.htaccess`
4. Paste the content above
5. Save

### Step 4: Access Your App
Visit: **`https://yourdomain.com/mindledger/`**

You should see the login page immediately.

## 🔑 Login Credentials

By default:
- **Email:** `clinician@example.com`
- **Password:** `password`

These are demo credentials. Configure your backend API for production users.

## ⚙️ Configuration

### Change the Slug
To use a different slug (e.g., `/app/` instead of `/mindledger/`):

1. Rename folder from `mindledger` to `app` in File Manager
2. Update `.htaccess`:
   ```apache
   RewriteBase /app/
   ```
3. Rebuild locally:
   ```bash
   VITE_BASE_PATH=/app/ npm run build
   ```
4. Upload new files

### Connect to Backend API
The app communicates with a backend API. By default it uses localhost.

To connect to your Mentra backend:
1. Edit `src/api/client.ts` and change:
   ```typescript
   const API_URL = process.env.VITE_API_URL || 'https://your-api.com/api';
   ```
2. Rebuild: `npm run build`
3. Upload new files to Hostinger

## 📦 File Structure After Upload

```
/public_html/
├── mindledger/
│   ├── index.html
│   ├── .htaccess
│   └── assets/
│       ├── index-xxxxxx.css
│       └── index-xxxxxx.js
└── [other existing files]
```

## 🧪 Testing

### Test the App:
1. Visit `https://yourdomain.com/mindledger/`
2. You should see the login page
3. Enter demo credentials
4. Click "Clients" - should show empty list
5. Navigate to Reports
6. Try adding a new client
7. Check if data persists

### Test Routing:
1. From dashboard, go to a page (e.g., Clients)
2. Refresh the page (F5)
3. Should stay on Clients page (not show 404)

If you get 404 on refresh:
- Check `.htaccess` exists in `/public_html/mindledger/`
- Verify `RewriteBase /mindledger/` matches your folder name
- Check mod_rewrite is enabled (usually default on Hostinger)

## 🆘 Troubleshooting

### Problem: Blank White Page
**Solution:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab - look for failed requests
4. Ensure all assets loaded (CSS, JS files)
5. Verify `index.html` contains correct `<div id="root">`

### Problem: 404 on Route Refresh
**Solution:**
1. Ensure `.htaccess` exists: `/public_html/mindledger/.htaccess`
2. Check file permissions (should be readable)
3. Verify `RewriteBase` matches your folder:
   ```apache
   RewriteBase /mindledger/
   ```
4. Try clearing browser cache (Ctrl+Shift+Delete)

### Problem: API Errors
**Solution:**
1. Check Network tab in DevTools
2. See what URL the API is calling
3. Verify backend server is running
4. Check CORS headers if calling external API
5. Update `VITE_API_URL` if needed

### Problem: Assets Not Loading
**Solution:**
1. Check if `assets/` folder is in `/public_html/mindledger/`
2. Files should be: `index-[hash].css` and `index-[hash].js`
3. Verify they're not in subdirectories
4. Rebuild and re-upload if names changed

## 🔄 Updating the App

To update after making changes:

1. Make changes locally
2. Run: `npm run build`
3. On Windows: `prepare-hostinger-upload.bat`
4. On Mac/Linux: `./prepare-hostinger-upload.sh`
5. Upload new `mindledger-hostinger-upload.zip` to Hostinger
6. Extract and overwrite files
7. Clear browser cache and refresh

## 📊 File Sizes

- `index.html`: ~0.5 KB
- `index-*.css`: ~6 KB
- `index-*.js`: ~270 KB (uncompressed)
- `.htaccess`: <1 KB

**Total: ~300 KB** (very small, fast loading)

## 🔒 Security Checklist

- [ ] Changed default credentials in backend
- [ ] Enabled HTTPS (automatic on Hostinger)
- [ ] Backed up database
- [ ] Configured CORS headers if needed
- [ ] Set up HIPAA compliance (if healthcare)
- [ ] Removed debug console logs
- [ ] Tested with real data

## 📞 Support

### Hostinger Help
- [File Manager Guide](https://support.hostinger.com/en/articles/360002151754)
- [htaccess Guide](https://support.hostinger.com/en/articles/360001278968)

### Common Hostinger Issues
- Contact Hostinger support to enable mod_rewrite if needed
- They usually have it enabled by default
- Request help uploading if you're unsure

## 🚀 Next Steps

1. ✅ Deploy to Hostinger (this guide)
2. Configure backend API connection
3. Add real users and data
4. Set up SSL certificate (auto on Hostinger)
5. Configure email notifications (optional)
6. Monitor performance and usage

---

**Need help?** Check the troubleshooting section or review the files in `dist/` to ensure they were built correctly.
