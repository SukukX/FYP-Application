# Smart Sukuk - Backend

This is the backend API for the Smart Sukuk platform. It handles user authentication, property management, tokenization logic, and interactions with the database.

## Features

- **RESTful API**: Provides endpoints for the frontend to interact with the platform.
- **Authentication**: JWT-based authentication and authorization with role-based access control (RBAC).
- **Database Management**: Uses Prisma ORM for type-safe database interactions with PostgreSQL.
- **File Uploads**: Handles image and document uploads using Multer.
- **Validation**: Request validation using Zod.
- **Security**: Implements Helmet for security headers and CORS for cross-origin resource sharing.

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Authentication**: [JSON Web Token (JWT)](https://jwt.io/)
- **Validation**: [Zod](https://zod.dev/)
- **File Handling**: [Multer](https://github.com/expressjs/multer)

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- PostgreSQL database
- npm or yarn

### Installation

1.  Navigate to the backend directory:
    ```bash
    cd Backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env` file in the root of the `Backend` directory and add the following:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/SukukX?schema=public"
    JWT_SECRET="your_jwt_secret"
    PORT=5000
    ```

4.  Run database migrations:
    ```bash
    npx prisma migrate dev
    ```

### Running the Server

Start the development server:

```bash
npm run dev
```

The server will be running at `http://localhost:5000`.

### API Documentation

The API endpoints are organized by resource:

- `/api/auth`: Authentication (login, register)
- `/api/users`: User management
- `/api/dashboard`: Dashboard data for different roles
- `/api/properties`: Property listings and management
- `/api/marketplace`: Public marketplace listings
- `/api/kyc`: KYC verification
- `/api/mfa`: Multi-factor authentication
- `/api/settings`: User settings

## Project Structure

- `src/controllers`: Request handlers for API endpoints.
- `src/routes`: API route definitions.
- `src/middleware`: Custom middleware (auth, validation, etc.).
- `src/utils`: Utility functions.
- `prisma`: Database schema and migrations.
- `uploads`: Directory for uploaded files.