#!/usr/bin/env python3

"""
Example script to index SharePoint documents into the sharepoint-index-2-index.
This is a template that you can customize based on your SharePoint environment.
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from azure.identity.aio import DefaultAzureCredential
from azure.search.documents.aio import SearchClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def index_sample_sharepoint_documents():
    """Index sample SharePoint documents for testing."""
    
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
        
        # Sample SharePoint documents with preview-optimized URLs
        # Note: URLs should be formatted for optimal citation preview display
        # The system will automatically convert these to embed URLs when needed
        sample_documents = [
            {
                "id": "sp-doc-001",
                "title": "Project Requirements Document",
                "content": "This document outlines the requirements for the new customer portal project. The portal should provide customers with access to their account information, order history, and support resources. Key features include user authentication, responsive design, and integration with existing CRM systems.",
                "url": "https://claranetapplications.sharepoint.com/sites/IT/Shared Documents/project-requirements.docx",
                "author": "John Smith",
                "created_date": "2024-01-15T10:30:00Z",
                "modified_date": "2024-02-01T14:20:00Z",
                "file_type": "docx",
                "site_collection": "https://contoso.sharepoint.com/sites/projects",
                "library_name": "Documents",
                "sourcepage": "project-requirements.docx",
                "category": "Project Documentation",
                "access_control": ["public"],
                "content_vector": [0.1] * 1536,  # Placeholder - use actual embeddings
            },
            {
                "id": "sp-doc-002",
                "title": "Team Meeting Notes - Q1 2024",
                "content": "Meeting notes from the quarterly team meeting. Discussed project milestones, budget allocations, and resource planning. Action items include updating the project timeline, reviewing vendor contracts, and scheduling follow-up meetings with stakeholders.",
                "url": "https://claranetapplications.sharepoint.com/sites/IT/Shared Documents/meeting-notes-q1-2024.docx",
                "author": "Sarah Johnson",
                "created_date": "2024-03-10T09:15:00Z",
                "modified_date": "2024-03-12T16:45:00Z",
                "file_type": "aspx",
                "site_collection": "https://contoso.sharepoint.com/sites/team",
                "library_name": "Meeting Notes",
                "sourcepage": "Q1-2024-meeting-notes.aspx",
                "category": "Meeting Notes",
                "access_control": ["team-members"],
                "content_vector": [0.2] * 1536,  # Placeholder - use actual embeddings
            },
            {
                "id": "sp-doc-003",
                "title": "API Documentation v2.1",
                "content": "Complete API documentation for the customer service REST API. Includes endpoint descriptions, authentication methods, request/response formats, and code examples. The API supports operations for customer data retrieval, order management, and support ticket creation.",
                "url": "https://contoso.sharepoint.com/sites/development/Documents/api-docs-v2.1.pdf",
                "author": "Mike Chen",
                "created_date": "2024-02-20T13:00:00Z",
                "modified_date": "2024-03-15T11:30:00Z",
                "file_type": "pdf",
                "site_collection": "https://contoso.sharepoint.com/sites/development",
                "library_name": "Technical Documentation",
                "sourcepage": "api-docs-v2.1.pdf",
                "category": "Technical Documentation",
                "access_control": ["developers", "architects"],
                "content_vector": [0.3] * 1536,  # Placeholder - use actual embeddings
            },
            {
                "id": "sp-doc-004",
                "title": "Employee Handbook 2024",
                "content": "Updated employee handbook covering company policies, benefits, procedures, and guidelines. Includes sections on remote work policies, performance evaluation processes, professional development opportunities, and compliance requirements.",
                "url": "https://contoso.sharepoint.com/sites/hr/Documents/employee-handbook-2024.docx",
                "author": "HR Department",
                "created_date": "2024-01-01T08:00:00Z",
                "modified_date": "2024-03-01T10:15:00Z",
                "file_type": "docx",
                "site_collection": "https://contoso.sharepoint.com/sites/hr",
                "library_name": "HR Documents",
                "sourcepage": "employee-handbook-2024.docx",
                "category": "HR Policies",
                "access_control": ["all-employees"],
                "content_vector": [0.4] * 1536,  # Placeholder - use actual embeddings
            },
            {
                "id": "sp-doc-005",
                "title": "Sales Training Presentation",
                "content": "Comprehensive sales training presentation covering product features, competitive analysis, objection handling, and closing techniques. Includes real-world scenarios, case studies, and best practices from top performers.",
                "url": "https://contoso.sharepoint.com/sites/sales/Documents/training-presentation.pptx",
                "author": "Sales Manager",
                "created_date": "2024-02-05T14:30:00Z",
                "modified_date": "2024-02-28T16:00:00Z",
                "file_type": "pptx",
                "site_collection": "https://contoso.sharepoint.com/sites/sales",
                "library_name": "Training Materials",
                "sourcepage": "sales-training-presentation.pptx",
                "category": "Training",
                "access_control": ["sales-team", "managers"],
                "content_vector": [0.5] * 1536,  # Placeholder - use actual embeddings
            }
        ]
        
        try:
            # Upload documents to the index
            result = await search_client.upload_documents(sample_documents)
            
            # Check results
            successful_uploads = 0
            failed_uploads = 0
            
            for upload_result in result:
                if upload_result.succeeded:
                    successful_uploads += 1
                    logger.info(f"Successfully indexed document: {upload_result.key}")
                else:
                    failed_uploads += 1
                    logger.error(f"Failed to index document {upload_result.key}: {upload_result.error_message}")
            
            logger.info(f"Indexing completed: {successful_uploads} successful, {failed_uploads} failed")
            
            return successful_uploads, failed_uploads
            
        except Exception as e:
            logger.error(f"Failed to index SharePoint documents: {e}")
            raise

async def test_sharepoint_search():
    """Test searching the SharePoint index."""
    
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
        
        # Test queries
        test_queries = [
            "project requirements",
            "API documentation",
            "employee handbook",
            "team meeting notes",
            "sales training"
        ]
        
        for query in test_queries:
            logger.info(f"Testing search query: '{query}'")
            
            try:
                results = await search_client.search(
                    search_text=query,
                    top=3,
                    include_total_count=True,
                    select=["id", "title", "author", "library_name", "file_type"]
                )
                
                result_count = 0
                async for result in results:
                    result_count += 1
                    logger.info(f"  Result {result_count}: {result['title']} by {result.get('author', 'Unknown')} [{result.get('file_type', 'Unknown')}]")
                
                if result_count == 0:
                    logger.info("  No results found")
                
            except Exception as e:
                logger.error(f"Search failed for query '{query}': {e}")

async def main():
    """Main function to set up and test SharePoint indexing."""
    try:
        logger.info("Starting SharePoint document indexing...")
        
        # Index sample documents
        successful, failed = await index_sample_sharepoint_documents()
        
        if successful > 0:
            logger.info(f"Successfully indexed {successful} SharePoint documents")
            
            # Wait a moment for indexing to complete
            await asyncio.sleep(5)
            
            # Test search functionality
            logger.info("Testing SharePoint search functionality...")
            await test_sharepoint_search()
            
        else:
            logger.error("No documents were successfully indexed")
        
        logger.info("SharePoint indexing and testing completed!")
        
    except Exception as e:
        logger.error(f"Failed to complete SharePoint indexing: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())