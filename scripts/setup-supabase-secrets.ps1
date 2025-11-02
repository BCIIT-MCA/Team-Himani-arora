# PowerShell script to set up Supabase secrets
# Run this script to configure the Gemini API key and other required secrets

Write-Host "Setting up Supabase secrets for Solace Connect Flow..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = npx supabase --version
    Write-Host "Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "Supabase CLI not found. Installing..." -ForegroundColor Red
    npm install -g supabase
}

# Project configuration
$PROJECT_REF = "dpqgltdclemskpvwolpi"
$GEMINI_API_KEY = "AIzaSyDYG8mbywdefXjvf2fezRD7Fe1NRwoNzHs"
$SUPABASE_URL = "https://dpqgltdclemskpvwolpi.supabase.co"

Write-Host "Linking to Supabase project..." -ForegroundColor Yellow

# Link to the project
try {
    npx supabase link --project-ref $PROJECT_REF
    Write-Host "Successfully linked to project" -ForegroundColor Green
} catch {
    Write-Host "Project linking failed or already linked" -ForegroundColor Yellow
}

Write-Host "Setting up secrets..." -ForegroundColor Yellow

# Set secrets
$secrets = @{
    "GEMINI_API_KEY" = $GEMINI_API_KEY
    "SUPABASE_URL" = $SUPABASE_URL
}

foreach ($secret in $secrets.GetEnumerator()) {
    try {
        npx supabase secrets set "$($secret.Key)=$($secret.Value)"
        Write-Host "Set secret: $($secret.Key)" -ForegroundColor Green
    } catch {
        Write-Host "Failed to set secret: $($secret.Key)" -ForegroundColor Red
    }
}

Write-Host "Listing current secrets..." -ForegroundColor Yellow
try {
    npx supabase secrets list
} catch {
    Write-Host "Failed to list secrets" -ForegroundColor Red
}

Write-Host "Deploying Edge Functions..." -ForegroundColor Yellow

# Deploy functions
$functions = @("ai", "crisis-analysis")

foreach ($func in $functions) {
    try {
        npx supabase functions deploy $func
        Write-Host "Deployed function: $func" -ForegroundColor Green
    } catch {
        Write-Host "Failed to deploy function: $func" -ForegroundColor Red
    }
}

Write-Host "Setup complete! Your Supabase secrets are configured." -ForegroundColor Green
Write-Host "Note: If you encounter issues, check the setup-supabase-secrets.md guide" -ForegroundColor Cyan