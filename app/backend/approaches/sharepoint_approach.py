from typing import Any, Optional, cast

from azure.search.documents.aio import SearchClient
from azure.search.documents.models import VectorQuery
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion, ChatCompletionMessageParam

from approaches.approach import (
    Approach,
    ExtraInfo,
    ThoughtStep,
)
from approaches.promptmanager import PromptManager
from core.authentication import AuthenticationHelper
from prepdocslib.blobmanager import AdlsBlobManager, BlobManager
from prepdocslib.embeddings import ImageEmbeddings


class SharePointRetrieveThenReadApproach(Approach):
    """
    SharePoint-specific retrieve-then-read implementation for the sharepoint-index-2-index.
    Extends the base approach to handle SharePoint documents and metadata.
    """

    def __init__(
        self,
        *,
        search_client: SearchClient,
        search_index_name: str,
        auth_helper: AuthenticationHelper,
        openai_client: AsyncOpenAI,
        chatgpt_model: str,
        chatgpt_deployment: Optional[str],
        embedding_model: str,
        embedding_deployment: Optional[str],
        embedding_dimensions: int,
        embedding_field: str,
        sourcepage_field: str,
        content_field: str,
        query_language: str,
        query_speller: str,
        prompt_manager: PromptManager,
        reasoning_effort: Optional[str] = None,
    ):
        self.search_client = search_client
        self.search_index_name = search_index_name
        self.chatgpt_deployment = chatgpt_deployment
        self.openai_client = openai_client
        self.auth_helper = auth_helper
        self.chatgpt_model = chatgpt_model
        self.embedding_model = embedding_model
        self.embedding_dimensions = embedding_dimensions
        self.chatgpt_deployment = chatgpt_deployment
        self.embedding_deployment = embedding_deployment
        self.embedding_field = embedding_field
        self.sourcepage_field = sourcepage_field
        self.content_field = content_field
        self.query_language = query_language
        self.query_speller = query_speller
        self.prompt_manager = prompt_manager
        self.answer_prompt = self.prompt_manager.load_prompt("sharepoint_answer_question.prompty")
        self.reasoning_effort = reasoning_effort
        self.include_token_usage = True

    async def run(
        self,
        messages: list[ChatCompletionMessageParam],
        session_state: Any = None,
        context: dict[str, Any] = {},
    ) -> dict[str, Any]:
        overrides = context.get("overrides", {})
        auth_claims = context.get("auth_claims", {})
        
        q = messages[-1]["content"]
        if not isinstance(q, str):
            raise ValueError("The most recent message content must be a string.")

        # Run SharePoint-specific search approach
        extra_info = await self.run_sharepoint_search_approach(messages, overrides, auth_claims)

        # Process results with SharePoint-specific context
        messages = self.prompt_manager.render_prompt(
            self.answer_prompt,
            self.get_system_prompt_variables(overrides.get("prompt_template"))
            | {
                "user_query": q,
                "sharepoint_sources": extra_info.data_points.text,
                "citations": extra_info.data_points.citations,
            },
        )

        chat_completion = cast(
            ChatCompletion,
            await self.create_chat_completion(
                self.chatgpt_deployment,
                self.chatgpt_model,
                messages=messages,
                overrides=overrides,
                response_token_limit=self.get_response_token_limit(self.chatgpt_model, 1024),
            ),
        )
        
        extra_info.thoughts.append(
            self.format_thought_step_for_chatcompletion(
                title="Prompt to generate SharePoint answer",
                messages=messages,
                overrides=overrides,
                model=self.chatgpt_model,
                deployment=self.chatgpt_deployment,
                usage=chat_completion.usage,
            )
        )
        
        return {
            "message": {
                "content": chat_completion.choices[0].message.content,
                "role": chat_completion.choices[0].message.role,
            },
            "context": {
                "thoughts": extra_info.thoughts,
                "data_points": {
                    "text": extra_info.data_points.text or [],
                    "images": [],
                    "citations": extra_info.data_points.citations or [],
                },
                "sharepoint_metadata": self.extract_sharepoint_metadata(extra_info.data_points.text or []),
            },
            "session_state": session_state,
        }

    async def run_sharepoint_search_approach(
        self, messages: list[ChatCompletionMessageParam], overrides: dict[str, Any], auth_claims: dict[str, Any]
    ) -> ExtraInfo:
        use_text_search = overrides.get("retrieval_mode") in ["text", "hybrid", None]
        use_vector_search = overrides.get("retrieval_mode") in ["vectors", "hybrid", None]
        use_semantic_ranker = True if overrides.get("semantic_ranker") else False
        use_semantic_captions = True if overrides.get("semantic_captions") else False
        top = overrides.get("top", 3)
        minimum_search_score = overrides.get("minimum_search_score", 0.0)
        minimum_reranker_score = overrides.get("minimum_reranker_score", 0.0)
        
        # Build SharePoint-specific filter
        filter = self.build_sharepoint_filter(overrides, auth_claims)
        
        q = str(messages[-1]["content"])

        vectors: list[VectorQuery] = []
        if use_vector_search:
            vectors.append(await self.compute_text_embedding(q))

        # Search SharePoint index
        results = await self.search_sharepoint(
            top,
            q,
            filter,
            vectors,
            use_text_search,
            use_vector_search,
            use_semantic_ranker,
            use_semantic_captions,
            minimum_search_score,
            minimum_reranker_score,
        )

        # Get SharePoint document content
        data_points = await self.get_sharepoint_sources_content(
            results,
            use_semantic_captions,
        )

        return ExtraInfo(
            data_points,
            thoughts=[
                ThoughtStep(
                    "Search SharePoint using user query",
                    q,
                    {
                        "use_semantic_captions": use_semantic_captions,
                        "use_semantic_ranker": use_semantic_ranker,
                        "top": top,
                        "filter": filter,
                        "use_vector_search": use_vector_search,
                        "use_text_search": use_text_search,
                        "index_name": "sharepoint-index-2-index",
                    },
                ),
                ThoughtStep(
                    "SharePoint search results",
                    [result.serialize_for_results() for result in results],
                ),
            ],
        )

    def build_sharepoint_filter(self, overrides: dict[str, Any], auth_claims: dict[str, Any]) -> Optional[str]:
        """Build OData filter expression for SharePoint content."""
        filters = []
        
        # Base SharePoint filter - only include SharePoint documents
        filters.append("search.ismatch('sharepoint', 'site_collection')")
        
        # Filter by library if specified
        if "library_filter" in overrides:
            library = overrides["library_filter"]
            filters.append(f"library_name eq '{library}'")
        
        # Filter by file type if specified
        if "file_type_filter" in overrides:
            file_types = overrides["file_type_filter"]
            if isinstance(file_types, list):
                type_filters = [f"file_type eq '{ft}'" for ft in file_types]
                filters.append(f"({' or '.join(type_filters)})")
            else:
                filters.append(f"file_type eq '{file_types}'")
        
        # Filter by author if specified
        if "author_filter" in overrides:
            author = overrides["author_filter"]
            filters.append(f"author eq '{author}'")
        
        # Add access control filters if authentication is enabled
        if self.auth_helper.use_authentication and auth_claims:
            user_oid = auth_claims.get("oid")
            if user_oid:
                filters.append(f"(access_control/any(acl: acl eq '{user_oid}') or access_control/any(acl: acl eq 'public'))")
        
        return " and ".join(filters) if filters else None

    async def search_sharepoint(
        self,
        top: int,
        query: str,
        filter: Optional[str],
        vectors: list[VectorQuery],
        use_text_search: bool,
        use_vector_search: bool,
        use_semantic_ranker: bool,
        use_semantic_captions: bool,
        minimum_search_score: float,
        minimum_reranker_score: float,
    ):
        """Search the SharePoint index with specific configurations."""
        search_text = query if use_text_search else None
        vector_queries = vectors if use_vector_search else None
        
        # Configure search parameters for SharePoint
        search_params = {
            "search_text": search_text,
            "vector_queries": vector_queries,
            "filter": filter,
            "query_type": "semantic" if use_semantic_ranker else "simple",
            "query_language": self.query_language,
            "query_speller": self.query_speller,
            "semantic_configuration_name": "sharepoint-semantic-config" if use_semantic_ranker else None,
            "top": top,
            "include_total_count": True,
        }
        
        # Add specific fields for SharePoint documents
        search_params["select"] = [
            "id", "title", "content", "url", "author", "created_date", 
            "modified_date", "file_type", "site_collection", "library_name"
        ]
        
        if use_semantic_captions:
            search_params["query_caption"] = "extractive|highlight-false"

        # Execute search
        search_results = await self.search_client.search(**search_params)
        
        # Filter results by score thresholds
        results = []
        async for result in search_results:
            if result.get("@search.score", 0) >= minimum_search_score:
                if use_semantic_ranker:
                    if result.get("@search.reranker_score", 0) >= minimum_reranker_score:
                        results.append(result)
                else:
                    results.append(result)
        
        return results

    async def get_sharepoint_sources_content(
        self,
        results,
        use_semantic_captions: bool,
    ):
        """Extract content from SharePoint search results."""
        sources_content = []
        citations = []
        
        for i, result in enumerate(results):
            content = result.get(self.content_field, "")
            
            # Use semantic captions if available
            if use_semantic_captions and "@search.captions" in result:
                content = " . ".join([caption.text for caption in result["@search.captions"]])
            
            # Build SharePoint-specific citation
            title = result.get("title", "")
            url = result.get("url", "")
            author = result.get("author", "")
            library = result.get("library_name", "")
            file_type = result.get("file_type", "")
            
            citation_text = f"{title}"
            if library:
                citation_text += f" (from {library})"
            if author:
                citation_text += f" by {author}"
            if file_type:
                citation_text += f" [{file_type.upper()}]"
            
            sources_content.append(content)
            citations.append({
                "title": title,
                "url": url,
                "filepath": url,
                "content": content,
                "author": author,
                "library_name": library,
                "file_type": file_type,
                "citation_text": citation_text,
            })
        
        from approaches.approach import DataPoints
        
        return DataPoints(
            text=sources_content,
            images=[],
            citations=citations,
        )

    def extract_sharepoint_metadata(self, sources: list[str]) -> dict[str, Any]:
        """Extract SharePoint-specific metadata from sources."""
        return {
            "source_type": "sharepoint",
            "index_name": "sharepoint-index-2-index",
            "total_sources": len(sources),
            "document_types": ["SharePoint Documents"],
        }

    def get_system_prompt_variables(self, prompt_template: Optional[str] = None) -> dict[str, Any]:
        """Get system prompt variables specific to SharePoint."""
        base_variables = super().get_system_prompt_variables(prompt_template)
        base_variables.update({
            "source_type": "SharePoint documents",
            "citation_format": "SharePoint document citations with library and author information",
        })
        return base_variables