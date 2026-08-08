# AnonMsg

A full-stack anonymous messaging web app. Users sign up, get a unique profile link, share it anywhere, and receive anonymous messages in a private dashboard.

Built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- **Anonymous messaging** — anyone can send messages via a public profile link, no login required
- **Email verification** — OTP-based account verification via email
- **Secure auth** — JWT access + refresh token rotation with reuse detection
- **Forgot/reset password** — OTP-based password recovery
- **Message management** — paginated inbox, delete messages, toggle accepting messages on/off
- **Real-time username check** — debounced availability check during signup
- **Rate limiting** — per-endpoint rate limits to prevent abuse
- **Input sanitization** — request body sanitization middleware
- **Security hardened** — Helmet, CORS, compression, bcrypt password hashing

## Tech Stack

| Layer    | Stack                                               |
|----------|-----------------------------------------------------|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router, Axios |
| Backend  | Node.js, Express 5, Mongoose, JWT, Nodemailer        |
| Database | MongoDB (Atlas or local)                             |
| Testing  | Vitest, Supertest                                    |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- SMTP credentials for email (e.g. [Brevo](https://www.brevo.com/))

### 1. Clone the repo

```bash
git clone <repo-url>
cd veno-mous
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env    # fill in your values
npm install
npm run dev             # starts on http://localhost:5000
```

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env    # fill in your values
npm install
npm run dev             # starts on http://localhost:5173
```

### 4. Open in browser

Visit `http://localhost:5173` to use the app.

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── controllers/     # Route handlers (auth, message, user)
│   │   ├── middlewares/      # Auth, error, rate-limit, sanitize
│   │   ├── models/          # Mongoose schemas (User, Message)
│   │   ├── routes/          # Express routes
│   │   ├── utils/           # Helpers (ApiError, mailer, tokens, etc.)
│   │   ├── app.js           # Express app setup
│   │   └── constants.js     # App-wide constants
│   ├── tests/               # Backend tests
│   └── server.js            # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios instance with interceptors
│   │   ├── components/      # UI components + ProtectedRoute
│   │   ├── context/         # AuthContext, ToastContext
│   │   ├── lib/             # Utilities (cn, useDebounce)
│   │   ├── pages/           # All page components
│   │   ├── App.jsx          # Router setup
│   │   └── main.jsx         # Entry point
│   └── index.html
│
└── README.md
```

## API Endpoints

### Auth (`/api/v1/auth`)
| Method | Endpoint           | Auth | Description              |
|--------|--------------------|------|--------------------------|
| POST   | `/signup`          | No   | Register new account     |
| POST   | `/verify-otp`      | No   | Verify email with OTP    |
| POST   | `/resend-otp`      | No   | Resend verification OTP  |
| POST   | `/login`           | No   | Login, get tokens        |
| POST   | `/refresh`         | No   | Refresh access token     |
| POST   | `/logout`          | Yes  | Logout, clear tokens     |
| POST   | `/forgot-password` | No   | Request password reset   |
| POST   | `/reset-password`  | No   | Reset password with OTP  |

### Messages (`/api/v1/messages`)
| Method | Endpoint             | Auth | Description              |
|--------|----------------------|------|--------------------------|
| POST   | `/send/:username`    | No   | Send anonymous message   |
| GET    | `/`                  | Yes  | Get own messages (paged) |
| DELETE | `/:messageId`        | Yes  | Delete a message         |
| PATCH  | `/toggle-accept`     | Yes  | Toggle accepting messages|

### Users (`/api/v1/users`)
| Method | Endpoint                    | Auth | Description              |
|--------|-----------------------------|------|--------------------------|
| GET    | `/check-username/:username` | No   | Check username available |
| GET    | `/:username`                | No   | Get public profile       |

## License

ISC
