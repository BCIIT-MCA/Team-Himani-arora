# Supabase Secrets Setup Guide

Since the Gemini API is used in Supabase Edge Functions (server-side), the API key needs to be stored as a Supabase secret, not in the frontend environment variables.

## Setting up Gemini API Key in Supabase

### Method 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):

   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:

   ```bash
   npx supabase login
   ```

3. **Link your project**:

   ```bash
   npx supabase link --project-ref dpqgltdclemskpvwolpi
   ```

4. **Set the Gemini API Key as a secret**:

   ```bash
   npx supabase secrets set GEMINI_API_KEY=your_gemini_api_key
   ```

5. **Verify the secret was set**:
   ```bash
   npx supabase secrets list
   ```

### Method 2: Using Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/dpqgltdclemskpvwolpi
2. Navigate to **Settings** → **Edge Functions**
3. Under **Secrets**, add:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `your_gemini_api_key`

### Method 3: Using Supabase REST API

```bash
curl -X POST 'https://api.supabase.com/v1/projects/dpqgltdclemskpvwolpi/secrets' \
-H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
-H "Content-Type: application/json" \
-d '{
   "name": "GEMINI_API_KEY",
   "value": "your_gemini_api_key"
}'
```

## Additional Required Secrets

You may also need to set these secrets for full functionality:

```bash
# For crisis analysis and other functions
npx supabase secrets set SUPABASE_URL=https://dpqgltdclemskpvwolpi.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Redeploy Edge Functions

After setting secrets, redeploy your edge functions:

```bash
npx supabase functions deploy ai
npx supabase functions deploy crisis-analysis
```

## Testing

Test that the AI function works:

```bash
curl -X POST 'https://dpqgltdclemskpvwolpi.supabase.co/functions/v1/ai' \
-H "Authorization: Bearer YOUR_ANON_KEY" \
-H "Content-Type: application/json" \
-d '{
  "message": "Hello, I need some help with anxiety",
  "userId": "test-user",
  "userLanguage": "en"
}'
```

## Notes

- Edge Function secrets are separate from your frontend environment variables
- Secrets are encrypted and only accessible to your Edge Functions
- Changes to secrets require redeploying the functions
- Never commit API keys to your repository
