"""
Test script to check SharePoint content endpoint
"""
import asyncio
import aiohttp
import json

async def test_sharepoint_content():
    url = "http://127.0.0.1:50505/sharepoint/content"
    data = {
        "url": "https://claranetapplications.sharepoint.com/sites/IT/LIST/oslo.pdf"
    }
    
    print(f"Testing endpoint: {url}")
    print(f"Request data: {json.dumps(data, indent=2)}")
    print("-" * 60)
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json=data) as response:
                status = response.status
                content_type = response.headers.get('Content-Type', '')
                
                print(f"Status Code: {status}")
                print(f"Content-Type: {content_type}")
                print("-" * 60)
                
                if 'application/json' in content_type:
                    result = await response.json()
                    print(f"JSON Response:\n{json.dumps(result, indent=2)}")
                else:
                    text = await response.text()
                    print(f"Text Response (first 500 chars):\n{text[:500]}")
                    
        except Exception as e:
            print(f"Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test_sharepoint_content())
