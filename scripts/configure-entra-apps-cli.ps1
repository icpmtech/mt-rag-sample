# Simple configuration script for Microsoft Entra ID Applications
# This script uses Azure CLI to configure the existing applications

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerAppId = "40ec5965-fe34-458b-937a-eda0f8dd4e39",
    
    [Parameter(Mandatory=$false)]
    [string]$ClientAppId = "3fd411da-0739-4255-b74b-b81dfe4c6156",
    
    [Parameter(Mandatory=$false)]
    [string]$AppEndpoint = "https://capps-backend-dmauu4o3w36h6.ambitioushill-0eabadf8.eastus.azurecontainerapps.io"
)

Write-Host "Configuring Microsoft Entra ID Applications using Azure CLI..." -ForegroundColor Green

try {
    # Check if user is logged in to Azure CLI
    $account = az account show 2>$null | ConvertFrom-Json
    if (-not $account) {
        Write-Host "Please login to Azure CLI first: az login" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Cyan
    Write-Host "Tenant: $($account.tenantId)" -ForegroundColor Cyan

    # ===== CONFIGURE SERVER APP =====
    Write-Host "`n1. Configuring Server Application ($ServerAppId)..." -ForegroundColor Yellow
    
    # Set Application ID URI for server app
    $appIdUri = "api://$ServerAppId"
    Write-Host "Setting Application ID URI to: $appIdUri" -ForegroundColor White
    az ad app update --id $ServerAppId --identifier-uris $appIdUri
    
    # Create and expose API scope
    Write-Host "Creating API scope 'access_as_user'..." -ForegroundColor White
    $scopeId = [System.Guid]::NewGuid().ToString()
    
    $apiManifest = @{
        oauth2Permissions = @(
            @{
                adminConsentDescription = "Allows the app to access Azure Search OpenAI Chat API as the signed-in user."
                adminConsentDisplayName = "Access Azure Search OpenAI Chat API"
                id = $scopeId
                isEnabled = $true
                type = "User"
                userConsentDescription = "Allow the app to access Azure Search OpenAI Chat API on your behalf"
                userConsentDisplayName = "Access Azure Search OpenAI Chat API"
                value = "access_as_user"
            }
        )
    } | ConvertTo-Json -Depth 10 -Compress
    
    # Write manifest to temp file
    $tempFile = [System.IO.Path]::GetTempFileName()
    $apiManifest | Out-File -FilePath $tempFile -Encoding UTF8
    
    # Update server app with API manifest
    az ad app update --id $ServerAppId --set api=@$tempFile
    
    # Configure known client applications
    Write-Host "Adding client app as known client application..." -ForegroundColor White
    az ad app update --id $ServerAppId --set "api.knownClientApplications=[`"$ClientAppId`"]"
    
    # Clean up temp file
    Remove-Item $tempFile -Force

    # ===== CONFIGURE CLIENT APP =====
    Write-Host "`n2. Configuring Client Application ($ClientAppId)..." -ForegroundColor Yellow
    
    # Configure redirect URIs for SPA
    $spaRedirectUris = @(
        "http://localhost:50505/redirect",
        "http://localhost:5173/redirect",
        "$AppEndpoint/redirect"
    ) -join '","'
    
    $webRedirectUris = @(
        "$AppEndpoint/.auth/login/aad/callback"
    ) -join '","'
    
    Write-Host "Setting SPA redirect URIs..." -ForegroundColor White
    az ad app update --id $ClientAppId --set "spa.redirectUris=[`"$spaRedirectUris`"]"
    
    Write-Host "Setting Web redirect URIs..." -ForegroundColor White
    az ad app update --id $ClientAppId --set "web.redirectUris=[`"$webRedirectUris`"]"
    
    Write-Host "Enabling ID token issuance..." -ForegroundColor White
    az ad app update --id $ClientAppId --set "web.implicitGrantSettings.enableIdTokenIssuance=true"
    
    # Configure required resource access
    Write-Host "Configuring API permissions..." -ForegroundColor White
    
    $requiredResourceAccess = @(
        @{
            resourceAppId = "00000003-0000-0000-c000-000000000000" # Microsoft Graph
            resourceAccess = @(
                @{
                    id = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
                    type = "Scope"
                }
            )
        },
        @{
            resourceAppId = $ServerAppId # Server App
            resourceAccess = @(
                @{
                    id = $scopeId # access_as_user scope
                    type = "Scope"
                }
            )
        }
    ) | ConvertTo-Json -Depth 10 -Compress
    
    $tempFile2 = [System.IO.Path]::GetTempFileName()
    $requiredResourceAccess | Out-File -FilePath $tempFile2 -Encoding UTF8
    
    az ad app update --id $ClientAppId --set requiredResourceAccess=@$tempFile2
    
    # Clean up temp file
    Remove-Item $tempFile2 -Force

    # ===== SUMMARY =====
    Write-Host "`n" + "="*70 -ForegroundColor Green
    Write-Host "CONFIGURATION COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "="*70 -ForegroundColor Green
    Write-Host ""
    Write-Host "Server App ID: $ServerAppId" -ForegroundColor Cyan
    Write-Host "  - Application ID URI: $appIdUri" -ForegroundColor White
    Write-Host "  - API Scope: access_as_user" -ForegroundColor White
    Write-Host ""
    Write-Host "Client App ID: $ClientAppId" -ForegroundColor Cyan
    Write-Host "  - SPA Redirect URIs configured" -ForegroundColor White
    Write-Host "  - Web Redirect URIs configured" -ForegroundColor White
    Write-Host "  - API Permissions configured" -ForegroundColor White
    Write-Host ""
    Write-Host "Configured endpoints:" -ForegroundColor Yellow
    Write-Host "  - $AppEndpoint/redirect" -ForegroundColor White
    Write-Host "  - $AppEndpoint/.auth/login/aad/callback" -ForegroundColor White
    Write-Host "  - http://localhost:50505/redirect" -ForegroundColor White
    Write-Host "  - http://localhost:5173/redirect" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "1. Grant admin consent for the applications (if required)" -ForegroundColor White
    Write-Host "2. Run 'azd up' to redeploy with authentication settings" -ForegroundColor White
    Write-Host "3. Test the application login functionality" -ForegroundColor White
    Write-Host ""
    
    # Show admin consent URL
    $tenantId = $account.tenantId
    $consentUrl = "https://login.microsoftonline.com/$tenantId/adminconsent?client_id=$ClientAppId"
    Write-Host "Admin consent URL: $consentUrl" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Applications configured successfully!" -ForegroundColor Green

} catch {
    Write-Error "Error occurred during configuration: $($_.Exception.Message)"
    Write-Host "Please check your permissions and try again." -ForegroundColor Red
}