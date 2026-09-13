# CertGen Frontend

React + Vite frontend for certificate generation and management.

## 🚀 Deployment

This frontend is deployed to Vercel as a static site.

### Environment Variables Required

Set in Vercel Project Settings:

```
VITE_API_URL=https://your-backend.vercel.app
```

Or use `.env.production` for local production builds.

## 🏗️ Structure

```
certgen-frontend/
├── src/
│   ├── components/      # React components
│   ├── services/        # API integration
│   └── App.jsx         # Main app
├── public/
├── package.json
└── vite.config.js
```

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## 🔗 Backend Integration

The frontend connects to the backend via the `VITE_API_URL` environment variable.

During development, it defaults to `http://localhost:8000`.
In production, it uses the URL from Vercel environment variables.

## 📦 Vercel Configuration

- **Framework Preset**: Vite (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
