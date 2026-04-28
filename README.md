## Grass Green Nursery Frontend

Next.js storefront for Grass Green Nursery. This app expects the backend API from `grass_green_nursery_server` to be running separately.

## Getting Started

1. Copy `.env.example` to `.env`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to your backend API, for local setup:

```bash
http://localhost:8080/api/v1
```

3. Start the backend databases and API from the server project.
4. Run the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required Env

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
```

## Verification

```bash
npm run lint
npm run build
```

The production build succeeds with the current frontend wiring.
