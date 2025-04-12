# Fookiki Web UI

A Vue.js 3 web application with Firebase integration.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase account and project set up

## Project Setup

1. Install dependencies for the web application:
```bash
npm install
```

2. Install dependencies for Firebase Functions:
```bash
cd functions
npm install
```

## Development

### Local Development Server
```bash
npm run dev
```
This will start the development server at `http://localhost:5173`

### Firebase Functions Development
```bash
cd functions
npm run serve
```

## Building for Production

1. Build the Vue.js application:
```bash
npm run build
```
This will create a production build in the `dist` directory.

2. Build Firebase Functions:
```bash
cd functions
npm run build
```

## Deployment

1. Login to Firebase (if not already logged in):
```bash
firebase login
```

2. Deploy the entire application (hosting + functions):
```bash
firebase deploy
```

To deploy specific components:
- Deploy only hosting: `firebase deploy --only hosting`
- Deploy only functions: `firebase deploy --only functions`

## Project Structure

- `/src` - Vue.js application source code
- `/functions` - Firebase Cloud Functions
- `/dist` - Production build output (generated)
- `firebase.json` - Firebase configuration
- `vite.config.js` - Vite configuration

## Environment Variables

Create a `.env` file in the root directory for your environment variables:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
# Add other Firebase config variables as needed
```

## License

ISC
