# Thanalytica - AI-Powered Longevity Health Assessment Platform

## Overview

Thanalytica is a comprehensive health assessment and longevity optimization platform that evaluates users' health trajectories and provides personalized recommendations for extended vitality. The application combines detailed health assessments with AI-powered analysis to calculate biological age, vitality scores, and provide actionable insights for improving longevity outcomes. Our vision is to empower individuals to extend their healthy lifespan, leveraging cutting-edge AI and comprehensive health data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**React Single Page Application**: Built with React 18 and TypeScript, using a component-based architecture with modern hooks and functional components. Wouter is used for lightweight client-side routing.

**UI Component System**: Implements shadcn/ui component library built on Radix UI primitives, providing accessible and customizable components. Styling is managed with Tailwind CSS, utilizing custom CSS variables for a consistent medical/clinical theme (medical-green, trust-blue, vitality-gold, clinical-white).

**State Management**: TanStack Query (React Query) handles server state management, caching, and background updates. Local component state uses React hooks.

**Form Handling**: React Hook Form with Zod schema validation is used for type-safe form management, especially for the multi-step health assessment.

### Backend Architecture

**Express.js REST API**: A Node.js server with Express and TypeScript, providing RESTful endpoints for user management, health assessments, metrics, and recommendations. API endpoints follow REST conventions and include middleware for logging, error handling, and JSON parsing.

**Data Storage Strategy**: Utilizes Drizzle ORM with PostgreSQL dialect, abstracting CRUD operations for users, health assessments, metrics, and recommendations.

### Database Design

**Schema Architecture**: Drizzle ORM with PostgreSQL is used for type-safe database operations. The schema includes tables for Users (integrated with Firebase authentication), Health Assessments (comprehensive health data), Health Metrics (calculated values like biological age), and a Recommendations system.

**Data Validation**: Zod schemas are employed for runtime type checking and validation, with drizzle-zod for seamless database schema validation.

### Authentication System

**Firebase Authentication**: Integrates Firebase Auth for user management, including Google OAuth sign-in. Firebase UID is the primary user identifier, and a redirect-based authentication flow is used. Session management is handled with React hooks and Firebase's `onAuthStateChanged` listener.

**User Routing Logic**: 
- New users (sign-ups) are automatically redirected to `/assessment` to complete their initial health assessment
- Existing users are redirected to `/dashboard` after successful login
- The system tracks new user status through the authentication hook to ensure proper routing

### Development and Build Process

**TypeScript Configuration**: Strict TypeScript setup with path mapping (`@/` for client, `@shared` for shared types).

**Build Pipeline**: Vite for frontend bundling and esbuild for server compilation, optimized for both development and production.

**Code Organization**: A monorepo structure clearly separates client, server, and shared code, enabling type sharing between frontend and backend.

### Key Features and Implementations

- **AI-Powered Health Assessment**: Advanced health modeling for biological age calculations, vitality scores, and AI-powered health assistant features with symptom analysis.
- **Personalized Recommendations**: System for generating personalized advice based on assessment data.
- **Wearable Integration**: Support for Garmin, Whoop, Oura Ring, and Apple Health, with data normalization and multi-device priority merging.
- **Referral System**: Comprehensive referral tracking with unique codes, API routes, and a dedicated UI for managing referrals.
- **Mobile-First Design**: Optimized health assessment forms and UI components for mobile devices, ensuring responsive touch targets and improved readability.
- **Robust Error Handling**: Comprehensive error boundary implementation, centralized error handling utilities, and safe parsing for data.
- **Resource Optimization**: Implemented strategies for memory reduction, optimized React Query cache settings, and lazy loading for components.
- **Authentication & Routing**: Protected routes and auto-redirection based on authentication status. New users are directed to assessment, existing users to their dashboard.
- **Privacy Policy**: Comprehensive privacy policy page with GDPR/HIPAA alignment, wearable data coverage, and user rights management.

## External Dependencies

### Core Framework Dependencies
- **React 18**
- **Express.js**
- **Vite**
- **Node.js**

### UI and Styling
- **shadcn/ui**
- **Tailwind CSS**
- **Radix UI**
- **Lucide React**

### Database and ORM
- **Drizzle ORM**
- **PostgreSQL** (configured for Neon)
- **@neondatabase/serverless**

### Authentication
- **Firebase Authentication**
- **Google OAuth**

### State Management and Data Fetching
- **TanStack Query (React Query)**
- **React Hook Form**
- **Zod**

### Utility Libraries
- **date-fns**
- **clsx**
- **tailwind-merge**
- **nanoid**
- **class-variance-authority**