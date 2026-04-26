# QuickBasket MERN Migration Map

## Old Next.js To New MERN

| Old location | New location |
| --- | --- |
| `1.snapcart/src/app` pages | `client/src/pages` and `client/src/components` |
| `1.snapcart/src/app/api` route handlers | `server/src/routes` and `server/src/controllers` |
| `1.snapcart/src/models` | `server/src/models` |
| `1.snapcart/src/lib/db.ts` | `server/src/config/db.js` |
| `1.snapcart/src/lib/cloudinary.ts` | `server/src/services/cloudinary.service.js` |
| `1.snapcart/src/lib/mailer.ts` | `server/src/services/mail.service.js` |
| `1.snapcart/src/lib/socket.ts` | `client/src/api/socket.js` |
| `socketServer/index.js` | `server/src/socket/index.js` |
| NextAuth | Express JWT cookie auth |
| Next.js App Router | React Router |

## Implemented Feature Areas

- Email/password auth with JWT cookie
- Google login with backend ID-token verification and JWT cookie session
- User/customer grocery shopping flow
- Cart with Redux Toolkit
- Checkout and order creation
- Admin grocery creation and order status management
- Delivery assignment accept/reject flow
- Live delivery location with Socket.IO
- Order tracking map with Leaflet/OpenStreetMap
- Delivery chat with Socket.IO
- Gemini reply suggestions
- Stripe checkout session and webhook endpoint
- Cloudinary image upload
- Email OTP delivery verification

## Required Manual Config

If MongoDB Atlas refuses connection, add your current IP in Atlas:

`Network Access -> Add IP Address`

Then restart:

```bash
cd D:\quickbasket
npm run dev
```
