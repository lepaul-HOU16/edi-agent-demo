#!/usr/bin/env python3
"""
OSDU-specific tools for EDIcraft Agent.
"""

import requests
import logging
from typing import Dict, List, Any, Optional
from strands import tool
from osdu_client.client import OSDUAPI
from osdu_client.exceptions import OSDUAPIError, OSDUClientError


class OSDUTools:
    """OSDU data access and search tools."""
    
    def __init__(self, auth_backend, storage_client, search_client, legal_client, schema_client):
        """Initialize OSDU tools with clients.
        
        Args:
            auth_backend: OSDU authentication backend
            storage_client: OSDU storage client
            search_client: OSDU search client
            legal_client: OSDU legal client
            schema_client: OSDU schema client
        """
        self.auth_backend = auth_backend
        self.storage_client = storage_client
        self.search_client = search_client
        self.legal_client = legal_client
        self.schema_client = schema_client
        self.logger = logging.getLogger(__name__)
        
        # Extract auth info for direct API calls
        self.access_token = auth_backend._access_token
        self.base_url = auth_backend._base_url
        self.partition_id = auth_backend._partition_id

    @tool
    def get_record(self, record_id: str, attributes: Optional[List[str]] = None) -> Dict[str, Any]:
        """Retrieve a single record from OSDU storage by ID.
        
        Args:
            record_id: The unique identifier for the record (e.g., "opendes:wellbore:123456")
            attributes: Optional list of specific attributes to retrieve (e.g., ["data.WellboreName", "data.WellID"])
        """
        try:
            if attributes:
                record = self.storage_client.get_record(id=record_id, attribute=attributes)
            else:
                record = self.storage_client.get_record(id=record_id)
            
            return {
                "status": "success",
                "record": record
            }
        except OSDUAPIError as e:
            return {
                "status": "error",
                "message": f"OSDU API Error: {e.message}",
                "status_code": e.status_code
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Unexpected error: {str(e)}"
            }

    @tool
    def search_records(self, query: str, kind_filter: Optional[str] = None, limit: int = 10) -> Dict[str, Any]:
        """Search for records in OSDU using full-text search.
        
        Args:
            query: Search query string (e.g., "Gulf of Mexico AND seismic")
            kind_filter: Optional filter by record kind (e.g., "opendes:wks:*:*")
            limit: Maximum number of results to return (default: 10)
        """
        try:
            search_params = {
                "query": query,
                "limit": limit,
                "track_total_count": True
            }
            
            if kind_filter:
                search_params["kind"] = {"*": [kind_filter]}
            else:
                search_params["kind"] = {"*": ["*"]}
            
            results = self.search_client.query(**search_params)
            
            return {
                "status": "success",
                "total_count": results.get("totalCount", 0),
                "results": results.get("results", [])
            }
        except OSDUAPIError as e:
            return {
                "status": "error",
                "message": f"OSDU API Error: {e.message}",
                "status_code": e.status_code
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Unexpected error: {str(e)}"
            }

    @tool
    def direct_search(self, kind_pattern: str = "*:*:master-data--Wellbore:*", 
                     returned_fields: Optional[List[str]] = None, limit: int = 10) -> Dict[str, Any]:
        """Direct HTTP search using the same approach as the working OSDU script.
        
        Args:
            kind_pattern: OSDU kind pattern (e.g., "*:*:master-data--Wellbore:*")
            returned_fields: List of fields to return (e.g., ["id", "data.WellID", "data.NameAliases"])
            limit: Maximum number of results to return
        """
        try:
            # Prepare headers like the working script
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
                "data-partition-id": self.partition_id
            }
            
            # Prepare query like the working script
            query = {
                "kind": [kind_pattern],
                "limit": limit
            }
            
            if returned_fields:
                query["returnedFields"] = returned_fields
            else:
                query["returnedFields"] = ["id", "data.WellID", "data.NameAliases"]
            
            # Make direct HTTP request to search API
            search_url = f"{self.base_url}/api/search/v2/query/"
            response = requests.post(search_url, headers=headers, json=query)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "status": "success",
                    "total_count": result.get("totalCount", 0),
                    "results": result.get("results", []),
                    "aggregations": result.get("aggregations"),
                    "phrase_suggestions": result.get("phraseSuggestions", [])
                }
            else:
                return {
                    "status": "error",
                    "message": f"HTTP {response.status_code}: {response.text}",
                    "status_code": response.status_code
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Direct search error: {str(e)}"
            }

    @tool
    def search_wells(self, limit: int = 10) -> Dict[str, Any]:
        """Search for well master data records."""
        return self.direct_search(
            kind_pattern="*:*:master-data--Well:*",
            returned_fields=["id", "data.WellName", "data.WellID", "data.OperatorName"],
            limit=limit
        )

    @tool
    def search_wellbores(self, limit: int = 10) -> Dict[str, Any]:
        """Search for wellbore master data records."""
        return self.direct_search(
            kind_pattern="*:*:master-data--Wellbore:*",
            returned_fields=["id", "data.WellID", "data.NameAliases", "data.WellboreID"],
            limit=limit
        )

    @tool
    def search_trajectories(self, limit: int = 10) -> Dict[str, Any]:
        """Search for wellbore trajectory records."""
        return self.direct_search(
            kind_pattern="*:*:work-product-component--WellboreTrajectory:*",
            returned_fields=["id", "data.WellboreID", "data.Name", "data.TopDepthMeasuredDepth", "data.BaseDepthMeasuredDepth"],
            limit=limit
        )

    @tool
    def search_horizons(self, limit: int = 10) -> Dict[str, Any]:
        """Search for seismic horizon records in OSDU."""
        try:
            return self.direct_search(
                kind_pattern="*:*:work-product-component--SeismicHorizon:*",
                returned_fields=["id", "data.Name", "data.Description", "data.GeologicalUnitName", "data.Datasets"],
                limit=limit
            )
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error searching horizons: {str(e)}"
            }

    @tool
    def explore_data_types(self, limit: int = 20) -> Dict[str, Any]:
        """Explore different types of data available in OSDU by searching broadly."""
        try:
            # Search for any master data
            result = self.direct_search(
                kind_pattern="*:*:master-data--*:*",
                returned_fields=["id", "kind"],
                limit=limit
            )
            
            if result["status"] == "success":
                # Extract unique kinds from results
                kinds = set()
                for record in result.get("results", []):
                    if "kind" in record:
                        kinds.add(record["kind"])
                
                result["unique_kinds"] = sorted(list(kinds))
                result["message"] = f"Found {len(kinds)} unique data types"
            
            return result
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error exploring data types: {str(e)}"
            }

    @tool
    def search_schemas(self, authority: Optional[str] = None, source: Optional[str] = None, 
                      entity_type: Optional[str] = None, status: str = "PUBLISHED") -> Dict[str, Any]:
        """Search for schemas in OSDU.
        
        Args:
            authority: Schema authority (e.g., "opendes")
            source: Schema source (e.g., "wks")
            entity_type: Entity type filter (e.g., "Well")
            status: Schema status filter (default: "PUBLISHED")
        """
        try:
            search_params = {
                "status": status,
                "latest_version": "true",
                "limit": "100"
            }
            
            if authority:
                search_params["authority"] = authority
            if source:
                search_params["source"] = source
            if entity_type:
                search_params["entity_type"] = entity_type
            
            results = self.schema_client.search_schemas(**search_params)
            
            return {
                "status": "success",
                "schemas": results.get("schemaInfos", []),
                "count": len(results.get("schemaInfos", []))
            }
        except OSDUAPIError as e:
            return {
                "status": "error",
                "message": f"OSDU API Error: {e.message}",
                "status_code": e.status_code
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Unexpected error: {str(e)}"
            }

    @tool
    def get_available_services(self) -> Dict[str, Any]:
        """Get list of available OSDU services and their versions."""
        try:
            # This would typically call OSDUAPI.print_available_services() but we'll return a structured response
            services = {
                "storage": ["latest"],
                "search": ["latest"], 
                "legal": ["latest"],
                "schema": ["latest"],
                "file": ["latest"],
                "entitlements": ["latest"]
            }
            
            return {
                "status": "success",
                "services": services,
                "message": "Available OSDU services and versions"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error retrieving services: {str(e)}"
            }

    @tool
    def get_auth_info(self) -> Dict[str, Any]:
        """Get current authentication and connection information."""
        try:
            # Mask the token for security (show only first/last few characters)
            masked_token = None
            if self.access_token:
                if len(self.access_token) > 20:
                    masked_token = f"{self.access_token[:10]}...{self.access_token[-10:]}"
                else:
                    masked_token = f"{self.access_token[:5]}..."
            
            return {
                "status": "success",
                "base_url": self.base_url,
                "partition_id": self.partition_id,
                "access_token": masked_token,
                "token_length": len(self.access_token) if self.access_token else 0,
                "message": "Current OSDU connection information"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error retrieving auth info: {str(e)}"
            }

    def get_tools(self) -> List:
        """Get list of OSDU tools for agent integration."""
        return [
            self.get_record,
            self.search_records,
            self.direct_search,
            self.search_wells,
            self.search_wellbores,
            self.search_trajectories,
            self.search_horizons,
            self.explore_data_types,
            self.search_schemas,
            self.get_available_services,
            self.get_auth_info
        ]