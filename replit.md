# Overview

CalAI is an AI-powered mobile web application that provides automatic food recognition and nutritional analysis through photo capture. The app allows users to scan food images with their camera or upload photos to receive detailed nutritional information including calories, macronutrients (protein, carbs, fat), and daily tracking capabilities. Built as a Progressive Web App (PWA), it provides a native mobile experience while running in the browser.

The application combines computer vision AI for food recognition with nutritional analysis to help users track their dietary intake without manual data entry. It features a clean, mobile-first interface with real-time camera integration and comprehensive analytics for health-conscious users.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## August 22, 2025 - Native Android Build & Simplified Activity Tracking
- **Capacitor Native Setup**: Complete Android platform configuration for real device testing
- **Hybrid Motion Architecture**: Native Android sensors + web fallback with unified API
- **Simplified UX**: Device Motion + Strava only (Google Fit hidden for reduced friction)
- **Android Permissions**: Activity recognition, notifications, foreground service configured
- **Zero-Setup Focus**: Immediate device motion detection + optional Strava for sports

**Native Android Implementation:**
- **Real Sensor Access**: Hardware step counter and activity recognition APIs
- **Background Tracking**: Continuous step counting when screen locked (native only)
- **Development Workflow**: Live Replit backend + native shell for realistic testing
- **Build System**: Capacitor with Android Studio integration ready

**Simplified Integration Strategy:**
- **Primary**: Device Motion (zero setup, immediate walking/running detection)
- **Secondary**: Strava (one-click OAuth, comprehensive sports from watches)
- **Hidden**: Google Fit (preserved code, disabled UI for simpler onboarding)

**Testing Priority**: Focus on Device Motion accuracy with real Android sensors + Strava data merging
**Status**: Ready for native Android testing on Galaxy A53 to validate motion detection accuracy

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
- **Zero-Setup Activity Tracking**: Built-in device motion detection requiring no external app configuration
- **Google Fit Integration**: Optional external sync for users who prefer comprehensive health app connectivity

## Hybrid Activity Detection and Calorie System
- **Dual Tracking Architecture**: 
  - **Tier 1 - Device Motion**: Zero-setup walking/running detection while app is open (estimated data)
  - **Tier 2 - Strava Integration**: Complete sports coverage including watch data (measured data)
- **Smart De-duplication**: Prefers measured Strava calories over estimated device motion calculations
- **MET-Based Calculations**: Scientific Metabolic Equivalent of Task values for 30+ activities
- **Personalized Formula**: `(MET × weight × 3.5) / 200` for accurate calorie estimation
- **Data Confidence Scoring**: Clear distinction between estimated (device/manual) vs measured (Strava) data
- **Comprehensive Coverage**: Walking/running (immediate) + swimming/cycling/strength (comprehensive)
- **Real-time Notifications**: Instant activity detection alerts with background processing

## Performance and User Experience
- **Real-time Processing**: Streaming image analysis with progress indicators
- **Caching Strategy**: React Query for intelligent data caching and background updates
- **Offline Support**: Service worker implementation for core functionality without network
- **Optimized Builds**: Vite bundling with code splitting and tree shaking for minimal bundle size

# External Dependencies

## AI and Machine Learning Services
- **OpenAI GPT-4 Vision**: Primary computer vision service for food recognition and nutritional analysis
- **Edamam Nutrition API**: Professional nutrition database for accurate macro and micronutrient data
- **Google Fit API**: Legacy activity tracking integration (fallback option)
- **Strava API**: Comprehensive sports activity import including swimming, cycling, and watch-based workouts

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