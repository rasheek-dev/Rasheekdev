# MindLedger Lite - Client Reports & Assessments

A streamlined web application for mental health professionals to manage client records, record session notes, and administer psychological assessments. **No billing or booking features** - focused on documentation and client reporting.

## Features

- **Client Management**: Add and manage client information
- **Session Notes**: Create and store session notes using SOAP, DAP, or free-text templates
- **Psychological Assessments**: Send assessments (PHQ-9, GAD-7, PCL-5, WHO-5, YBOCS) to clients
- **Reports & Analytics**: View comprehensive reports on session notes and assessment results
- **User Authentication**: Role-based access (clinician, coordinator, owner)
- **Data Privacy**: Consent tracking and audit logging

## Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS
- **State Management**: React Hooks + LocalStorage
- **UI Components**: Lucide React Icons
- **Build Tool**: Vite with ESBuild

## Getting Started

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

3. **Build for Production**
   ```bash
   npm run build
   ```

## Demo Login

- **Email**: clinician@example.com
- **Password**: password

The app uses localStorage for data persistence, so data survives page refreshes but is lost on browser cache clear.

## Deployment on Hostinger

### Method 1: Hostinger's Node.js Hosting (Recommended)

1. **Prepare Your Project**
   ```bash
   npm run build
   ```

2. **Push to Hostinger**
   - Create a Node.js application in Hostinger
   - Connect your Git repository
   - Hostinger will auto-build and deploy

3. **Environment Variables** (in Hostinger Panel)
   - `PORT`: 3000
   - `NODE_ENV`: production

### Method 2: Shared Hosting (Static Files)

1. **Build the App**
   ```bash
   npm run build
   ```

2. **Upload to Hostinger**
   - Access File Manager in Hostinger Control Panel
   - Create folder: `/public_html/mindledger`
   - Upload all files from `dist/` folder

3. **Configure .htaccess** (for client-side routing)
   Create `.htaccess` in upload folder:
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

4. **Access Your App**
   ```
   https://yourdomain.com/mindledger
   ```

## Project Structure

```
src/
├── components/          # React components
│   ├── LoginPage.tsx
│   ├── DashboardView.tsx
│   ├── ClientsView.tsx
│   ├── ClientDetailView.tsx
│   ├── SessionNoteEditor.tsx
│   ├── ReportsView.tsx
│   └── Navigation.tsx
├── App.tsx             # Main app component
├── types.ts            # TypeScript types
├── main.tsx            # React entry point
└── index.css           # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Run linter

## Healthcare Compliance

Before deploying to production:
- Ensure HIPAA/local data protection compliance
- Implement proper data encryption
- Set up secure backups
- Establish audit trails
- Implement proper access controls
- Get legal review for your jurisdiction

## Security Notes

- Data currently stored in browser localStorage (good for demos only)
- For production, use:
  - Firebase Firestore (recommended)
  - PostgreSQL/MongoDB backend
  - Implement proper authentication (OAuth2, JWT)
  - Enable HTTPS (standard on Hostinger)

## Troubleshooting

**Module Not Found?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port Already in Use?**
```bash
npm run dev -- --port 3001
```

**Clear Browser Cache Issues**
- Open DevTools (F12)
- Application → LocalStorage → Clear All
- Reload page

## Support

For issues or customization requests, check the source code or contact your development team.
