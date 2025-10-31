"""
SharePoint Graph API utilities for document preview and metadata.
"""
import os
import re
from typing import Optional, Dict, Any
from urllib.parse import urlparse, parse_qs
import aiohttp
from azure.identity.aio import DefaultAzureCredential
from core.authentication import AuthenticationHelper


class SharePointGraphHelper:
    """Helper class for SharePoint Graph API operations."""
    
    def __init__(self, auth_helper: AuthenticationHelper):
        self.auth_helper = auth_helper
        self.graph_endpoint = "https://graph.microsoft.com/v1.0"
        self.credential = DefaultAzureCredential()
        
    async def get_graph_token(self) -> str:
        """Get access token for Microsoft Graph API."""
        try:
            token = await self.credential.get_token("https://graph.microsoft.com/.default")
            return token.token
        except Exception as e:
            raise Exception(f"Failed to get Graph API token: {str(e)}")
    
    def parse_sharepoint_url(self, sharepoint_url: str) -> Optional[Dict[str, str]]:
        """
        Parse SharePoint URL to extract site, library, and file information.
        
        Examples:
        - https://contoso.sharepoint.com/sites/IT/Shared%20Documents/document.pdf
        - https://contoso.sharepoint.com/sites/IT/LIST/document.pdf
        """
        parsed = urlparse(sharepoint_url)
        if not parsed.hostname or "sharepoint.com" not in parsed.hostname:
            return None
            
        # Extract site path and file path
        path_parts = parsed.path.strip('/').split('/')
        
        if len(path_parts) < 4:  # Need at least sites/sitename/library/file
            return None
            
        try:
            sites_index = path_parts.index('sites')
            site_name = path_parts[sites_index + 1]
            library_name = path_parts[sites_index + 2]
            file_path = '/'.join(path_parts[sites_index + 3:])
            
            # Build site URL
            site_url = f"{parsed.scheme}://{parsed.hostname}/sites/{site_name}"
            
            return {
                "hostname": parsed.hostname,
                "site_name": site_name,
                "site_url": site_url,
                "library_name": library_name,
                "file_path": file_path,
                "full_file_path": parsed.path
            }
        except (ValueError, IndexError):
            return None
    
    async def get_site_id(self, site_url: str) -> Optional[str]:
        """Get SharePoint site ID using Graph API."""
        try:
            token = await self.get_graph_token()
            headers = {"Authorization": f"Bearer {token}"}
            
            # Parse hostname and site path
            parsed = urlparse(site_url)
            hostname = parsed.hostname
            site_path = parsed.path
            
            url = f"{self.graph_endpoint}/sites/{hostname}:{site_path}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("id")
                    else:
                        print(f"Failed to get site ID: {response.status}")
                        return None
        except Exception as e:
            print(f"Error getting site ID: {str(e)}")
            return None
    
    async def get_drive_item_id(self, site_id: str, file_path: str) -> Optional[str]:
        """Get drive item ID for a file using Graph API."""
        try:
            token = await self.get_graph_token()
            headers = {"Authorization": f"Bearer {token}"}
            
            # Encode file path for URL
            encoded_path = file_path.replace(' ', '%20')
            url = f"{self.graph_endpoint}/sites/{site_id}/drive/root:/{encoded_path}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("id")
                    else:
                        print(f"Failed to get drive item ID: {response.status}")
                        return None
        except Exception as e:
            print(f"Error getting drive item ID: {str(e)}")
            return None
    
    async def get_preview_url(self, sharepoint_url: str) -> Optional[Dict[str, Any]]:
        """
        Get preview URL for SharePoint document using Graph API.
        
        Returns dict with:
        - embed_url: URL for embedding in iframe
        - web_url: URL for opening in browser
        - download_url: Direct download URL
        """
        try:
            # Parse SharePoint URL
            url_info = self.parse_sharepoint_url(sharepoint_url)
            if not url_info:
                return None
            
            # Get site ID
            site_id = await self.get_site_id(url_info["site_url"])
            if not site_id:
                return None
            
            # Get drive item ID
            file_path = url_info["full_file_path"].strip('/')
            # Remove sites/sitename/libraryname prefix
            path_parts = file_path.split('/')
            if len(path_parts) >= 3 and path_parts[0] == 'sites':
                actual_file_path = '/'.join(path_parts[3:])  # Skip sites/sitename/libraryname
            else:
                actual_file_path = file_path
            
            item_id = await self.get_drive_item_id(site_id, actual_file_path)
            if not item_id:
                return None
            
            # Get preview info
            token = await self.get_graph_token()
            headers = {"Authorization": f"Bearer {token}"}
            
            preview_url = f"{self.graph_endpoint}/sites/{site_id}/drive/items/{item_id}/preview"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(preview_url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "embed_url": data.get("getUrl"),
                            "web_url": sharepoint_url,
                            "download_url": data.get("postUrl"),
                            "site_id": site_id,
                            "item_id": item_id
                        }
                    else:
                        print(f"Failed to get preview URL: {response.status}")
                        return None
        except Exception as e:
            print(f"Error getting preview URL: {str(e)}")
            return None
    
    def get_embed_url(self, sharepoint_url: str) -> Optional[str]:
        """
        Generate SharePoint embed URL using Doc.aspx format.
        This works for many SharePoint documents without requiring Graph API calls.
        """
        try:
            url_info = self.parse_sharepoint_url(sharepoint_url)
            if not url_info:
                return None
            
            # Try to extract document ID from URL or generate embed URL
            # Format: https://tenant.sharepoint.com/_layouts/15/Doc.aspx?sourcedoc={guid}&action=embedview
            
            # For now, try to construct embed URL by replacing the document path
            base_url = f"{url_info['hostname']}"
            if not base_url.startswith('http'):
                base_url = f"https://{base_url}"
            
            # Simple embed URL construction
            embed_url = sharepoint_url.replace(
                f"/sites/{url_info['site_name']}/{url_info['library_name']}/",
                "/_layouts/15/Doc.aspx?sourcedoc="
            )
            
            if embed_url != sharepoint_url:
                embed_url += "&action=embedview"
                return embed_url
            
            return None
        except Exception as e:
            print(f"Error generating embed URL: {str(e)}")
            return None
    
    async def get_document_metadata(self, sharepoint_url: str) -> Optional[Dict[str, Any]]:
        """Get document metadata from SharePoint using Graph API."""
        try:
            url_info = self.parse_sharepoint_url(sharepoint_url)
            if not url_info:
                return None
            
            site_id = await self.get_site_id(url_info["site_url"])
            if not site_id:
                return None
            
            file_path = url_info["full_file_path"].strip('/')
            path_parts = file_path.split('/')
            if len(path_parts) >= 3 and path_parts[0] == 'sites':
                actual_file_path = '/'.join(path_parts[3:])
            else:
                actual_file_path = file_path
            
            item_id = await self.get_drive_item_id(site_id, actual_file_path)
            if not item_id:
                return None
            
            token = await self.get_graph_token()
            headers = {"Authorization": f"Bearer {token}"}
            
            url = f"{self.graph_endpoint}/sites/{site_id}/drive/items/{item_id}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "name": data.get("name"),
                            "size": data.get("size"),
                            "created_datetime": data.get("createdDateTime"),
                            "modified_datetime": data.get("lastModifiedDateTime"),
                            "mime_type": data.get("file", {}).get("mimeType"),
                            "web_url": data.get("webUrl"),
                            "download_url": data.get("@microsoft.graph.downloadUrl")
                        }
        except Exception as e:
            print(f"Error getting document metadata: {str(e)}")
            return None