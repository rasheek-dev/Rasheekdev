# MindLedger Lite - Hostinger Deployment Guide

Complete step-by-step guide to deploy MindLedger Lite on Hostinger.

## Prerequisites

- Hostinger account with active hosting plan
- Access to Hostinger Control Panel
- Node.js 16+ installed on your local machine
- Git installed on your local machine

## Deployment Options

### Option 1: Hostinger Node.js Hosting (Recommended)

Best for: Production applications that need dynamic backend support

#### Step 1: Prepare Your Application

1. **Clone the repository locally**
   ```bash
   git clone https://github.com/yourusername/Rasheekdev.git
   cd Rasheekdev
   ```

2. **Build the application**
   ```bash
   npm install
   npm run build
   ```
   This creates a `dist/` folder with production files.

#### Step 2: Set Up Hostinger Node.js App

1. **Log in to Hostinger Control Panel**
   - Go to `hostinger.com` → Login → Control Panel

2. **Navigate to Node.js**
   - Left sidebar → `Apps` or `Deploy` → `Node.js`
   - Click `Create Node.js Application`

3. **Configure the Application**
   - **Application Name**: MindLedger Lite
   - **Domain**: Your domain or subdomain
   - **Port**: 3000 (default)
   - **Node Version**: 18.x or higher

4. **Connect Git Repository**
   - Select "GitHub" as source
   - Authorize Hostinger to access your GitHub account
   - Select repository: `Rasheekdev`
   - Branch: `claude/serene-wright-iue974` (or main)

5. **Set Environment Variables**
   - **KEY**: `NODE_ENV` → **VALUE**: `production`
   - Click "Add" button
   - **KEY**: `PORT` → **VALUE**: `3000`

#### Step 3: Deploy

1. **Save Configuration**
   - Click "Create Application"
   - Hostinger automatically clones the repo

2. **Build Process**
   - Hostinger runs: `npm install`
   - Then: `npm run build`
   - Finally: `npm start`

3. **Access Your App**
   - Visit your domain: `https://yourdomain.com`
   - Or subdomain: `https://mindledger.yourdomain.com`

#### Step 4: Verify Deployment

1. **Check Application Status**
   - Control Panel → Node.js Apps
   - Should show "Running" status

2. **View Logs**
   - Click on your app
   - View "Terminal" or "Logs" tab
   - Check for any error messages

3. **Test the App**
   - Visit your domain
   - Login with: clinician@example.com / password
   - Try adding a client
   - Create a session note

---

### Option 2: Hostinger Shared Hosting (Static Files Only)

Best for: If Node.js hosting is unavailable; limited features

#### Step 1: Build for Static Hosting

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Prepare files**
   - All files needed are in the `dist/` folder
   - No server-side code required

#### Step 2: Upload to Hostinger

1. **Access File Manager**
   - Control Panel → File Manager
   - Navigate to `/public_html`

2. **Create Application Folder**
   - Right-click → Create Folder
   - Name: `mindledger` (or `app`)

3. **Upload Files**
   - Open the `mindledger` folder
   - Upload all contents from `dist/`
   - (Faster: Compress `dist/` → Upload → Extract)

#### Step 3: Configure .htaccess

1. **Create .htaccess File**
   - Right-click → Create New File
   - Name: `.htaccess`

2. **Add Rewrite Rules**
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /mindledger/
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /mindledger/index.html [L]
   </IfModule>
   ```

3. **Save the file**

#### Step 4: Access Your App

- Visit: `https://yourdomain.com/mindledger`
- Login with: clinician@example.com / password

#### Limitation

- Static hosting does NOT support:
  - Backend API calls
  - Real-time data syncing
  - Server-side processing

---

### Option 3: Docker Container (Advanced)

Best for: Maximum control and scalability

#### Step 1: Build Docker Image

1. **Create Docker image**
   ```bash
   docker build -t mindledger-lite .
   docker run -p 3000:3000 mindledger-lite
   ```

2. **Test locally**
   - Visit: `http://localhost:3000`

#### Step 2: Push to Container Registry

1. **Create Hostinger Container Registry**
   - Control Panel → Containers
   - Create new registry

2. **Push image**
   ```bash
   docker tag mindledger-lite yourhostinger/mindledger-lite
   docker push yourhostinger/mindledger-lite
   ```

3. **Deploy from Registry**
   - Control Panel → Containers
   - Deploy image
   - Configure port 3000

---

## Post-Deployment Configuration

### 1. Enable HTTPS

1. **Automatic (Recommended)**
   - Control Panel → SSL Certificates
   - Click "Automate"
   - Hostinger generates free Let's Encrypt certificate

2. **Force HTTPS**
   - Control Panel → Domains
   - Select your domain
   - Enable "Force HTTPS"

### 2. Set Up Email Notifications

If adding email features later:
1. Control Panel → Email
2. Create email account
3. Configure SMTP settings in app

### 3. Backup Your Data

1. **Enable automatic backups**
   - Control Panel → Backups
   - Set daily backup schedule

2. **Manual backup**
   - Before major changes
   - File Manager → Select files → Backup

### 4. Monitor Performance

1. **Check Analytics**
   - Control Panel → Analytics
   - Monitor CPU/RAM usage

2. **Set up alerts**
   - Get notified of high usage or errors

---

## Troubleshooting

### Application Won't Start

**Problem**: Red "Stopped" status

**Solution**:
1. Check logs: Terminal tab in Hostinger
2. Verify Node version: 16+
3. Check environment variables set correctly
4. Rebuild: Click "Redeploy" in app settings

```bash
npm install
npm run build
```

### Port Already in Use

**Problem**: "Port 3000 already in use"

**Solution**:
1. Change port in server.ts:
   ```typescript
   const port = process.env.PORT || 3000;
   ```
2. Set PORT environment variable to different number (3001, 3002, etc.)

### Files Not Updating

**Problem**: Old version showing after push

**Solution**:
1. Clear browser cache: Ctrl+F5
2. Restart Node app: Hostinger Control Panel → Stop → Start
3. Check latest commit deployed: Terminal tab

### 404 Errors on Refresh

**Problem**: Accessing routes directly shows 404

**Solution**:
- Only occurs with shared hosting without .htaccess
- Make sure .htaccess is in correct directory
- Verify rewrite rules are correct
- Check `RewriteBase` path matches your folder

### App Shows Blank Page

**Problem**: White screen, no content

**Solution**:
1. Check browser console: F12 → Console
2. Look for JavaScript errors
3. Verify build completed: `npm run build`
4. Check dist/ folder has index.html

---

## Performance Tips

1. **Enable Gzip Compression**
   - Control Panel → HTTP Headers
   - Enable Gzip

2. **Use CDN for Static Files** (Optional)
   - Cloudflare integration available in Hostinger
   - Speeds up asset delivery

3. **Monitor Memory Usage**
   - Node.js apps use ~50-100MB baseline
   - Each user session uses minimal memory

4. **Database Optimization** (Future)
   - If adding backend database
   - Use indexes on frequently queried fields
   - Enable query caching

---

## Security Checklist

- [x] HTTPS enabled
- [x] Node.js version up to date
- [x] Environment variables set (not in code)
- [x] Regular backups configured
- [ ] Strong admin password set
- [ ] Two-factor authentication enabled
- [ ] Monitor access logs
- [ ] Keep dependencies updated

---

## Support Resources

### Hostinger Help Center
- https://support.hostinger.com
- Search "Node.js" for Node.js specific guides

### Community
- https://www.hostinger.com/community
- Ask questions, get answers from community

### MindLedger Lite GitHub
- Check Issues tab for known problems
- Submit bug reports

---

## Next Steps

1. **Customize the App**
   - Edit colors in `src/index.css`
   - Change clinic name in components
   - Add your logo

2. **Add Data Persistence**
   - Implement Firebase Firestore
   - Or set up PostgreSQL backend
   - Replace localStorage with real database

3. **Enhanced Features**
   - Client portal for assessments
   - Email notifications
   - PDF export of reports
   - Video consultation integration

4. **Healthcare Compliance**
   - Review HIPAA requirements
   - Implement data encryption
   - Set up audit logging
   - Get legal review

---

## Version Info

- **MindLedger Lite**: 1.0.0
- **Node.js**: 16+
- **React**: 19
- **Last Updated**: October 2026

---

For questions or issues, check the README.md or contact support.
