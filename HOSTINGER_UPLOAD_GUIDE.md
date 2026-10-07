# Hostinger Upload Guide - MindLedger Lite (Slug Deployment)

## Setup
Your app will be accessible at: `https://yourdomain.com/mindledger/`

## Files to Upload

### Step 1: Create Folder Structure
1. Log in to Hostinger Control Panel → File Manager
2. Navigate to `/public_html`
3. Create folder: `mindledger`

### Step 2: Upload Build Files
Navigate into `/public_html/mindledger/` and upload these files from `dist/`:

```
dist/
├── index.html           (REQUIRED)
├── .htaccess            (REQUIRED - place in /public_html/mindledger/)
└── assets/
    ├── index-*.css      (All CSS files)
    └── index-*.js       (All JS files)
```

**Quick Upload Method:**
1. From your local machine, run:
   ```bash
   npm run build
   ```

2. Create zip file containing only dist contents:
   ```bash
   cd dist && zip -r ../mindledger-dist.zip . && cd ..
   ```

3. In Hostinger File Manager:
   - Navigate to `/public_html/mindledger/`
   - Upload `mindledger-dist.zip`
   - Right-click → Extract
   - Delete the zip file

### Step 3: Upload .htaccess
1. The `.htaccess` file is needed for client-side routing
2. In Hostinger File Manager at `/public_html/mindledger/`:
   - Right-click → Create New File
   - Name: `.htaccess`
   - Paste contents from `public/.htaccess`
   - Save

### Step 4: Configure Environment (Optional)
If using backend API at different URL than localhost:

1. In Hostinger File Manager:
   - Navigate to `/public_html/mindledger/`
   - Check if `index.html` has correct API references
   - The app uses `VITE_API_URL` environment variable
   - Default: `http://localhost:3000/api`

### Step 5: Test
1. Visit `https://yourdomain.com/mindledger/`
2. You should see the MindLedger Lite login page
3. Test login and navigation

## File Sizes (Reference)
- index.html: ~0.5 KB
- index-*.css: ~5-6 KB
- index-*.js: ~250-300 KB (gzipped ~80 KB)
- .htaccess: <1 KB

**Total: ~300 KB**

## Troubleshooting

### 404 Errors on Route Refresh
- Ensure `.htaccess` is in `/public_html/mindledger/`
- Check file permissions (should be readable)
- Verify `RewriteBase /mindledger/` matches your folder

### Blank White Page
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify all assets loaded (check Network tab)
4. Ensure `index.html` is in correct folder

### API Connection Failed
1. Update `VITE_API_URL` in index.html if needed
2. Check network tab to see actual API call URLs
3. Verify backend server is running and accessible

## File Checklist
- [ ] Created `/public_html/mindledger/` folder
- [ ] Uploaded all files from `dist/`
- [ ] Uploaded `.htaccess` file
- [ ] Tested at `yourdomain.com/mindledger/`
- [ ] Login works
- [ ] Navigation works without 404 errors

## Updating the App
To update the app later:

1. Make changes locally
2. Run `npm run build`
3. Create new zip: `cd dist && zip -r ../mindledger-dist-new.zip . && cd ..`
4. Upload zip to `/public_html/mindledger/`
5. Extract and overwrite files
6. Delete old zip

---

**Need different slug?** Change:
- Folder name from `mindledger` to your slug
- `RewriteBase` in `.htaccess` to `/yourslug/`
- Build with: `VITE_BASE_PATH=/yourslug/ npm run build`
