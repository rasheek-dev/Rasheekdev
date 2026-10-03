# Mentra Admin Backend - Complete Guide

Your complete admin backend with Google Meet integration and psychologist management is now ready!

## 🎯 What's Included

✅ **Admin Dashboard** - Overview of bookings, revenue, statistics
✅ **Psychologist Management** - Add, edit, delete psychologists
✅ **Booking Management** - View and manage all bookings
✅ **Manual Appointments** - Create bookings manually
✅ **Google Meet Integration** - Auto-generate meet links
✅ **Email Notifications** - Send confirmations with meet links
✅ **Settings Panel** - Configure Razorpay and business details

---

## 🚀 Quick Access

### Admin Login
```
URL: https://yourdomain.com/admin/login.php
Default Username: admin
Default Password: [Set during database setup]
```

### Admin Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/admin/dashboard.php` | Overview & statistics |
| Psychologists | `/admin/psychologists.php` | Manage therapists |
| Bookings | `/admin/bookings.php` | View & manage bookings |
| Create Appointment | `/admin/appointments.php` | Manual booking creation |
| Settings | `/admin/settings.php` | System configuration |

---

## 📋 Admin Dashboard Features

### Dashboard Statistics
- **Active Psychologists** - Count of available therapists
- **Today's Bookings** - Bookings scheduled for today
- **Upcoming Bookings** - Confirmed future bookings
- **Today's Revenue** - Payment received today

### Quick Actions
- Add new psychologist
- Create manual appointment
- View all bookings

### Recent Bookings Table
- Booking code, client name, psychologist
- Date & time, amount, status
- Quick view of latest activity

---

## 👨‍⚕️ Managing Psychologists

### Adding a Psychologist

1. Go to **👨‍⚕️ Psychologists**
2. Click **+ Add New Psychologist**
3. Fill in details:
   - **Name** (required) - Auto-generates slug
   - **Gender** - Male/Female/Other
   - **Email** - For notifications
   - **Phone** - Contact number
   - **Bio** - About the psychologist
   - **Qualifications** - Degrees, certifications
   - **Hourly Fee** - Session cost in ₹
   - **Session Duration** - Minutes (default 60)
   - **Experience** - Years in practice
   - **Registration Number** - License/RCI number
4. Click **Save Psychologist**

### Slug Generation
The system auto-generates a unique slug from the name:
- "Dr. Priya Sharma" → `dr-priya-sharma`
- Used in booking URL: `/book/dr-priya-sharma`

### Editing a Psychologist
1. Click **Edit** on the psychologist
2. Update details
3. Click **Save Psychologist**

### Deactivating a Psychologist
- Set `is_active` to `false` in database
- Hides from public website
- Existing bookings remain

### Deleting a Psychologist
1. Click **Delete**
2. Confirm deletion
3. ⚠️ All bookings are deleted (use with caution)

---

## 📅 Creating Manual Appointments

### When to Use Manual Appointment Creation
- Offline bookings (phone, in-person)
- Special arrangements
- Walk-in clients
- Admin corrections

### Step-by-Step

1. Go to **🗓️ Create Appointment**
2. **Select Psychologist** (required)
3. **Date & Time** (required)
4. **Client Details**:
   - Name (required)
   - Phone (required)
   - Email (optional - for confirmation)
   - Age (optional)
5. **Session Amount** (required, in ₹)
6. **Generate Google Meet Link** ✓ (checkbox)
7. Click **✓ Create Appointment**

### What Happens Automatically
- ✅ Booking created with "Confirmed" status
- 📧 Confirmation email sent (if email provided)
- 📹 Google Meet link generated
- 📝 Booking code generated
- 🗓️ Time slot locked

---

## 📊 Managing Bookings

### View Bookings
1. Go to **📅 Bookings**
2. Filter by:
   - **Date** - Select date
   - **Status** - Confirmed/Pending/Cancelled
3. View booking details:
   - Booking code
   - Client info
   - Psychologist
   - Session time
   - Amount paid
   - Status
   - Google Meet link

### Google Meet Links
- **Column shows**: 📹 Join Meet (if available)
- **Click** to join the video session
- **Works for**: All confirmed bookings with meet links

### Booking Information
```
Booking Code: BK5F3A2E1B9C
Client: John Doe (+91-9876543210)
Psychologist: Dr. Priya Sharma
Date & Time: Oct 15, 2024 at 10:00 AM
Amount: ₹999
Status: Confirmed
Google Meet: https://meet.google.com/mentra-123
```

---

## 🎥 Google Meet Integration

### How It Works

1. **Automatic Generation**
   - Meet link auto-generated when booking is confirmed
   - Format: `https://meet.google.com/mentra-[booking-id]`

2. **Client Receives Email**
   - Confirmation email includes meet link
   - "Join Google Meet" button in email
   - Can join 5 minutes before session

3. **Psychologist Access**
   - Accessible in admin panel
   - View all meet links for their bookings
   - Click to join session

4. **Meeting Details**
   - No separate registration needed
   - Google Meet handles everything
   - Support up to 100 participants

### Email Example

Client receives email with:
```
📹 Join Your Session:

https://meet.google.com/mentra-123

Join 5 minutes before your scheduled time.
```

---

## ⚙️ Settings & Configuration

### Razorpay Keys
```
Location: Settings > Razorpay Configuration
- Key ID: rzp_test_... (test) or rzp_live_... (live)
- Key Secret: Your secret key
```

### Business Details
```
Setting Values:
- Business Name: Your company name
- Contact Email: admin@yourdomain.com
- Contact Phone: +91-9876543210
- WhatsApp Number: +91-9876543210
```

### Update Settings
1. Go to **⚙️ Settings**
2. Click input field
3. Enter new value
4. Click **Update**

---

## 👥 User Email Notifications

### Booking Confirmation Email

When a booking is confirmed, client receives:

```
Subject: Booking Confirmed - Dr. Priya Sharma

Dear [Client Name],

Your session has been confirmed with Dr. Priya Sharma.

Booking Details:
- Booking Code: BK5F3A2E1B9C
- Date: October 15, 2024
- Time: 10:00 AM
- Amount Paid: ₹999

Join Your Session:
[📹 Join Google Meet button]
https://meet.google.com/mentra-123

Please join 5 minutes before your scheduled time.

Mentra
contact@yourdomain.com
+91-9876543210
```

### What Links Are Included
- ✅ Google Meet link for video session
- ✅ Booking code for reference
- ✅ Session time and duration
- ✅ Business contact details

---

## 🔐 Admin Security

### Default Admin Setup
When you import `database/schema.sql`, create an admin user:

```sql
INSERT INTO admin_users (username, password_hash, email, full_name) 
VALUES ('admin', '$2y$10/[hash]', 'admin@yourdomain.com', 'Admin Name');
```

### Generate Password Hash (PHP)
```php
<?php
echo password_hash('your_password', PASSWORD_DEFAULT);
?>
```

### Change Admin Password
1. Create new hash using PHP script
2. Update database: `UPDATE admin_users SET password_hash = ? WHERE username = 'admin'`

### Session Management
- Session timeout: 1 hour (configurable)
- Login required for all admin pages
- Logout clears session

---

## 🔗 Database Schema

### Tables Used

**admin_users**
- Admin login credentials
- Email, name, timestamps

**psychologists**
- Therapist details
- Slug, rates, specializations
- Active/inactive status

**bookings**
- All booking records
- Google Meet links
- Payment details
- Confirmation status

**time_slots**
- Available appointment times
- Status (available, booked, hold, blocked)

**settings**
- Razorpay configuration
- Business contact details

---

## 📱 Common Tasks

### Add a New Psychologist
```
Admin > Psychologists > + Add > Fill form > Save
```

### Create an Offline Booking
```
Admin > Create Appointment > Fill details > Check "Generate Meet" > Create
```

### View Today's Bookings
```
Admin > Dashboard > Scroll to Recent Bookings
or
Admin > Bookings > Filter by date
```

### Send Meet Link to Client
```
Automatic: When booking created
Email includes meet link automatically
```

### Generate Meet Link for Existing Booking
```
Database: Update bookings SET google_meet_url = 'https://meet.google.com/mentra-[id]'
Admin: Refresh bookings page
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login | Check admin credentials in admin_users table |
| Psychologist not showing | Check `is_active = true` in database |
| Email not sending | Verify MAIL_FROM in config/Config.php |
| Meet link not generated | Create manually via "Create Appointment" |
| Booking code not showing | Refresh page or check database |

---

## 📞 Contact & Support

**For Issues:**
1. Check logs: `/logs/error.log`
2. Verify database connection
3. Check Razorpay credentials
4. See INSTALLATION.md for setup

**For Admin Help:**
- See ADMIN-GUIDE.md (this file)
- Check INSTALLATION.md for Hostinger setup
- Review QUICK-START.md for API details

---

## 🎯 Next Steps

1. ✅ Login to admin panel
2. ✅ Add psychologists
3. ✅ Create test booking
4. ✅ Verify meet link in email
5. ✅ Configure Razorpay keys
6. ✅ Go live with real keys

**Your admin backend is ready!** 🚀

