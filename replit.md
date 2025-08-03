# Thanalytica - AI-Powered Longevity Health Assessment Platform

## Overview

Thanalytica is a comprehensive health assessment and longevity optimization platform that evaluates users' health trajectories and provides personalized recommendations for extended vitality. The application combines detailed health assessments with AI-powered analysis to calculate biological age, vitality scores, and provide actionable insights for improving longevity outcomes.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

**Analytics System & Admin Dashboard (Latest - January 3, 2025):**
- Implemented comprehensive analytics tracking system with database schema and API routes
- Created admin analytics dashboard at `/admin/analytics` with real-time metrics display
- Added analytics event tracking across all main user flows (assessment, dashboard, simulator, recommendations)
- Built protected admin routes with role-based access control (admin emails or @thanalytica.com)
- Fixed TypeScript compilation errors in storage layer related to Drizzle query builder
- Verified application health: all core systems operational, database tables properly configured
- Admin dashboard shows: total users, assessments, platform events, feature usage, and recent activity

**Data Science & AI Enhancements:**
- Implemented advanced health modeling with biological age calculations and confidence scoring
- Created comprehensive AI-powered health assistant with symptom analysis and intervention suggestions
- Added sophisticated health trend visualizations using Recharts with time-range selection and chart type options
- Built optimized React Query caching system with smart prefetching and performance monitoring
- Enhanced database schema with health models, insights, and trends tables for AI-powered analysis
- Integrated wearable device data (Oura Ring, Apple Health) into advanced biological age calculations
- Added dedicated `/health-ai` page with real-time AI insights and model performance metrics
- Implemented comprehensive loading states throughout the application including dashboard skeleton components, assessment form loading overlays, and health simulator calculation indicators
- Enhanced error handling system with user-friendly toast messages, intelligent retry logic, and comprehensive timeout management
- Implemented React Error Boundary components with graceful error fallbacks and comprehensive error logging
- Enhanced assessment form error handling with specific error messages, automatic form data preservation, and retry functionality

**Authentication & Routing System:**
- Created dedicated `/login` page with Firebase email/password and Google OAuth
- Added route protection for `/dashboard`, `/assessment`, `/recommendations`, `/wearables`, `/health-ai`, and `/admin/analytics`
- Fixed login flow: login buttons now redirect to `/login` instead of immediate Firebase calls
- Auto-redirect authenticated users from `/login` to `/dashboard`
- Auto-redirect unauthenticated users from protected routes to `/login`

**Database Migration & Wearable Integration:**
- Migrated from in-memory storage to PostgreSQL database
- Updated authentication to properly handle user creation in database
- Added comprehensive wearable device integration database schema
- All user data, assessments, recommendations, and device connections now persist in database

**Branding Updates:**
- Updated all references to use "Thanalytica" consistently
- Added comprehensive meta tags and SEO optimization
- Updated page title to "Thanalytica - Your Journey to 150 Years"

## System Architecture

### Frontend Architecture

**React Single Page Application**: Built with React 18 using TypeScript, featuring a component-based architecture with modern hooks and functional components. The frontend uses Wouter for lightweight client-side routing without the overhead of React Router.

**UI Component System**: Implements shadcn/ui component library built on Radix UI primitives, providing accessible and customizable components with consistent design patterns. Uses Tailwind CSS for utility-first styling with custom CSS variables for theming.

**State Management**: Leverages TanStack Query (React Query) for server state management, providing caching, synchronization, and background updates. Local component state is managed with React hooks.

**Form Handling**: Uses React Hook Form with Zod schema validation for type-safe form management, particularly in the multi-step health assessment flow.

**Styling Approach**: Tailwind CSS with custom design tokens for medical/clinical theming, including custom colors for medical-green, trust-blue, vitality-gold, and clinical-white to establish professional healthcare aesthetics.

### Backend Architecture

**Express.js REST API**: Node.js server using Express with TypeScript, providing RESTful endpoints for user management, health assessments, metrics, and recommendations.

**Route Organization**: Centralized route registration with middleware for request logging, error handling, and JSON parsing. API endpoints follow REST conventions with proper HTTP status codes.

**Data Storage Strategy**: Currently implements in-memory storage with an interface-based design (IStorage) that allows easy migration to persistent database solutions. The storage layer abstracts CRUD operations for users, health assessments, metrics, and recommendations.

**Development Environment**: Vite-powered development server with hot module replacement, TypeScript compilation, and error overlay for enhanced developer experience.

### Database Design

**Schema Architecture**: Uses Drizzle ORM with PostgreSQL dialect for type-safe database operations. Schema includes:
- Users table with Firebase authentication integration
- Health assessments with comprehensive health data (lifestyle, medical history, goals)
- Health metrics for calculated values (biological age, vitality scores)
- Recommendations system for personalized advice

**Data Validation**: Employs Zod schemas for runtime type checking and validation, with drizzle-zod integration for seamless database schema validation.

### Authentication System

**Firebase Authentication**: Integrates Firebase Auth for user management with Google OAuth sign-in. Uses Firebase UID as the primary user identifier with redirect-based authentication flow suitable for web applications.

**Session Management**: Handles authentication state with React hooks and Firebase's onAuthStateChanged listener for real-time auth status updates.

### Development and Build Process

**TypeScript Configuration**: Strict TypeScript setup with path mapping for clean imports (@/ for client, @shared for shared types).

**Build Pipeline**: Vite for frontend bundling and esbuild for server compilation, optimized for both development and production environments.

**Code Organization**: Monorepo structure with clear separation between client, server, and shared code, enabling type sharing between frontend and backend.

## External Dependencies

### Core Framework Dependencies
- **React 18** with TypeScript for frontend development
- **Express.js** for backend API server
- **Vite** for development server and build tooling
- **Node.js** runtime environment

### UI and Styling
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible component primitives
- **Lucide React** for consistent iconography

### Database and ORM
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** as the target database (configured for Neon)
- **@neondatabase/serverless** for serverless database connections

### Authentication
- **Firebase Authentication** for user management and OAuth
- **Google OAuth** integration for sign-in

### State Management and Data Fetching
- **TanStack Query (React Query)** for server state management
- **React Hook Form** for form state management
- **Zod** for schema validation and type safety

### Development Tools
- **TypeScript** for static type checking
- **ESBuild** for server-side bundling
- **PostCSS** with Autoprefixer for CSS processing
- **@replit/vite-plugin-runtime-error-modal** for development error handling

### Utility Libraries
- **date-fns** for date manipulation
- **clsx** and **tailwind-merge** for conditional CSS classes
- **nanoid** for unique ID generation
- **class-variance-authority** for component variant management