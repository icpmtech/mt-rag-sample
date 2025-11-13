"""
Debug SharePoint URL parsing and Graph API calls
"""
import sys
from pathlib import Path
import asyncio

# Add backend to path
backend_path = Path(__file__).parent / "app" / "backend"
sys.path.insert(0, str(backend_path))

from core.sharepoint_graph import SharePointGraphHelper
from core.authentication import AuthenticationHelper

async def debug_sharepoint():
    test_url = "https://claranetapplications.sharepoint.com/sites/IT/LIST/oslo.pdf"
    
    print("="*70)
    print("DEBUG: SharePoint URL Processing")
    print("="*70)
    print(f"\nTest URL: {test_url}\n")
    
    # Mock auth helper
    class MockAuthHelper:
        def __init__(self):
            self.require_access_control = False
            self.enable_unauthenticated_access = True
    
    auth_helper = MockAuthHelper()
    helper = SharePointGraphHelper(auth_helper)
    
    # Test 1: Parse URL
    print("\n1. PARSING URL")
    print("-" * 70)
    parsed = helper.parse_sharepoint_url(test_url)
    if parsed:
        for key, value in parsed.items():
            print(f"  {key}: {value}")
    else:
        print("  ❌ Failed to parse")
        return
    
    # Test 2: Get Site ID
    print("\n2. GETTING SITE ID")
    print("-" * 70)
    try:
        site_id = await helper.get_site_id(parsed["site_url"])
        if site_id:
            print(f"  ✓ Site ID: {site_id}")
        else:
            print("  ❌ Failed to get site ID")
            return
    except Exception as e:
        print(f"  ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Test 3: Calculate file path
    print("\n3. CALCULATING FILE PATH")
    print("-" * 70)
    file_path = parsed["full_file_path"].strip('/')
    path_parts = file_path.split('/')
    print(f"  Full path: {file_path}")
    print(f"  Path parts: {path_parts}")
    
    if len(path_parts) >= 3 and path_parts[0] == 'sites':
        actual_file_path = '/'.join(path_parts[3:])
    else:
        actual_file_path = file_path
    
    print(f"  Calculated path: {actual_file_path}")
    
    # Test 4: Try different path variations
    print("\n4. TESTING PATH VARIATIONS")
    print("-" * 70)
    
    variations = [
        actual_file_path,
        f"LIST/{parsed['file_path']}",
        parsed['file_path'],
        f"{parsed['library_name']}/{parsed['file_path']}",
    ]
    
    for i, path_variant in enumerate(variations, 1):
        print(f"\n  Variation {i}: {path_variant}")
        try:
            item_id = await helper.get_drive_item_id(site_id, path_variant)
            if item_id:
                print(f"    ✓ SUCCESS! Item ID: {item_id}")
                
                # Get full metadata
                print(f"\n5. GETTING METADATA")
                print("-" * 70)
                metadata = await helper.get_document_metadata(test_url)
                if metadata:
                    print(f"  ✓ Metadata retrieved:")
                    for key, value in metadata.items():
                        if key == "download_url":
                            print(f"    {key}: {value[:80]}..." if value and len(str(value)) > 80 else f"    {key}: {value}")
                        else:
                            print(f"    {key}: {value}")
                else:
                    print(f"  ❌ Failed to get metadata")
                
                return
            else:
                print(f"    ❌ Not found")
        except Exception as e:
            print(f"    ❌ Error: {e}")
    
    print("\n" + "="*70)
    print("All path variations failed. The file might not be in the default drive,")
    print("or the library name might be different from the URL structure.")
    print("="*70)

if __name__ == "__main__":
    asyncio.run(debug_sharepoint())
