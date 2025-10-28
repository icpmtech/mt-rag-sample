# Setup Microsoft Entra ID Applications for Azure Search OpenAI Chat
# This script automates the manual setup process described in the documentation

param(
    [Parameter(Mandatory=$false)]
    [string]$TenantId = "0042b95c-6e30-46f0-8d54-dab005f92d70",
    
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

    Write-Host "Setting up Microsoft Entra ID applications..." -ForegroundColor Green

    # ===== SERVER APP SETUP =====
    Write-Host "`n1. Creating Server Application..." -ForegroundColor Cyan
    
    # Create Server App
    $serverApp = New-MgApplication -DisplayName "Azure Search OpenAI Chat API" `
        -SignInAudience "AzureADMyOrg" `
        -RequiredResourceAccess @(
            @{
                ResourceAppId = "00000003-0000-0000-c000-000000000000" # Microsoft Graph
                ResourceAccess = @(
                    @{
                        Id = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
                        Type = "Scope"
                    }
                )
            }
        )

    $serverId = $serverApp.AppId
    Write-Host "Server App created with ID: $serverId" -ForegroundColor Green
    
    # Set azd environment variable for server app ID
    & azd env set AZURE_SERVER_APP_ID $serverId
    
    # Create client secret for server app
    Write-Host "Creating client secret for server app..." -ForegroundColor Yellow
    $serverSecret = Add-MgApplicationPassword -ApplicationId $serverApp.Id -PasswordCredential @{
        DisplayName = "Azure Search OpenAI Chat Key"
        EndDateTime = (Get-Date).AddYears(2)
    }
    
    $serverSecretValue = $serverSecret.SecretText
    Write-Host "Server App Secret created" -ForegroundColor Green
    
    # Set azd environment variable for server app secret
    & azd env set AZURE_SERVER_APP_SECRET $serverSecretValue
    
    # Configure Application ID URI for server app
    Write-Host "Configuring Application ID URI..." -ForegroundColor Yellow
    $appIdUri = "api://$serverId"
    Update-MgApplication -ApplicationId $serverApp.Id -IdentifierUris @($appIdUri)
    
    # Add API scope for server app
    Write-Host "Adding API scope for server app..." -ForegroundColor Yellow
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
    
    Update-MgApplication -ApplicationId $serverApp.Id -Api @{
        Oauth2PermissionScopes = @($apiScope)
    }
    
    Write-Host "Server App configuration completed" -ForegroundColor Green

    # ===== CLIENT APP SETUP =====
    Write-Host "`n2. Creating Client Application..." -ForegroundColor Cyan
    
    # Define redirect URIs
    $redirectUris = @(
        "http://localhost:50505/redirect",
        "http://localhost:5173/redirect",
        "$AppEndpoint/redirect"
    )
    
    $webRedirectUris = @(
        "$AppEndpoint/.auth/login/aad/callback"
    )
    
    # Create Client App (SPA)
    $clientApp = New-MgApplication -DisplayName "Azure Search OpenAI Chat Web App" `
        -SignInAudience "AzureADMyOrg" `
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
                ResourceAppId = $serverId # Server App
                ResourceAccess = @(
                    @{
                        Id = $apiScope.Id # access_as_user scope
                        Type = "Scope"
                    }
                )
            }
        )

    $clientId = $clientApp.AppId
    Write-Host "Client App created with ID: $clientId" -ForegroundColor Green
    
    # Set azd environment variable for client app ID
    & azd env set AZURE_CLIENT_APP_ID $clientId
    
    # ===== CONFIGURE SERVER APP KNOWN CLIENT APPLICATIONS =====
    Write-Host "`n3. Configuring Server App Known Client Applications..." -ForegroundColor Cyan
    
    Update-MgApplication -ApplicationId $serverApp.Id -Api @{
        KnownClientApplications = @($clientId)
        Oauth2PermissionScopes = @($apiScope)
    }
    
    Write-Host "Known client applications configured" -ForegroundColor Green

    # ===== SUMMARY =====
    Write-Host "`n" + "="*60 -ForegroundColor Green
    Write-Host "SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "="*60 -ForegroundColor Green
    Write-Host ""
    Write-Host "Server App ID: $serverId" -ForegroundColor Cyan
    Write-Host "Client App ID: $clientId" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Redirect URIs configured:" -ForegroundColor Yellow
    foreach ($uri in $redirectUris) {
        Write-Host "  - $uri" -ForegroundColor White
    }
    foreach ($uri in $webRedirectUris) {
        Write-Host "  - $uri" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Environment variables have been set automatically:" -ForegroundColor Yellow
    Write-Host "  - AZURE_SERVER_APP_ID" -ForegroundColor White
    Write-Host "  - AZURE_SERVER_APP_SECRET" -ForegroundColor White
    Write-Host "  - AZURE_CLIENT_APP_ID" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "1. Run 'azd up' to redeploy with authentication settings" -ForegroundColor White
    Write-Host "2. Test the application login functionality" -ForegroundColor White
    Write-Host "3. Configure document-level access control as needed" -ForegroundColor White
    Write-Host ""
    
    # Optional: Show admin consent URL
    $consentUrl = "https://login.microsoftonline.com/$TenantId/adminconsent?client_id=$clientId"
    Write-Host "Admin consent URL (if needed): $consentUrl" -ForegroundColor Magenta

} catch {
    Write-Error "Error occurred during setup: $($_.Exception.Message)"
    Write-Host "Please check your permissions and try again." -ForegroundColor Red
} finally {
    # Disconnect from Microsoft Graph
    Disconnect-MgGraph -ErrorAction SilentlyContinue
}