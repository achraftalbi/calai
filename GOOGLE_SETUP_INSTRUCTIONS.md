# Google Cloud Console Setup for CalAI Google Fit Integration

## Step-by-Step Instructions

### 1. Create/Access Google Cloud Project
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing one
- Note your project name

### 2. Enable Google Fitness API
- In the left sidebar, go to "APIs & Services" > "Library"
- Search for "Fitness API"
- Click on "Fitness API" and click "Enable"

### 3. Configure OAuth Consent Screen
- Go to "APIs & Services" > "OAuth consent screen"
- Choose "External" user type
- Fill in required fields:
  - App name: `CalAI`
  - User support email: Your email
  - App logo: Optional
  - Developer contact information: Your email

**Important Domain Settings:**
- In "Authorized domains" section, add: `picard.replit.dev`
- This authorizes all Replit development domains

### 4. Add Scopes
- Click "Add or Remove Scopes"
- Add these scopes:
  - `https://www.googleapis.com/auth/fitness.activity.read`
  - `https://www.googleapis.com/auth/fitness.body.read`
  - `https://www.googleapis.com/auth/fitness.location.read`

### 5. Add Test Users (For Development)
- In "Test users" section, add your Gmail address
- This allows you to test during development

### 6. Create OAuth 2.0 Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth 2.0 Client ID"
- Application type: "Web application"
- Name: `CalAI Google Fit Integration`

**Add Authorized Redirect URIs:**
```
https://04d06bf7-91eb-4e57-9fb8-11c503c6c11c-00-2vihdi71rs7wg.picard.replit.dev/api/auth/google-fit/callback
```

### 7. Copy Credentials
- Copy the Client ID (starts with numbers, ends with .googleusercontent.com)
- Copy the Client Secret (random string)
- These are already configured in your Replit secrets

### 8. Publish App (Optional for Testing)
- For production use, you'll need to submit for verification
- For testing, you can use it in "Testing" mode with your Gmail account

## Current Status
✅ GOOGLE_CLIENT_ID configured
✅ GOOGLE_CLIENT_SECRET configured  
✅ Callback URL: `https://04d06bf7-91eb-4e57-9fb8-11c503c6c11c-00-2vihdi71rs7wg.picard.replit.dev/api/auth/google-fit/callback`
⏳ Waiting for Google Cloud Console setup

## After Setup
Once configured, you can:
1. Connect Google Fit from CalAI Coach page
2. Automatically track walking, running, cycling
3. Get real-time phone notifications for activities
4. View synced activities with automatic calorie calculations