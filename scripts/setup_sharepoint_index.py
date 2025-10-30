#!/usr/bin/env python3

"""
Script to create and configure the SharePoint search index (sharepoint-index-2-index)
for the Azure RAG application.
"""

import asyncio
import logging
import os
from azure.identity.aio import DefaultAzureCredential
from azure.search.documents.indexes.aio import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    ComplexField,
    VectorSearch,
    VectorSearchProfile,
    HnswAlgorithmConfiguration,
    SemanticConfiguration,
    SemanticField,
    SemanticPrioritizedFields,
    SemanticSearch,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_sharepoint_index():
    """Create the SharePoint search index with proper configuration."""
    
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
        
        # Define index fields for SharePoint documents
        fields = [
            SimpleField(name="id", type="Edm.String", key=True),
            SearchableField(name="title", type="Edm.String", analyzer_name="standard.lucene"),
            SearchableField(name="content", type="Edm.String", analyzer_name="standard.lucene"),
            SearchableField(name="url", type="Edm.String", filterable=True),
            SearchableField(name="author", type="Edm.String", filterable=True, facetable=True),
            SimpleField(name="created_date", type="Edm.DateTimeOffset", filterable=True, sortable=True),
            SimpleField(name="modified_date", type="Edm.DateTimeOffset", filterable=True, sortable=True),
            SearchableField(name="file_type", type="Edm.String", filterable=True, facetable=True),
            SearchableField(name="site_collection", type="Edm.String", filterable=True, facetable=True),
            SearchableField(name="library_name", type="Edm.String", filterable=True, facetable=True),
            
            # Vector field for semantic search
            SearchableField(
                name="content_vector",
                type="Collection(Edm.Single)",
                searchable=True,
                vector_search_dimensions=1536,  # OpenAI ada-002 embedding size
                vector_search_profile_name="sharepoint-vector-profile"
            ),
            
            # Access control fields
            SimpleField(name="access_control", type="Collection(Edm.String)", filterable=True),
            
            # Additional metadata fields
            SearchableField(name="sourcepage", type="Edm.String", filterable=True),
            SearchableField(name="category", type="Edm.String", filterable=True, facetable=True),
        ]
        
        # Configure vector search
        vector_search = VectorSearch(
            profiles=[
                VectorSearchProfile(
                    name="sharepoint-vector-profile",
                    algorithm_configuration_name="sharepoint-hnsw-config"
                )
            ],
            algorithms=[
                HnswAlgorithmConfiguration(
                    name="sharepoint-hnsw-config",
                    parameters={
                        "m": 4,
                        "efConstruction": 400,
                        "efSearch": 500,
                        "metric": "cosine"
                    }
                )
            ]
        )
        
        # Configure semantic search
        semantic_search = SemanticSearch(
            configurations=[
                SemanticConfiguration(
                    name="sharepoint-semantic-config",
                    prioritized_fields=SemanticPrioritizedFields(
                        title_field=SemanticField(field_name="title"),
                        content_fields=[
                            SemanticField(field_name="content"),
                        ],
                        keywords_fields=[
                            SemanticField(field_name="author"),
                            SemanticField(field_name="file_type"),
                            SemanticField(field_name="library_name"),
                        ],
                    ),
                )
            ]
        )
        
        # Create the index
        index = SearchIndex(
            name=index_name,
            fields=fields,
            vector_search=vector_search,
            semantic_search=semantic_search,
        )
        
        try:
            # Check if index already exists
            try:
                existing_index = await index_client.get_index(index_name)
                logger.info(f"SharePoint index '{index_name}' already exists. Updating...")
                result = await index_client.create_or_update_index(index)
                logger.info(f"SharePoint index '{index_name}' updated successfully")
            except Exception:
                logger.info(f"Creating new SharePoint index '{index_name}'...")
                result = await index_client.create_index(index)
                logger.info(f"SharePoint index '{index_name}' created successfully")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to create/update SharePoint index: {e}")
            raise

async def main():
    """Main function to set up SharePoint index."""
    try:
        logger.info("Starting SharePoint index setup...")
        await create_sharepoint_index()
        logger.info("SharePoint index setup completed successfully!")
        
        logger.info("Configuration tips:")
        logger.info("1. Set AZURE_SHAREPOINT_SEARCH_INDEX environment variable if using a different index name")
        logger.info("2. The index is configured for:")
        logger.info("   - Text and vector search")
        logger.info("   - Semantic ranking")
        logger.info("   - Access control filtering")
        logger.info("   - SharePoint metadata fields")
        
    except Exception as e:
        logger.error(f"Failed to set up SharePoint index: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())