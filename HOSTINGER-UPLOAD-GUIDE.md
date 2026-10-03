# 🚀 Complete Hostinger Upload Guide - Step by Step

## 📍 Where Are Your Files Located?

Your files are on GitHub in the branch: **`claude/gracious-clarke-rag71k`**

**Repository:** https://github.com/rasheek-dev/Rasheekdev

### Files You Need to Upload:

```
/config/
  ├── Config.php
  └── Database.php

/database/
  └── schema.sql

/api/
  └── index.php

/includes/
  ├── Psychologist.php
  ├── Booking.php
  ├── Payment.php
  ├── Email.php
  └── GoogleMeet.php

/admin/
  ├── login.php
  ├── dashboard.php
  ├── psychologists.php
  ├── bookings.php
  ├── appointments.php
  ├── settings.php
  └── logout.php

/.htaccess
/README.md
/INSTALLATION.md
/QUICK-START.md
/ADMIN-GUIDE.md
```

---

## ⬇️ STEP 1: Download Files from GitHub

### Option A: Download as ZIP (Easiest)

1. Go to: https://github.com/rasheek-dev/Rasheekdev
2. Click **"Code"** button (green) at top
3. Select **"Download ZIP"**
4. Wait for download to complete
5. **Extract the ZIP file** to your computer

### Option B: Clone Repository (Advanced)

```bash
git clone https://github.com/rasheek-dev/Rasheekdev.git
cd Rasheekdev
git checkout claude/gracious-clarke-rag71k
```

---

## 🌐 STEP 2: Log in to Hostinger

### Access Hostinger Control Panel:

1. **Visit:** https://www.hostinger.com/
2. **Click:** "Login" (top right)
3. **Enter:** Your email & password
4. **Click:** "Sign In"

You should see your Hostinger dashboard.

---

## 📁 STEP 3: Open File Manager

### Two Ways to Access File Manager:

#### Method 1: Via Hosting Dashboard
```
1. Click "Hosting" in left menu
2. Click "Manage" on your website
3. Scroll down to "File Manager"
4. Click "File Manager" button
```

#### Method 2: Via cPanel (Direct)
```
1. Click "Hosting" → "Manage"
2. Look for "cPanel" or "Control Panel" link
3. Click to open cPanel
4. Find "File Manager" icon
5. Click it
```

**Your File Manager should now be open in a new window.**

---

## 🎯 STEP 4: Navigate to public_html Folder

### Inside File Manager:

1. **Left sidebar** should show folder list
2. **Find:** `public_html` folder
3. **Click:** `public_html` to open it

```
Expected location:
/home/username/public_html/
```

**This is where your website files live.**

---

## 📤 STEP 5: Upload Backend Files

### Method A: Upload Zip File (Fastest - Recommended)

**BEST APPROACH:**

1. In GitHub, download entire project as ZIP
2. In Hostinger File Manager (in public_html):
   - Look for **"Upload"** button
   - Click **"Choose File"**
   - Select the ZIP file you downloaded
   - Wait for upload to complete
3. **Right-click** on the ZIP
4. Select **"Extract"** or **"Decompress"**
5. Delete the ZIP file

**Result:** All files in public_html

---

### Method B: Manual Upload (Folder by Folder)

**If you prefer uploading folders individually:**

#### Upload /config folder:
```
1. Click "Create Folder" → Name: "config"
2. Open the config folder
3. Upload: Config.php and Database.php
4. Check: Both files are there
```

#### Upload /database folder:
```
1. Go back to public_html
2. Click "Create Folder" → Name: "database"
3. Open the database folder
4. Upload: schema.sql
5. Check: File is there
```

#### Upload /api folder:
```
1. Go back to public_html
2. Click "Create Folder" → Name: "api"
3. Open the api folder
4. Upload: index.php
```

#### Upload /includes folder:
```
1. Go back to public_html
2. Click "Create Folder" → Name: "includes"
3. Open the includes folder
4. Upload these files:
   - Psychologist.php
   - Booking.php
   - Payment.php
   - Email.php
   - GoogleMeet.php
```

#### Upload /admin folder:
```
1. Go back to public_html
2. Click "Create Folder" → Name: "admin"
3. Open the admin folder
4. Upload these files:
   - login.php
   - dashboard.php
   - psychologists.php
   - bookings.php
   - appointments.php
   - settings.php
   - logout.php
```

#### Upload Root Files:
```
Go back to public_html and upload:
- .htaccess
- README.md
- INSTALLATION.md
- QUICK-START.md
- ADMIN-GUIDE.md
```

---

## ✅ STEP 6: Verify File Structure

### After Upload, Your Structure Should Look Like:

```
📁 public_html/
├── 📁 config/
│   ├── Config.php
│   └── Database.php
├── 📁 database/
│   └── schema.sql
├── 📁 api/
│   └── index.php
├── 📁 includes/
│   ├── Psychologist.php
│   ├── Booking.php
│   ├── Payment.php
│   ├── Email.php
│   └── GoogleMeet.php
├── 📁 admin/
│   ├── login.php
│   ├── dashboard.php
│   ├── psychologists.php
│   ├── bookings.php
│   ├── appointments.php
│   ├── settings.php
│   └── logout.php
├── 📁 logs/
├── .htaccess
├── README.md
├── INSTALLATION.md
├── QUICK-START.md
└── ADMIN-GUIDE.md
```

### To Verify in Hostinger File Manager:
1. Click refresh button (browser)
2. Check each folder exists
3. Click into folders to see files
4. Confirm all files are present

---

## 🔧 STEP 7: Edit Configuration Files

### Update Database Configuration:

1. **In File Manager**, open `/config/` folder
2. **Right-click** on `Database.php`
3. Select **"Edit"** (or "Code Editor")
4. **Find these lines:**
```php
private $db_name = 'YOUR_DATABASE_NAME';
private $db_user = 'YOUR_DATABASE_USER';
private $db_pass = 'YOUR_DATABASE_PASSWORD';
```

5. **Replace with YOUR values:**
```php
private $db_name = 'mentra_booking';      // From Step 8
private $db_user = 'mentra_user';          // From Step 8
private $db_pass = 'YourActualPassword';   // From Step 8
private $host = 'localhost';               // Usually localhost on Hostinger
```

6. Click **"Save"** button
7. Close editor

### Update Main Configuration:

1. **Right-click** on `Config.php`
2. Select **"Edit"**
3. **Find and update:**
```php
define('APP_URL', 'https://yourdomain.com');  // Your domain

define('DB_NAME', 'mentra_booking');
define('DB_USER', 'mentra_user');
define('DB_PASS', 'YourPassword');

define('RAZORPAY_KEY_ID', 'rzp_test_...');
define('RAZORPAY_KEY_SECRET', 'your_secret');

define('BUSINESS_PHONE', '+91-XXXXXXXXX');
define('BUSINESS_EMAIL', 'admin@yourdomain.com');
```

4. Click **"Save"**

---

## 📊 STEP 8: Create MySQL Database

### Access MySQL via cPanel:

1. **Go back to Hostinger**
2. Click **"Databases"** in left menu
3. Click **"MySQL Databases"**

### Create Database:

1. **Database Name:** `mentra_booking`
2. Click **"Create"**

### Create Database User:

1. **Go to "MySQL Users"** section
2. Click **"Create User"**
3. **Username:** `mentra_user`
4. **Password:** Generate strong password (copy it!)
5. Click **"Create"**

### Add User to Database:

1. **Find "Add User to Database"** section
2. **Select User:** mentra_user
3. **Select Database:** mentra_booking
4. Click **"Add"**
5. **Check all privileges** (if asked)
6. Click **"Confirm"**

**✅ Database is ready!**

---

## 🗄️ STEP 9: Import Database Schema

### Via phpMyAdmin:

1. **In Hostinger Dashboard:**
   - Click **"Databases"**
   - Click **"phpMyAdmin"**
2. **Left sidebar**, select your database: `mentra_booking`
3. Click **"Import"** tab (top)
4. Click **"Choose File"**
5. **Select:** `database/schema.sql` from your computer
6. Click **"Import"** button
7. **Wait** for completion (should show "Successful")

**✅ All tables created!**

---

## 👤 STEP 10: Create Admin User

### Via phpMyAdmin:

1. In phpMyAdmin, select `mentra_booking` database
2. **Left sidebar** → Find `admin_users` table
3. Click on it
4. Click **"Insert"** tab
5. **Fill in:**
   - username: `admin`
   - email: `your@email.com`
   - full_name: Your Name
   - password_hash: **[See below]**

### Generate Password Hash:

**Create a file `hash.php` in public_html:**

```php
<?php
echo password_hash('your_password', PASSWORD_DEFAULT);
?>
```

1. Upload `hash.php` to public_html
2. Visit: `https://yourdomain.com/hash.php`
3. Copy the long hash that appears
4. Paste it in phpMyAdmin `password_hash` field
5. Delete `hash.php` file from Hostinger

6. Click **"Go"** to insert

**✅ Admin user created!**

---

## 🧪 STEP 11: Test Your Backend

### Test if Backend Works:

1. **Open browser**
2. **Visit:** `https://yourdomain.com/api/psychologists`
3. **You should see:**
```json
{"success":true,"data":[]}
```

✅ **If you see this, backend is working!**

### Test Admin Login:

1. **Visit:** `https://yourdomain.com/admin/login.php`
2. **Username:** admin
3. **Password:** (whatever you set)
4. **Click:** Login
5. **Should see:** Admin Dashboard

✅ **If dashboard loads, everything is connected!**

---

## 📱 STEP 12: Create .htaccess File (If Missing)

### In File Manager (public_html):

1. Click **"Create File"**
2. **Name:** `.htaccess` (starts with dot)
3. Open it and paste:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^([^\.]+)$ $1.html [NC, L]
    
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^api/(.*)$ api/index.php?request=$1 [QSA, L]
    
    RewriteRule ^(config|includes|database)/ - [F]
</IfModule>
```

4. Click **"Save"**

---

## 🎯 STEP 13: Create directories

### Create logs directory:

1. In public_html
2. Click **"Create Folder"**
3. **Name:** `logs`
4. Click **"Create"**

### Create uploads directory:

1. In public_html
2. Click **"Create Folder"**
3. **Name:** `uploads`
4. Click **"Create"**

---

## ✅ Verification Checklist

After completing all steps, verify:

```
☐ All folders created (config, database, api, includes, admin, logs, uploads)
☐ All PHP files uploaded
☐ .htaccess uploaded
☐ Documentation files uploaded
☐ Database created: mentra_booking
☐ Database user created: mentra_user
☐ Admin user created: admin
☐ Database schema imported
☐ Config.php updated with database details
☐ Config.php updated with domain name
☐ Config.php updated with Razorpay keys (if you have them)
☐ API endpoint works: https://yourdomain.com/api/psychologists
☐ Admin login works: https://yourdomain.com/admin/login.php
☐ No error in logs
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to database" | Check Database.php - verify username, password, database name |
| "404 Not Found" on API | Check .htaccess file - make sure it's uploaded |
| Admin page blank | Check if all files in /admin/ folder are uploaded |
| "Permission Denied" | Right-click folder → Edit Permissions → Set to 755 |
| Files not uploading | Try uploading via ZIP instead of individual files |
| Can't find File Manager | Go to Hosting > Manage > scroll down for File Manager |

---

## 📞 Quick Reference

**Hostinger Dashboard:** https://www.hostinger.com/login
**Your Website:** https://yourdomain.com
**Admin Panel:** https://yourdomain.com/admin/login.php
**API Test:** https://yourdomain.com/api/psychologists
**Database:** phpMyAdmin via Hosting Dashboard > Databases

---

## 🎉 You're Done!

Once all steps are complete:

1. ✅ Backend is live on Hostinger
2. ✅ Admin panel is accessible
3. ✅ Database is set up
4. ✅ API is working
5. ✅ Ready for psychologist management
6. ✅ Ready for bookings

**Next: Add psychologists and start taking bookings!**

For detailed instructions, see:
- INSTALLATION.md - Full setup guide
- ADMIN-GUIDE.md - How to use admin panel
- QUICK-START.md - API quick reference

---

**Questions? Check INSTALLATION.md or ADMIN-GUIDE.md for more details.**

🚀 **Your Mentra backend is now live on Hostinger!**

