# Smart Sukuk - Frontend

This is the frontend application for the Smart Sukuk platform, a blockchain-based real estate tokenization marketplace. It provides a user-friendly interface for investors, property owners, and regulators to interact with the platform.

## Features

- **User Authentication**: Secure login and registration for different user roles (Investor, Owner, Regulator).
- **Dashboard**: tailored dashboards for each user role.
    - **Owner**: Manage listings, view token sales, and track revenue.
    - **Investor**: Browse marketplace, purchase tokens, and view portfolio.
    - **Regulator**: Verify property listings and ensure compliance.
- **Marketplace**: Browse and filter available property listings with detailed information.
- **Property Details**: View comprehensive details about properties, including images, legal documents, and token economics.
- **Token Management**: Buy, sell, and manage real estate tokens.
- **KYC Integration**: Identity verification for users.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) (via [shadcn/ui](https://ui.shadcn.com/))
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation.
- **State Management**: React Context / Hooks.
- **API Client**: Axios.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Installation

1.  Navigate to the frontend directory:
    ```bash
    cd Frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components.
- `src/lib`: Utility functions and API configuration.
- `src/hooks`: Custom React hooks.
- `public`: Static assets.

## Configuration

- **Environment Variables**: Create a `.env.local` file in the root of the `Frontend` directory to store environment variables (e.g., API base URL).
