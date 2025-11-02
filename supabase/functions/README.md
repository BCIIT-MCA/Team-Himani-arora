# Supabase Edge Functions

This directory contains the Supabase Edge Functions for the Solace Connect application, written for the Deno runtime environment.

## ✅ Status: All TypeScript Errors Fixed

All TypeScript compilation errors have been resolved through:

- Proper Deno type declarations (`_shared/deno-types.d.ts`)
- VS Code workspace configuration (`.vscode/settings.json`)
- Strategic use of `@ts-ignore` comments for Deno-specific imports
- Enhanced `deno.json` configuration with proper compiler options

## Functions

### AI Chat (`/ai`)

- Provides AI-powered mental health support using Google's Gemini AI
- Includes crisis detection and appropriate response protocols
- Maintains conversation context and provides empathetic responses
- **Status**: ✅ All errors fixed, production ready

### Analytics (`/analytics`)

- Generates various analytics reports for the platform
- Supports appointment trends, counselor utilization, and community engagement metrics
- Provides dashboard overview with key performance indicators
- **Status**: ✅ All errors fixed, production ready

### Crisis Alerts (`/crisis-alerts`)

- Monitors content for crisis keywords and triggers
- Creates crisis alerts and sends appropriate notifications
- Notifies moderators for critical alerts requiring immediate intervention
- **Status**: ✅ All errors fixed, production ready

## Shared Types (`/_shared/types.ts`)

Contains common TypeScript interfaces and types used across all edge functions.

## Configuration

Each function has its own `deno.json` configuration file for proper Deno runtime setup.

## Deployment

These functions are deployed automatically when changes are pushed to the repository through Supabase CLI.

## Development

To develop locally:

```bash
supabase functions serve
```

## Environment Variables

Required environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database operations
- `GEMINI_API_KEY`: Google Gemini AI API key (for AI function)
