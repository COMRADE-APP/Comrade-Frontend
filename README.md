# Comrade Frontend

A modern React frontend for the Comrade social learning platform, built with Vite, TailwindCSS, and React Router.

## Features

- 🔐 **Authentication**: JWT-based auth with Google OAuth support
- 📱 **Responsive Design**: Mobile-first design that works on all devices
- 🎨 **Modern UI**: Clean, vibrant design with TailwindCSS
- 📊 **Dashboard**: Comprehensive dashboard with stats and feed
- 📢 **Announcements**: Stay updated with important announcements
- 📅 **Events**: Discover and register for events
- ✅ **Tasks**: Manage assignments and submissions
- 👤 **Profile**: User profile management
- 👥 **Community**: Connect with peers

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Prerequisites

- Node.js 16+ and npm
- Backend server running at `http://localhost:8000`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Comrade
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── common/         # Generic UI components (Button, Input, Card)
│   └── layout/         # Layout components (Sidebar, Header, MobileNav)
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   └── *.jsx           # Main feature pages
├── services/           # API service layer
├── contexts/           # React contexts
├── utils/              # Utility functions
├── constants/          # Constants and configuration
├── App.jsx             # Main app component
└── main.jsx            # Entry point
```

## Key Features

### Authentication
- Email/password login
- Social OAuth (Google, Facebook, Microsoft)
- JWT token management with automatic refresh
- Protected routes

### Responsive Design
- Desktop: Sidebar navigation
- Mobile: Bottom navigation bar
- Touch-friendly interface
- Optimized for all screen sizes

### API Integration
- Axios instance with interceptors
- Automatic JWT token refresh
- Error handling
- Loading states

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_APP_NAME` | Application name | `Comrade` |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is part of the Comrade platform.
