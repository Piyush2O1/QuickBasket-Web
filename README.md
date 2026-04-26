# QuickBasket MERN

MERN version of the existing Quick Basket/Snapcart app.

## Tech Stack

- MongoDB + Mongoose
- Express.js + Node.js
- React + Vite
- Redux Toolkit
- Socket.IO
- Stripe
- Cloudinary
- Nodemailer
- Leaflet/OpenStreetMap
- Gemini API
- Google Identity Services

## Project Structure

```txt
quickbasket/
  client/   React/Vite frontend
  server/   Express/Mongoose/Socket.IO backend
```

## Run Locally

```bash
cd D:\quickbasket
npm run install:all
copy server\.env.example server\.env
copy client\.env.example client\.env
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:3000`

Local development uses MongoDB on `mongodb://127.0.0.1:27017/quickbasket` by default.
Start a local MongoDB server before running the backend, or replace `MONGODB_URL` in
`server/.env` with your own hosted connection string.

If you use MongoDB Atlas, add your current IP address in Atlas Network Access before
starting the server.

Use the same host style for both frontend and API while testing auth. For example, open
`http://localhost:5173` with `VITE_API_URL=http://localhost:3000/api`. If you open the
frontend from a LAN IP, set `VITE_API_URL` to that same IP too.

Optional sample data:

```bash
npm --prefix server run seed
```

Seed admin comes from `server/.env`:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_MOBILE`

Run the seed command after setting those values to create or update the admin account.

## Migration Notes

The old Next.js app had frontend pages and API routes in one project. In MERN:

- React pages/components are in `client/src`
- Express API routes are in `server/src/routes`
- Mongoose models are in `server/src/models`
- Socket.IO runs inside the Express server
- Auth uses JWT HTTP-only cookies instead of NextAuth
- Google login verifies Google ID tokens on the Express backend, then uses the same JWT cookie session as email/password auth.

For Google login, create a Google OAuth Web client and set the same client ID in:

- `server/.env`: `GOOGLE_CLIENT_ID`
- `client/.env`: `VITE_GOOGLE_CLIENT_ID`

Email/password signup creates the account directly. Delivery handoff OTP emails use:

- `server/.env`: `EMAIL`
- `server/.env`: `PASS`
