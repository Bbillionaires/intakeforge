param(
    [Parameter(Mandatory = $true)] [string] $ProjectId,
    [Parameter(Mandatory = $true)] [string] $Region,
    [Parameter(Mandatory = $true)] [string] $GoogleClientId,
    [Parameter(Mandatory = $true)] [string] $GoogleClientSecret,
    [Parameter(Mandatory = $true)] [string] $FrontendBaseUrl,
    [Parameter(Mandatory = $true)] [string] $DatabaseUrl,
    [Parameter(Mandatory = $true)] [string] $SecretKey,
    [string] $ServiceName = "intakeforge-backend"
)

$ErrorActionPreference = "Stop"

Write-Host "Configuring Google Cloud project: $ProjectId"
gcloud config set project $ProjectId

Write-Host "Enabling required Google Cloud services..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

$image = "gcr.io/$ProjectId/$ServiceName"

Write-Host "Building backend container: $image"
gcloud builds submit --tag $image ./backend

Write-Host "Deploying Cloud Run service: $ServiceName"
gcloud run deploy $ServiceName `
    --image $image `
    --platform managed `
    --region $Region `
    --allow-unauthenticated

$backendUrl = gcloud run services describe $ServiceName --region $Region --format "value(status.url)"
$redirectUri = "$backendUrl/auth/google/callback"

Write-Host "Updating Cloud Run environment variables..."
gcloud run services update $ServiceName `
    --region $Region `
    --set-env-vars "GOOGLE_CLIENT_ID=$GoogleClientId,GOOGLE_CLIENT_SECRET=$GoogleClientSecret,GOOGLE_REDIRECT_URI=$redirectUri,FRONTEND_BASE_URL=$FrontendBaseUrl,DATABASE_URL=$DatabaseUrl,SECRET_KEY=$SecretKey"

Write-Host ""
Write-Host "Backend deployed successfully."
Write-Host "Backend URL: $backendUrl"
Write-Host "Google OAuth redirect URI to add in Google Cloud Credentials: $redirectUri"
Write-Host "Set this in Vercel: NEXT_PUBLIC_API_BASE_URL=$backendUrl"
