# Mentra Backend - PHP + MySQL

A complete backend system for the Mentra psychology booking platform with slug-based URLs, database scheduling, and Razorpay integration.

## Quick Setup

1. Read `INSTALLATION.md` for Hostinger setup instructions
2. Import `database/schema.sql` into your MySQL database
3. Configure `config/Database.php` with your Hostinger credentials
4. Upload all files via cPanel File Manager
5. Access admin panel at `yourdomain.com/admin/`

## Features

✅ Slug-based psychologist pages (`/book/dr-priya`)
✅ Database-only scheduling (no Google Calendar needed)
✅ Razorpay payment integration
✅ Admin panel for managing psychologists & bookings
✅ Email notifications
✅ REST API endpoints
✅ Hostinger cPanel optimized

## File Structure

```
/
├── config/              # Configuration files
├── database/            # SQL schema
├── api/                 # REST API endpoints
├── admin/               # Admin panel
├── public/              # Frontend files
├── includes/            # Core classes
└── INSTALLATION.md      # Setup guide
```

## Next Steps

1. Run `database/schema.sql` on your Hostinger MySQL database
2. Update `config/Database.php` with your credentials
3. Configure `config/Config.php` with your Razorpay keys
4. Access admin panel and add psychologists

For detailed instructions, see `INSTALLATION.md`
