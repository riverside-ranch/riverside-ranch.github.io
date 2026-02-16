# Riverside Ranch — Management System

A clean, modern, western-themed web application for managing a RedM ranch operation.
Fully hosted on **GitHub Pages** with **Firebase** as the backend (database, auth, storage).

**No server needed.** Everything runs in the browser.

## Live Demo

After deployment, your app will be live at:
```
https://YOUR-USERNAME.github.io/riverside-ranch/
```

## Features

- **Order Management** — Kanban board with drag-and-drop + table view, search/filter
- **Quotes** — Create quotes, convert to orders with one click
- **Misc Log** — Track ranch activities by category with optional amounts
- **Daily Tasks** — Admin-managed checklist with completion tracking (who + when)
- **Poster Gallery** — Upload and share ranch posters with copyable URLs for RedM
- **Dashboard** — Quick stats, outstanding orders, tasks, activity timeline
- **User Roles** — Admin and Member with enforced permissions
- **Dark Mode** — Toggle between light and dark themes
- **CSV Export** — Export order data to spreadsheet
- **Mobile Friendly** — Responsive design for all screen sizes
- **Activity Timeline** — Tracks all actions across the app

## Architecture

```
GitHub Pages (static hosting)  ←→  Firebase (backend services)
       │                                    │
   React App                    ┌───────────┼───────────┐
   (Vite build)                 │           │           │
                           Firestore    Auth       Storage
                           (database)  (login)    (images)
```

**No Express server. No SQL. No separate hosting.** The React app calls Firebase directly.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Database | Firebase Firestore (NoSQL) |
| Auth | Firebase Auth (email/password) |
| Storage | Firebase Storage (poster images) |
| Hosting | GitHub Pages |
| Drag & Drop | @dnd-kit |

## Project Structure

```
riverside-ranch/
├── client/                 # React frontend (this gets deployed)
│   ├── src/
│   │   ├── components/     # UI components (layout, orders, ui)
│   │   ├── context/        # Auth & Theme providers
│   │   ├── lib/            # Firebase config, API layer, utilities
│   │   ├── pages/          # Page components
│   │   └── styles/         # Tailwind CSS
│   ├── .env.example        # Environment variables template
│   ├── package.json
│   └── vite.config.js
├── firebase/               # Firebase configuration
│   ├── firestore.rules     # Security rules (paste into Firebase Console)
│   ├── storage.rules       # Storage security rules
│   └── firestore-schema.md # Database structure reference
└── README.md
```

---

## Setup Guide (Step by Step)

### Step 1: Create Firebase Project (Free)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** → name it (e.g., `riverside-ranch`) → Create
3. Once created, click the **web icon** (`</>`) to add a web app
4. Name it anything → click **Register app**
5. You'll see a config block like this — **copy these values**:
   ```
   apiKey: "AIza..."
   authDomain: "riverside-ranch.firebaseapp.com"
   projectId: "riverside-ranch"
   storageBucket: "riverside-ranch.appspot.com"
   messagingSenderId: "123..."
   appId: "1:123..."
   ```

### Step 2: Enable Firebase Services

In the Firebase Console:

**Authentication:**
1. Go to **Build** → **Authentication** → **Get Started**
2. Click **Email/Password** → Enable it → Save

**Firestore Database:**
1. Go to **Build** → **Firestore Database** → **Create Database**
2. Choose **Start in test mode** (we'll add rules next) → pick a region → Create
3. Go to **Rules** tab, paste the contents of `firebase/firestore.rules`, click **Publish**

**Storage:**
1. Go to **Build** → **Storage** → **Get Started**
2. Accept defaults → Create
3. Go to **Rules** tab, paste the contents of `firebase/storage.rules`, click **Publish**

### Step 3: Create Firestore Indexes

Firebase will auto-create most indexes when you first query. But to avoid errors, create these manually:

1. Go to **Firestore** → **Indexes** → **Add Index**
2. Add these composite indexes:

| Collection | Fields | Order |
|-----------|--------|-------|
| `orders` | `status` ASC, `createdAt` DESC | |
| `misc_logs` | `category` ASC, `createdAt` DESC | |
| `quotes` | `status` ASC, `createdAt` DESC | |

(Or just use the app — Firebase will show error links that auto-create the needed indexes)

### Step 4: Clone and Configure

```bash
git clone https://github.com/YOUR-USERNAME/riverside-ranch.git
cd riverside-ranch/client
cp .env.example .env
```

Edit `.env` with your Firebase config values:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=riverside-ranch.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=riverside-ranch
VITE_FIREBASE_STORAGE_BUCKET=riverside-ranch.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123...
VITE_FIREBASE_APP_ID=1:123...
```

### Step 5: Update Repo Name in Config

In `client/vite.config.js`, change the `base` to match your GitHub repo name:
```js
base: '/riverside-ranch/',  // ← your repo name here
```

### Step 6: Install and Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and verify it works.

### Step 7: Create Your Admin Account

1. Click **Sign Up** in the app and create an account
2. Go to Firebase Console → **Firestore** → `users` collection
3. Find your document → click on it → change `role` from `"member"` to `"admin"`
4. Refresh the app — you now have full admin access

### Step 8: Deploy to GitHub Pages

```bash
npm run deploy
```

This builds the app and pushes to the `gh-pages` branch.

Then in your GitHub repo:
1. Go to **Settings** → **Pages**
2. Set source to **Deploy from a branch** → `gh-pages` → `/ (root)`
3. Click Save

Your app will be live at `https://YOUR-USERNAME.github.io/riverside-ranch/` within a few minutes.

### Step 9: Configure Firebase Auth Domain

In Firebase Console → **Authentication** → **Settings** → **Authorized domains**:
1. Add `YOUR-USERNAME.github.io`

---

## Environment Variables

The `.env` file is **not committed to git** (it's in `.gitignore`). For GitHub Pages deployment, you have two options:

**Option A: Hardcode in firebase.js (simplest)**
Firebase API keys are safe to expose in client-side code — they're restricted by Firebase Security Rules. You can replace the `import.meta.env` references in `src/lib/firebase.js` with your actual values before deploying.

**Option B: Build locally with .env**
Keep the `.env` file local. Run `npm run deploy` from your machine where `.env` exists.

---

## User Roles

| Permission | Admin | Member |
|-----------|-------|--------|
| View all data | Yes | Yes |
| Create orders | Yes | Yes |
| Update order status | Yes | Yes |
| Delete orders | Yes | No |
| Create quotes | Yes | Yes |
| Convert quotes to orders | Yes | Yes |
| Submit misc logs | Yes | Yes |
| Delete misc logs | Yes | No |
| Add/edit/delete tasks | Yes | No |
| Check off tasks | Yes | Yes |
| Upload/delete posters | Yes | No |

---

## Database Structure

See [firebase/firestore-schema.md](firebase/firestore-schema.md) for the full Firestore collection/document structure.

## Security

- All data access is protected by **Firestore Security Rules**
- Users must be authenticated to read or write any data
- Admin-only actions (delete, create tasks, upload posters) are enforced server-side by Firebase rules
- Firebase API keys are safe to expose — they only identify the project, not grant access
- Storage uploads are restricted to image files under 10MB

## Future Scaling Ideas

- **Real-time updates** — Add Firestore `onSnapshot` listeners for live data
- **Discord/Telegram webhooks** — Firebase Functions for new order notifications
- **Inventory tracking** — Stock levels with automatic alerts
- **Customer database** — Dedicated customer profiles with order history
- **Financial reports** — Revenue charts and profit/loss tracking
- **Custom domain** — Point your own domain to GitHub Pages

## License

MIT
