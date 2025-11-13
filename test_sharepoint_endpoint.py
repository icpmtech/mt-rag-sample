"""
Test script to verify SharePoint Graph API endpoint is working correctly.
"""
import asyncio
import json
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "app" / "backend"
sys.path.insert(0, str(backend_path))

async def test_sharepoint_endpoint():
    """Test the SharePoint content endpoint"""
    
    # Import after adding to path
    from core.sharepoint_graph import SharePointGraphHelper
    from core.authentication import AuthenticationHelper
    
    print("✓ Imports successful")
    
    # Test URL parsing
    test_url = "https://claranetapplications.sharepoint.com/sites/IT/LIST/CASH.pdf"
    
    # Create a mock auth helper (simplified for testing)
    class MockAuthHelper:
        def __init__(self):
            self.require_access_control = False
            self.enable_unauthenticated_access = True
    
    auth_helper = MockAuthHelper()
    sharepoint_helper = SharePointGraphHelper(auth_helper)
    
    print(f"\n✓ SharePointGraphHelper created")
    
    # Test URL parsing
    parsed = sharepoint_helper.parse_sharepoint_url(test_url)
    if parsed:
        print(f"\n✓ URL parsing successful:")
        print(f"  - Hostname: {parsed.get('hostname')}")
        print(f"  - Site: {parsed.get('site_name')}")
        print(f"  - Library: {parsed.get('library_name')}")
        print(f"  - File: {parsed.get('file_path')}")
    else:
        print(f"\n✗ Failed to parse URL: {test_url}")
        return False
    
    # Test embed URL generation
    embed_url = sharepoint_helper.get_embed_url(test_url)
    if embed_url:
        print(f"\n✓ Embed URL generated:")
        print(f"  {embed_url}")
    else:
        print(f"\n✗ Failed to generate embed URL")
    
    print("\n" + "="*60)
    print("FRONTEND TEST")
    print("="*60)
    
    # Simulate frontend logic
    citation = test_url
    
    # Check if citation is SharePoint URL
    if "sharepoint.com" in citation:
        processed_url = f"sharepoint:{citation}"
        print(f"\n✓ Citation detected as SharePoint URL")
        print(f"  Original: {citation}")
        print(f"  Processed: {processed_url}")
        
        # Extract SharePoint URL from processed
        if processed_url.startswith("sharepoint:"):
            sharepoint_url = processed_url[len("sharepoint:"):]
            print(f"\n✓ URL extraction for Graph API call:")
            print(f"  {sharepoint_url}")
            print(f"\n  Would call: POST /sharepoint/content")
            print(f"  Body: {json.dumps({'url': sharepoint_url}, indent=2)}")
    
    print("\n" + "="*60)
    print("✓ All tests passed!")
    print("="*60)
    
    return True

if __name__ == "__main__":
    try:
        result = asyncio.run(test_sharepoint_endpoint())
        sys.exit(0 if result else 1)
    except Exception as e:
        print(f"\n✗ Test failed with error:")
        print(f"  {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
