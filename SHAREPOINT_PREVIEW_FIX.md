# SharePoint Preview Issue Fix

## Problem Description

The error "Item does not exist. It may have been deleted by another user." occurs when trying to preview SharePoint documents through the iframe embedding functionality. This typically happens due to:

1. **Authentication Issues**: Graph API calls failing due to insufficient permissions
2. **URL Parsing Problems**: Incorrect parsing of SharePoint URLs leading to invalid document references  
3. **Document Access Permissions**: The document exists but isn't accessible through the preview methods
4. **Cross-Origin Issues**: SharePoint blocking iframe embedding for security reasons

## Root Causes

### 1. Graph API Authentication
- The Microsoft Graph API requires specific permissions to access SharePoint documents
- Missing or incorrect authentication configuration
- Token scope issues (need `Sites.Read.All` or `Files.Read.All`)

### 2. SharePoint URL Structure
- Different SharePoint URL formats require different parsing logic
- Library names and file paths can contain encoded characters
- Document libraries vs lists have different URL structures

### 3. Embed URL Generation
- SharePoint has multiple embed URL formats depending on file type
- PDF files need different embed parameters than Office documents
- Some documents require WopiFrame instead of Doc.aspx

## Solutions Implemented

### 1. Enhanced URL Parsing
```python
def parse_sharepoint_url(self, sharepoint_url: str) -> Optional[Dict[str, str]]:
    """Enhanced SharePoint URL parsing with better error handling"""
    # Handles various SharePoint URL formats
    # Supports encoded characters and special library names
    # Returns structured information about site, library, and file
```

### 2. Multiple Embed Strategies
```python
def get_embed_url(self, sharepoint_url: str) -> Optional[str]:
    """Generate SharePoint embed URL using multiple strategies"""
    # Strategy 1: Doc.aspx for general documents
    # Strategy 2: WopiFrame for Office documents  
    # Strategy 3: PDF-specific embedding with wdStartOn parameter
```

### 3. Progressive Fallback Logic
```typescript
const tryGraphAPIPreview = async (): Promise<boolean> => {
    // Try Graph API first (most reliable)
}

const trySharePointEmbed = (): boolean => {
    // Fallback to direct SharePoint embed URLs
    // Uses file-type specific embedding strategies
}

// Final fallback: Open in new tab
```

### 4. Better Error Detection
```typescript
onLoad={(e) => {
    // Enhanced iframe load detection
    // Checks for error pages in loaded content
    // Automatic fallback on detected errors
}}
```

## Configuration Required

### 1. Graph API Permissions
Add these permissions to your Azure AD app registration:
- `Sites.Read.All` - Read SharePoint sites
- `Files.Read.All` - Read files in SharePoint
- `User.Read` - Basic user profile

### 2. SharePoint App Settings
In your `.env` file or Azure configuration:
```
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret  
AZURE_TENANT_ID=your-tenant-id
```

### 3. SharePoint Site Permissions
Ensure the application has access to the SharePoint sites:
- Add the app as a site collection admin, or
- Grant appropriate permissions through SharePoint Admin Center

## Testing the Fix

### 1. Run the Application
```bash
cd app
npm run dev  # Start frontend
```

```bash  
cd app/backend
python -m quart run --reload  # Start backend
```

### 2. Test Different Document Types
Try documents with different extensions:
- `.pdf` files (should use PDF-specific embed)
- `.docx` files (should use WopiFrame)
- `.xlsx` files (should use WopiFrame)  
- Other formats (should use Doc.aspx)

### 3. Check Browser Console
Monitor the browser console for:
- Preview method progression (Graph API → Embed → New Tab)
- URL generation success/failure
- Iframe loading errors

### 4. Verify Backend Logs
Check backend logs for:
- SharePoint URL parsing results
- Graph API authentication status
- Preview URL generation success

## Troubleshooting

### Common Issues and Solutions

#### 1. "Item does not exist" Error
**Causes:**
- Document path parsing incorrect
- Missing authentication permissions
- Document moved or deleted

**Solutions:**
- Check URL parsing logic in browser console
- Verify Graph API permissions in Azure AD
- Test document access directly in SharePoint

#### 2. Iframe Shows Error Page
**Causes:**
- SharePoint blocking iframe embedding
- Authentication required for document access
- CORS policy restrictions

**Solutions:**
- Check if document requires authentication
- Try different embed URL formats
- Use "Open in New Tab" as final fallback

#### 3. Preview Loading Forever
**Causes:**
- Network connectivity issues
- Graph API rate limiting
- Invalid embed URLs

**Solutions:**
- Check network connectivity to SharePoint
- Implement retry logic with exponential backoff
- Validate embed URL format

#### 4. Authentication Failures
**Causes:**
- Invalid client credentials
- Missing API permissions
- Token expiration

**Solutions:**
- Verify Azure AD app registration
- Check token refresh logic
- Ensure proper scope configuration

## Development Notes

### Adding New Preview Methods
To add support for new document types or preview methods:

1. **Backend**: Extend `get_embed_url()` in `sharepoint_graph.py`
2. **Frontend**: Add new preview strategy in `SharePointViewer.tsx`
3. **Testing**: Add test cases for new document types

### Monitoring and Logging
The implementation includes comprehensive logging:
- Backend logs Graph API interactions
- Frontend logs preview method progression  
- Error details for troubleshooting

### Performance Considerations
- Graph API calls are cached where possible
- Fallback methods are tried in order of reliability
- Failed methods are skipped on subsequent attempts

## Summary

The SharePoint preview functionality now includes:
- ✅ Enhanced URL parsing for various SharePoint formats
- ✅ Multiple embed strategies based on file type
- ✅ Progressive fallback logic (Graph API → Embed → New Tab)
- ✅ Better error detection and handling
- ✅ Comprehensive logging for troubleshooting
- ✅ Support for different document types (PDF, Office, etc.)

This should resolve the "Item does not exist" error and provide a robust preview experience for SharePoint documents.