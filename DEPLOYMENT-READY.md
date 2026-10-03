# 🚀 MENTRA BOOKING SYSTEM - READY TO DEPLOY

## ✅ YOUR COMPLETE SYSTEM IS READY

You now have a **production-ready psychology booking platform** with:
- **Full-featured website** with frontend
- **Complete PHP + MySQL backend** with REST API
- **Admin panel** for managing psychologists and bookings
- **Payment processing** via Razorpay
- **Google Meet integration** for video sessions
- **Email notifications** with confirmation links

---

## 📦 WHAT'S INCLUDED (All Files on GitHub)

Repository: **https://github.com/rasheek-dev/Rasheekdev**
Branch: **claude/gracious-clarke-rag71k**

### Frontend (Website Files) ✅
```
📁 Root files:
  ├── index.html                      Homepage
  ├── config.js                       ⭐ UPDATE THIS: API endpoint, contact info
  ├── mentra-api.js                   NEW: Connects frontend to backend API
  ├── site.js, site.css              Styling & behavior
  ├── footer.js, footer.css
  ├── psychologists.js                Backup psychologist data
  
📁 Pages:
  ├── book/index.html                 Booking interface
  ├── psychologists/index.html        Psychologist directory
  ├── find-a-psychologist/            Screening questionnaire
  ├── services/index.html             Services page
  ├── about/index.html                About page
  ├── contact.html                    Contact page
  ├── privacy.html, terms.html,       Legal pages
  └── refund-policy.html
  
📁 Assets:
  └── assets/                         Logos, images, icons
  
📁 Config files:
  ├── .htaccess                       URL rewriting
  ├── robots.txt                      SEO
  └── sitemap.xml                     SEO sitemap
```

### Backend (PHP + MySQL) ✅
```
📁 Configuration:
  ├── config/Database.php             ⭐ UPDATE: DB credentials
  └── config/Config.php               ⭐ UPDATE: Domain, Razorpay keys
  
📁 Database:
  └── database/schema.sql             Creates 8 tables (import this!)
  
📁 API:
  └── api/index.php                   REST API endpoints
  
📁 Business Logic:
  └── includes/
      ├── Psychologist.php            Psychologist management
      ├── Booking.php                 Booking creation & management
      ├── Payment.php                 Razorpay integration
      ├── Email.php                   Email notifications
      └── GoogleMeet.php              Meet link generation
  
📁 Admin Panel:
  └── admin/
      ├── login.php                   Admin login
      ├── dashboard.php               Statistics & overview
      ├── psychologists.php           Add/edit/delete therapists
      ├── bookings.php                View all bookings
      ├── appointments.php            Create manual appointments
      ├── settings.php                Configure Razorpay & settings
      └── logout.php                  Logout
```

### Documentation ✅
```
📄 DEPLOYMENT-READY.md               ← This file (quick start)
📄 FRONTEND-INTEGRATION.md           How frontend + backend work together
📄 HOSTINGER-UPLOAD-GUIDE.md        Step-by-step upload instructions
📄 INSTALLATION.md                   Technical setup details
📄 ADMIN-GUIDE.md                   How to use admin panel
📄 QUICK-START.md                   API reference
📄 README.md                         Project overview
```

---

## 🎯 DEPLOYMENT IN 4 STEPS

### Step 1: Download Files
```
Go to: https://github.com/rasheek-dev/Rasheekdev
Click: Code → Download ZIP
Extract on your computer
```

### Step 2: Update Configuration

**File: `config.js`** (frontend configuration)
```javascript
// Change this line:
BOOKING_API_URL: "https://yourdomain.com/api"

// Change these too:
CONTACT_EMAIL: "your@email.com"
CONTACT_PHONE: "+91-9876543210"
SHOW_TEAM: true
```

**File: `/config/Database.php`** (backend database)
```php
private $db_name = 'mentra_booking';
private $db_user = 'mentra_user';
private $db_pass = 'YourActualPassword';
private $host = 'localhost';
```

**File: `/config/Config.php`** (backend settings)
```php
define('APP_URL', 'https://yourdomain.com');
define('RAZORPAY_KEY_ID', 'rzp_test_...');
define('RAZORPAY_KEY_SECRET', 'your_secret');
define('BUSINESS_EMAIL', 'admin@yourdomain.com');
define('BUSINESS_PHONE', '+91-9876543210');
```

### Step 3: Upload to Hostinger

1. Login to Hostinger
2. Go to: Hosting → Manage → File Manager
3. Open: `public_html` folder
4. Upload ZIP file (fastest method)
5. Extract and delete ZIP

**OR** upload files folder by folder:
- Upload `config/`, `database/`, `api/`, `includes/`, `admin/` folders
- Upload all root HTML, JS, CSS files
- Upload `assets/`, `book/`, `psychologists/`, `services/`, etc.

### Step 4: Setup Database

1. In Hostinger → Databases → MySQL
   - Create database: `mentra_booking`
   - Create user: `mentra_user`
   - Add user to database with all privileges

2. In phpMyAdmin:
   - Select `mentra_booking` database
   - Click Import tab
   - Upload `database/schema.sql`
   - All 8 tables will be created

3. Create admin user:
   - Go to `admin_users` table
   - Insert: username=`admin`, email, password_hash

---

## 🧪 TEST YOUR SYSTEM

After uploading, test each part:

### ✅ Test 1: API Working?
Visit: `https://yourdomain.com/api/psychologists`

Should see:
```json
{"success":true,"data":[]}
```

If API works, backend is connected! ✅

### ✅ Test 2: Website Loading?
Visit: `https://yourdomain.com`

Should see:
- Homepage with hero section
- "Book a session" button
- Nice design and layout ✅

### ✅ Test 3: Booking Page?
Visit: `https://yourdomain.com/book/`

Should see:
- Screening questions
- "Find your psychologist" flow ✅

### ✅ Test 4: Admin Panel?
Visit: `https://yourdomain.com/admin/login.php`

Login with: `admin` / `your-password`

Should see:
- Dashboard with statistics
- Links to manage psychologists & bookings ✅

---

## 🎓 HOW IT WORKS

### User Books a Session:
1. User visits website
2. Clicks "Book a session"
3. Answers screening questions
4. Chooses psychologist (from backend API)
5. Selects time slot (from backend API)
6. Enters details (name, email, phone)
7. Clicks "Pay" (Razorpay payment gateway)
8. Payment verified by backend
9. ✅ Booking confirmed
10. 📧 Email sent with Google Meet link

### You Manage Everything:
1. Add psychologists via admin panel
2. Set their schedules (working hours)
3. View all bookings and details
4. Send manual confirmations if needed
5. Access booking analytics
6. Manage Razorpay settings

---

## 🔄 Frontend-Backend Connection

### mentra-api.js (The Bridge)
This new file connects your website to the backend:

```javascript
// Frontend → Backend API
window.MENTRA_API.getPsychologists()
window.MENTRA_API.getSlots(id, date)
window.MENTRA_API.createBooking(data)
window.MENTRA_API.createPaymentOrder(data)
window.MENTRA_API.verifyPayment(data)
```

**How it works:**
1. User visits website
2. `mentra-api.js` loads
3. Checks `config.js` for API_URL
4. Calls backend API
5. Loads psychologists from database
6. Updates website with real data

If API fails, website falls back to `psychologists.js` (hard-coded data).

---

## 📊 Database Overview

8 tables created:

| Table | Purpose |
|-------|---------|
| `admin_users` | Admin login credentials |
| `psychologists` | Therapist information |
| `psychologist_schedules` | Working hours per day |
| `time_slots` | Available appointment times |
| `bookings` | All bookings with payment & Meet info |
| `days_off` | Dates when therapist unavailable |
| `settings` | System configuration (Razorpay keys, etc) |
| `indexes` | Performance optimization |

---

## 💰 PAYMENT SETUP

### Test Mode (For Testing)
1. Get test Razorpay keys from: https://razorpay.com/
2. Copy test Key ID: `rzp_test_...`
3. Copy test Key Secret
4. Paste in `/config/Config.php`
5. Test bookings with test payment method

### Live Mode (When Ready)
1. Apply for Razorpay approval
2. Get live Razorpay keys
3. Copy live Key ID: `rzp_live_...`
4. Copy live Key Secret
5. Update `/config/Config.php`
6. Go live! (Accept real payments)

---

## 📋 QUICK CHECKLIST

Before going live:

```
Upload & Setup
☐ Download files from GitHub
☐ Extract ZIP on computer
☐ Update config.js (API_URL, contact info)
☐ Update Database.php (DB credentials)
☐ Update Config.php (domain, Razorpay keys)
☐ Upload all files to Hostinger

Database
☐ Create MySQL database: mentra_booking
☐ Create user: mentra_user
☐ Import schema.sql file
☐ Create admin user in admin_users table

Testing
☐ Test API: yourdomain.com/api/psychologists
☐ Test website: yourdomain.com
☐ Test booking page: yourdomain.com/book
☐ Test admin login: yourdomain.com/admin/login.php
☐ Add a test psychologist
☐ Create a test booking

All checked? READY TO LAUNCH! 🎉
```

---

## 🆘 NEED HELP?

| Issue | Solution |
|-------|----------|
| Psychologists not showing | Check `config.js` API_URL is correct |
| API returns 404 | Check `.htaccess` uploaded, mod_rewrite enabled |
| Database connection error | Check `config/Database.php` credentials |
| Admin login fails | Check admin user in `admin_users` table |
| Email not sending | Check MAIL_FROM in `config/Config.php` |
| Payment not working | Check Razorpay keys in `config/Config.php` |

**Detailed troubleshooting:** See `FRONTEND-INTEGRATION.md`

---

## 📚 DOCUMENTATION

| Document | What It Covers |
|----------|----------------|
| `FRONTEND-INTEGRATION.md` | How frontend & backend work together, how to configure |
| `HOSTINGER-UPLOAD-GUIDE.md` | Step-by-step file upload instructions |
| `ADMIN-GUIDE.md` | How to use the admin panel |
| `INSTALLATION.md` | Full technical setup details |
| `QUICK-START.md` | API endpoints reference |

**Start here:** Read `FRONTEND-INTEGRATION.md` first!

---

## 🎯 YOUR NEXT STEPS

### Immediate (Today)
1. ✅ Download files from GitHub
2. ✅ Update config.js with your API URL
3. ✅ Update Database.php with DB credentials
4. ✅ Update Config.php with domain & Razorpay keys

### Soon (This Week)
1. Upload files to Hostinger
2. Create MySQL database
3. Import schema.sql
4. Create admin user
5. Test everything

### Ready (When Confident)
1. Add your psychologists
2. Configure their schedules
3. Test full booking workflow
4. Monitor for errors
5. **LAUNCH!** 🚀

---

## ✨ YOU NOW HAVE

✅ **Complete Website**
- Beautiful, responsive design
- Professional psychologist directory
- Smooth booking experience
- Legal pages (privacy, terms, refund policy)

✅ **Full Backend System**
- PHP REST API
- MySQL database
- Booking & payment processing
- Email notifications
- Google Meet integration

✅ **Admin Panel**
- Psychologist management (add/edit/delete)
- Booking overview
- Manual appointment creation
- Settings & configuration
- Statistics dashboard

✅ **Integration Layer**
- Frontend connects to backend API
- Automatic data loading
- Seamless user experience
- Fallback if API unavailable

✅ **Complete Documentation**
- Step-by-step guides
- Configuration instructions
- Troubleshooting help
- API reference

---

## 🎉 YOU'RE READY TO LAUNCH!

Everything is built, integrated, and ready to deploy.

**All files are on GitHub:**
👉 https://github.com/rasheek-dev/Rasheekdev

**Next Step:** Read `FRONTEND-INTEGRATION.md` for complete setup instructions.

---

**Questions?** Check the documentation files or review the code comments in the files.

**Ready to deploy?** Follow the 4-step deployment guide above.

**Your Mentra booking system is complete and production-ready!** 🎊
