#!/usr/bin/env python3

"""
Script simples para testar o índice SharePoint existente e verificar sua estrutura.
"""

import asyncio
import logging
import os
from azure.identity.aio import DefaultAzureCredential
from azure.search.documents.aio import SearchClient
from azure.search.documents.indexes.aio import SearchIndexClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def inspect_sharepoint_index():
    """Inspecionar a estrutura do índice SharePoint existente."""
    
    # Get configuration from environment variables
    search_service = os.getenv("AZURE_SEARCH_SERVICE")
    index_name = os.getenv("AZURE_SHAREPOINT_SEARCH_INDEX", "sharepoint-index-2-index")
    
    if not search_service:
        raise ValueError("AZURE_SEARCH_SERVICE environment variable is required")
    
    search_endpoint = f"https://{search_service.strip('\"')}.search.windows.net"
    
    # Create credentials
    credential = DefaultAzureCredential()
    
    # Create index client
    async with SearchIndexClient(endpoint=search_endpoint, credential=credential) as index_client:
        try:
            # Get index details
            index = await index_client.get_index(index_name)
            logger.info(f"Index '{index_name}' found")
            logger.info(f"Fields in index:")
            
            for field in index.fields:
                logger.info(f"  - {field.name} ({field.type}) - Key: {field.key}, Searchable: {field.searchable}, Filterable: {field.filterable}")
                
            return index
            
        except Exception as e:
            logger.error(f"Failed to inspect index: {e}")
            raise

async def test_simple_search():
    """Testar uma busca simples no índice SharePoint."""
    
    # Get configuration from environment variables
    search_service = os.getenv("AZURE_SEARCH_SERVICE")
    index_name = os.getenv("AZURE_SHAREPOINT_SEARCH_INDEX", "sharepoint-index-2-index")
    
    if not search_service:
        raise ValueError("AZURE_SEARCH_SERVICE environment variable is required")
    
    search_endpoint = f"https://{search_service.strip('\"')}.search.windows.net"
    
    # Create credentials
    credential = DefaultAzureCredential()
    
    # Create search client
    async with SearchClient(endpoint=search_endpoint, index_name=index_name, credential=credential) as search_client:
        
        try:
            # Test search
            logger.info("Testing simple search...")
            results = await search_client.search(
                search_text="*",
                top=5,
                include_total_count=True
            )
            
            result_count = 0
            async for result in results:
                result_count += 1
                logger.info(f"Result {result_count}: {result}")
                
            if result_count == 0:
                logger.info("No documents found in the index")
            else:
                logger.info(f"Found {result_count} documents")
                
        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise

async def main():
    """Main function."""
    try:
        logger.info("Inspecting SharePoint index...")
        await inspect_sharepoint_index()
        
        logger.info("Testing search functionality...")
        await test_simple_search()
        
        logger.info("Inspection completed!")
        
    except Exception as e:
        logger.error(f"Failed to complete inspection: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())