# 📦 HOSTINGER UPLOAD - COMPLETE VISUAL GUIDE

## 📍 WHERE ARE YOUR FILES?

```
GitHub Repository: https://github.com/rasheek-dev/Rasheekdev
Branch: claude/gracious-clarke-rag71k
```

---

## 🎯 13 EASY STEPS TO UPLOAD

### STEP 1: Download Files from GitHub
```
GitHub → Code (green button) → Download ZIP
↓
Extract ZIP to your computer
```

### STEP 2-3: Login to Hostinger & Open File Manager
```
hostinger.com → Login → Dashboard
↓
Hosting → Manage → File Manager
```

### STEP 4: Navigate to public_html
```
File Manager opens
↓
Click: public_html folder
↓
This is your website root
```

### STEP 5-6: Upload & Extract ZIP
```
In public_html:
- Click Upload button
- Select your ZIP file
- Right-click → Extract
- Delete ZIP file
↓
All files now in correct location!
```

### STEP 7: Edit Configuration Files
```
/config/Database.php
├── db_name = 'mentra_booking'
├── db_user = 'mentra_user'
└── db_pass = 'YourPassword'

/config/Config.php
├── APP_URL = 'https://yourdomain.com'
├── Razorpay keys (if you have them)
└── Business email & phone
```

### STEP 8: Create MySQL Database
```
Hostinger Dashboard → Databases → MySQL Databases
↓
Create Database: mentra_booking
Create User: mentra_user (with password)
Add User to Database
```

### STEP 9: Import Database Schema
```
Hostinger → Databases → phpMyAdmin
↓
Select database: mentra_booking
Click: Import tab
Upload: database/schema.sql
Click: Import
↓
✅ All 8 tables created!
```

### STEP 10: Create Admin User
```
Create file: hash.php
↓
<?php
echo password_hash('your_password', PASSWORD_DEFAULT);
?>
↓
Upload to public_html
Visit: yourdomain.com/hash.php
Copy the hash
↓
phpMyAdmin → admin_users → Insert
Username: admin
Email: your@email.com
Password Hash: [paste hash]
↓
Delete hash.php
```

### STEP 11: Test Backend
```
Visit: https://yourdomain.com/api/psychologists
↓
Should see: {"success":true,"data":[]}
↓
✅ Backend working!

Visit: https://yourdomain.com/admin/login.php
Login with: admin / your_password
↓
✅ Admin panel working!
```

### STEP 12-13: Create Directories & Verify
```
Create folders in public_html:
- logs/
- uploads/
↓
Verify checklist (see below)
↓
✅ DONE! Ready to use!
```

---

## 📁 FILE STRUCTURE (What Gets Uploaded)

```
📦 public_html/
│
├── 📁 config/
│   ├── Config.php              ← EDIT FIRST!
│   └── Database.php            ← EDIT FIRST!
│
├── 📁 database/
│   └── schema.sql              ← Import to MySQL
│
├── 📁 api/
│   └── index.php               ← REST API endpoints
│
├── 📁 includes/
│   ├── Psychologist.php        ← Manage therapists
│   ├── Booking.php             ← Manage bookings
│   ├── Payment.php             ← Razorpay integration
│   ├── Email.php               ← Email notifications
│   └── GoogleMeet.php          ← Meet link generation
│
├── 📁 admin/                   ← Admin Panel
│   ├── login.php               ← https://yourdomain.com/admin/login.php
│   ├── dashboard.php           ← Main dashboard
│   ├── psychologists.php       ← Manage therapists
│   ├── bookings.php            ← View bookings
│   ├── appointments.php        ← Create appointments
│   ├── settings.php            ← Settings
│   └── logout.php              ← Logout
│
├── 📁 logs/                    ← Error logs (auto-create)
├── 📁 uploads/                 ← Photos (auto-create)
│
├── .htaccess                   ← URL rewriting
├── README.md                   ← Project overview
├── INSTALLATION.md             ← Setup guide
├── QUICK-START.md              ← Quick reference
├── ADMIN-GUIDE.md              ← Admin manual
└── HOSTINGER-UPLOAD-GUIDE.md   ← This guide!
```

---

## 🔑 CRITICAL CHANGES TO MAKE

### 1️⃣ Edit /config/Database.php
```php
Line 7:  private $db_name = 'mentra_booking';
Line 8:  private $db_user = 'mentra_user';
Line 9:  private $db_pass = 'YOUR_PASSWORD';
```

### 2️⃣ Edit /config/Config.php
```php
Line 7:  define('APP_URL', 'https://yourdomain.com');
Line 11: define('DB_NAME', 'mentra_booking');
Line 12: define('DB_USER', 'mentra_user');
Line 13: define('DB_PASS', 'YOUR_PASSWORD');
Line 16: define('RAZORPAY_KEY_ID', 'rzp_test_...');
Line 17: define('RAZORPAY_KEY_SECRET', '...');
```

---

## ✅ VERIFICATION CHECKLIST

After uploading everything:

```
☐ Logged into Hostinger
☐ Downloaded files from GitHub
☐ Extracted ZIP file
☐ Uploaded to public_html
☐ Verified folder structure
☐ Edited Database.php with correct credentials
☐ Edited Config.php with domain & keys
☐ Created MySQL database: mentra_booking
☐ Created database user: mentra_user
☐ Added user to database
☐ Imported schema.sql
☐ Created admin user in database
☐ Created logs folder
☐ Created uploads folder
☐ Tested API: yourdomain.com/api/psychologists
☐ Tested Admin: yourdomain.com/admin/login.php
☐ Admin login works with credentials
```

All ☐ checked? **YOU'RE READY TO GO! 🚀**

---

## 🧪 QUICK TESTS

### Test 1: Backend Working?
```
Visit: https://yourdomain.com/api/psychologists

Expected Result:
{"success":true,"data":[]}

✅ If you see this → Backend is working!
❌ If error → Check Database.php configuration
```

### Test 2: Admin Panel Working?
```
Visit: https://yourdomain.com/admin/login.php

Expected Result:
Beautiful login page appears

✅ If page loads → Admin files uploaded correctly!
❌ If 404 error → Check /admin folder exists
```

### Test 3: Admin Login Working?
```
Username: admin
Password: (whatever you set)

Expected Result:
Admin dashboard shows statistics

✅ If dashboard loads → Database connected!
❌ If "Invalid password" → Check admin user in database
```

---

## 📞 HELP & DOCUMENTATION

| Need Help With | File to Read |
|---|---|
| Uploading files to Hostinger | **HOSTINGER-UPLOAD-GUIDE.md** ← You are here! |
| Complete setup instructions | **INSTALLATION.md** |
| Using the admin panel | **ADMIN-GUIDE.md** |
| API quick reference | **QUICK-START.md** |
| Project overview | **README.md** |

---

## 🎯 NEXT STEPS AFTER UPLOAD

1. ✅ Add first psychologist in admin panel
2. ✅ Create test booking
3. ✅ Check confirmation email with Google Meet link
4. ✅ Get Razorpay keys (if not done yet)
5. ✅ Update Razorpay keys in Config.php
6. ✅ Test payment with Razorpay test mode
7. ✅ Go live!

---

## 💡 PRO TIPS

- **Backup Database Regularly** - Export from phpMyAdmin weekly
- **Check Logs** - If something breaks, check /logs/error.log
- **Monitor Storage** - Keep 20% free space on Hostinger
- **Test Emails** - Make sure confirmation emails send correctly
- **Save Credentials** - Keep username/password safe somewhere

---

## ⚠️ COMMON MISTAKES

❌ **WRONG:** Upload files to wrong folder
✅ **RIGHT:** Upload to public_html/

❌ **WRONG:** Forget to edit Config.php
✅ **RIGHT:** Update domain and database credentials

❌ **WRONG:** Forget to import schema.sql
✅ **RIGHT:** Import it to create all tables

❌ **WRONG:** Use same password for everything
✅ **RIGHT:** Use strong unique passwords

---

## 🎉 YOU'RE READY!

Everything is set up. Your Mentra booking backend is:
- ✅ Uploaded to Hostinger
- ✅ Database configured
- ✅ Admin panel accessible
- ✅ API working
- ✅ Google Meet integrated
- ✅ Ready for bookings!

**Go add psychologists and start taking bookings!** 🚀

