# Configure existing Microsoft Entra ID Applications for Azure Search OpenAI Chat
# This script configures the existing server and client apps with the correct settings

param(
    [Parameter(Mandatory=$false)]
    [string]$TenantId = "0042b95c-6e30-46f0-8d54-dab005f92d70",
    
    [Parameter(Mandatory=$false)]
    [string]$ServerAppId = "40ec5965-fe34-458b-937a-eda0f8dd4e39",
    
    [Parameter(Mandatory=$false)]
    [string]$ClientAppId = "3fd411da-0739-4255-b74b-b81dfe4c6156",
    
    [Parameter(Mandatory=$false)]
    [string]$AppEndpoint = "https://capps-backend-dmauu4o3w36h6.ambitioushill-0eabadf8.eastus.azurecontainerapps.io"
)

# Check if Microsoft Graph PowerShell module is installed
if (-not (Get-Module -ListAvailable -Name Microsoft.Graph)) {
    Write-Host "Installing Microsoft Graph PowerShell module..." -ForegroundColor Yellow
    Install-Module Microsoft.Graph -Scope CurrentUser -Force
}

# Import required modules
Import-Module Microsoft.Graph.Applications
Import-Module Microsoft.Graph.Authentication

try {
    # Connect to Microsoft Graph with required permissions
    Write-Host "Connecting to Microsoft Graph..." -ForegroundColor Green
    Connect-MgGraph -TenantId $TenantId -Scopes "Application.ReadWrite.All", "Directory.Read.All"

    Write-Host "Configuring existing Microsoft Entra ID applications..." -ForegroundColor Green

    # Get the existing applications
    Write-Host "`n1. Getting Server Application..." -ForegroundColor Cyan
    $serverApps = Get-MgApplication -Filter "appId eq '$ServerAppId'"
    if ($serverApps.Count -eq 0) {
        throw "Server application with ID $ServerAppId not found"
    }
    $serverApp = $serverApps[0]
    Write-Host "Found Server App: $($serverApp.DisplayName)" -ForegroundColor Green

    Write-Host "`n2. Getting Client Application..." -ForegroundColor Cyan
    $clientApps = Get-MgApplication -Filter "appId eq '$ClientAppId'"
    if ($clientApps.Count -eq 0) {
        throw "Client application with ID $ClientAppId not found"
    }
    $clientApp = $clientApps[0]
    Write-Host "Found Client App: $($clientApp.DisplayName)" -ForegroundColor Green

    # ===== CONFIGURE SERVER APP =====
    Write-Host "`n3. Configuring Server Application..." -ForegroundColor Cyan
    
    # Configure Application ID URI
    $appIdUri = "api://$ServerAppId"
    Write-Host "Setting Application ID URI to: $appIdUri" -ForegroundColor Yellow
    
    # Create API scope
    $apiScope = @{
        AdminConsentDescription = "Allows the app to access Azure Search OpenAI Chat API as the signed-in user."
        AdminConsentDisplayName = "Access Azure Search OpenAI Chat API"
        UserConsentDescription = "Allow the app to access Azure Search OpenAI Chat API on your behalf"
        UserConsentDisplayName = "Access Azure Search OpenAI Chat API"
        Value = "access_as_user"
        Type = "User"
        IsEnabled = $true
        Id = [System.Guid]::NewGuid().ToString()
    }
    
    # Update server app with API configuration
    Update-MgApplication -ApplicationId $serverApp.Id -IdentifierUris @($appIdUri) -Api @{
        Oauth2PermissionScopes = @($apiScope)
        KnownClientApplications = @($ClientAppId)
    }
    
    Write-Host "Server App API configuration completed" -ForegroundColor Green

    # ===== CONFIGURE CLIENT APP =====
    Write-Host "`n4. Configuring Client Application..." -ForegroundColor Cyan
    
    # Define redirect URIs
    $redirectUris = @(
        "http://localhost:50505/redirect",
        "http://localhost:5173/redirect",
        "$AppEndpoint/redirect"
    )
    
    $webRedirectUris = @(
        "$AppEndpoint/.auth/login/aad/callback"
    )
    
    Write-Host "Setting redirect URIs..." -ForegroundColor Yellow
    foreach ($uri in $redirectUris + $webRedirectUris) {
        Write-Host "  - $uri" -ForegroundColor White
    }
    
    # Update client app configuration
    Update-MgApplication -ApplicationId $clientApp.Id `
        -Spa @{
            RedirectUris = $redirectUris
        } `
        -Web @{
            RedirectUris = $webRedirectUris
            ImplicitGrantSettings = @{
                EnableIdTokenIssuance = $true
            }
        } `
        -RequiredResourceAccess @(
            @{
                ResourceAppId = "00000003-0000-0000-c000-000000000000" # Microsoft Graph
                ResourceAccess = @(
                    @{
                        Id = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
                        Type = "Scope"
                    }
                )
            },
            @{
                ResourceAppId = $ServerAppId # Server App
                ResourceAccess = @(
                    @{
                        Id = $apiScope.Id # access_as_user scope
                        Type = "Scope"
                    }
                )
            }
        )
    
    Write-Host "Client App configuration completed" -ForegroundColor Green

    # ===== SUMMARY =====
    Write-Host "`n" + "="*60 -ForegroundColor Green
    Write-Host "CONFIGURATION COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "="*60 -ForegroundColor Green
    Write-Host ""
    Write-Host "Server App: $($serverApp.DisplayName)" -ForegroundColor Cyan
    Write-Host "  - App ID: $ServerAppId" -ForegroundColor White
    Write-Host "  - Application ID URI: $appIdUri" -ForegroundColor White
    Write-Host ""
    Write-Host "Client App: $($clientApp.DisplayName)" -ForegroundColor Cyan
    Write-Host "  - App ID: $ClientAppId" -ForegroundColor White
    Write-Host ""
    Write-Host "Redirect URIs configured:" -ForegroundColor Yellow
    foreach ($uri in $redirectUris + $webRedirectUris) {
        Write-Host "  - $uri" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "1. Run 'azd up' to redeploy with authentication settings" -ForegroundColor White
    Write-Host "2. Test the application login functionality" -ForegroundColor White
    Write-Host "3. Grant admin consent if required" -ForegroundColor White
    Write-Host ""
    
    # Show admin consent URL
    $consentUrl = "https://login.microsoftonline.com/$TenantId/adminconsent?client_id=$ClientAppId"
    Write-Host "Admin consent URL: $consentUrl" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Configuration completed! You can now run 'azd up' to deploy with authentication." -ForegroundColor Green

} catch {
    Write-Error "Error occurred during configuration: $($_.Exception.Message)"
    Write-Host "Please check your permissions and try again." -ForegroundColor Red
    Write-Host "Make sure you have Application.ReadWrite.All permissions in Microsoft Graph." -ForegroundColor Yellow
} finally {
    # Disconnect from Microsoft Graph
    Disconnect-MgGraph -ErrorAction SilentlyContinue
}