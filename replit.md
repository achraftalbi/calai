# Overview

CalAI is an AI-powered mobile web application that provides automatic food recognition and nutritional analysis through photo capture. The app allows users to scan food images with their camera or upload photos to receive detailed nutritional information including calories, macronutrients (protein, carbs, fat), and daily tracking capabilities. Built as a Progressive Web App (PWA), it provides a native mobile experience while running in the browser.

The application combines computer vision AI for food recognition with nutritional analysis to help users track their dietary intake without manual data entry. It features a clean, mobile-first interface with real-time camera integration and comprehensive analytics for health-conscious users.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and component-based architecture
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible UI components
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **PWA Features**: Service worker for offline functionality, manifest for app-like experience

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript throughout the application
- **API Pattern**: RESTful API endpoints for user management, food scanning, and data retrieval
- **File Processing**: Image upload handling with Google Cloud Storage integration
- **Error Handling**: Centralized error middleware with proper HTTP status codes

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database for serverless PostgreSQL hosting
- **Schema Management**: Drizzle Kit for database migrations and schema updates
- **Development Storage**: In-memory storage implementation for rapid development
- **File Storage**: Google Cloud Storage for image assets with ACL-based access control

## AI and External Services Integration
- **Computer Vision**: OpenAI GPT-4 Vision API for food recognition and analysis from images
- **Nutritional Data**: Edamam Nutrition Analysis API as primary nutrition data source with AI fallback
- **Image Analysis**: Base64 image encoding for AI processing with confidence scoring
- **Fallback Strategy**: AI-generated nutritional estimates when external APIs are unavailable

## Authentication and Security
- **File Access Control**: Custom ACL system for object-level permissions using Google Cloud Storage metadata
- **API Security**: Request validation using Zod schemas for type safety
- **Environment Configuration**: Environment-based configuration for API keys and database connections

## Mobile-First Design Decisions
- **Progressive Web App**: Manifest configuration for app installation and offline functionality
- **Camera Integration**: Native device camera access through WebRTC MediaDevices API
- **Touch-Optimized UI**: Mobile-first responsive design with touch-friendly interactions
- **Bottom Navigation**: Native mobile app navigation pattern for improved usability
- **Image Upload**: Multiple upload methods (camera capture, file selection) with Uppy integration
- **Automatic Activity Tracking**: Google Fit integration for background fitness monitoring with phone notifications

## Enhanced Calorie Calculation System
- **MET-Based Calculations**: Scientific Metabolic Equivalent of Task values for 30+ activities
- **Personalized Formula**: `(MET × weight × 3.5) / 200` for accurate calorie estimation
- **Activity Recognition**: Automatic classification of walking, running, cycling, swimming, strength training
- **Real-time Synchronization**: Background sync with Google Fit every hour plus manual refresh

## Performance and User Experience
- **Real-time Processing**: Streaming image analysis with progress indicators
- **Caching Strategy**: React Query for intelligent data caching and background updates
- **Offline Support**: Service worker implementation for core functionality without network
- **Optimized Builds**: Vite bundling with code splitting and tree shaking for minimal bundle size

# External Dependencies

## AI and Machine Learning Services
- **OpenAI GPT-4 Vision**: Primary computer vision service for food recognition and nutritional analysis
- **Edamam Nutrition API**: Professional nutrition database for accurate macro and micronutrient data
- **Google Fit API**: Automatic activity tracking, step counting, and fitness data synchronization

## Authentication and Fitness Integration
- **Google OAuth 2.0**: Secure authentication for Google Fit integration with fitness data access
- **Google Fit Activity Recognition**: Automatic detection of walking, running, cycling, swimming activities

## Cloud Infrastructure
- **Google Cloud Storage**: Object storage for user-uploaded food images with custom ACL policies
- **Neon Database**: Serverless PostgreSQL database hosting with automatic scaling

## Development and Deployment
- **Replit Platform**: Development environment with integrated deployment pipeline
- **Vite Development Server**: Hot module replacement and fast development builds

## Frontend Libraries
- **Radix UI**: Accessible, unstyled UI primitives for complex components
- **Uppy**: File upload handling with progress tracking and multiple input methods
- **TanStack Query**: Server state management with caching, background updates, and error handling
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

## Database and ORM
- **Drizzle ORM**: Type-safe database operations with PostgreSQL support
- **Drizzle Kit**: Database migration management and schema synchronization