"""
OSDU Client
Handles communication with OSDU API for well data retrieval.
"""

import json
import logging
import os
import requests
from typing import Dict, List, Any, Optional
from osdu_auth import get_osdu_headers

# Import Strands Agent for query generation
try:
    from strands import Agent
    STRANDS_AVAILABLE = True
except ImportError as e:
    logger = logging.getLogger()
    logger.warning(f"strands not available for query generation: {str(e)}")
    STRANDS_AVAILABLE = False
    Agent = None

# Configure logger with proper level
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


osdu_search_query_documentation_long = """
# Query

Parameters
query 	The Query string is based on Lucene query string syntax, supplemented with a specific format for describing queries to fields of object arrays indexed with the nested hint. The maximum number of clauses on a query can be 1024.

Important: Field names in request parameters are case-sensitive. Field values are case-insensitive, unless you are querying for an exact match with a keyword subfield for the attribute.
Note: The Offset + Limit can not be more than 10,000. See the Query with cursor topic for more efficient ways to do deep scrolling.


## Text queries
The OSDU Data Platform provides comprehensive query options in Lucene query syntax. The query string is parsed into a series of terms and operators. A term can be a single word, such as "producing" or "well", or a phrase, surrounded by double quotes, such as "producing well", which searches for all the words in the phrase, in the same order. The default operator for the query is OR.
You can search a field in the document <field-name>:<value>. If field is not defined, then it defaults to all queryable fields, and the query will automatically attempt to determine the existing fields in the index's mapping that are queryable, and perform the search on those fields.
The query language is quite comprehensive and can be intimidating at first glance, but the best way to actually learn it is to start with a few basic examples.
Note: kind is a required parameter and is omitted for brevity in following examples. Also, all storage record properties are in data block. Any reference to a field inside the block should be prefixed with data.

### Examples
Search all fields that contain the text 'well':
{
"query": "well"
}

Note: If <field-name> is not specified, the query string will automatically attempt to determine the existing fields in the index's mapping that are queryable, and perform the search on those fields. The search query will be more performant if field names are specified in the query instead of searching across all queryable attributes. The following examples cover this:

Where the Basin field contains "Permian":
{
"query": "data.Basin:Permian"
}

Where the Rig_Contractor field contains "Ocean" or "Drilling". OR is the default operator:
{
"query": "data.Rig_Contractor:(Ocean OR Drilling)"
}
or
{
"query": "data.Rig_Contractor:(Ocean Drilling)"
}

Where the Rig_Contractor field contains the exact phrase "Ocean Drilling":
{
"query": "data.Rig_Contractor:\"Ocean Drilling\""
}

The Search service offers additional query patterns to query precise values. For details see exact match.
Where any of the fields ValueList.OriginalValue, ValueList.Value, or ValueList.AppDataType contains "PRODUCING" or "DUAINE". (Note that you need to escape the * with a backslash.)
{
"query": "data.ValueList.\\*:(PRODUCING DUAINE)"
}

text field indexing
By default, search back-end server analyzes the values of text fields & text array fields (including text fields with nested x-osdu-indexing hints) during indexing. The Indexer service analyzer changes text field values as follows:
Removes most punctuation & prepositions.
Divides the remaining content into individual words, called tokens.
Changes the tokens to lowercase.

To better support a precise exact match, aggregation & sort on text field, an additional field is indexed (on kinds indexed after April 2021) for every text field, that is not analyzed (as per rules mentioned above). As an example, if record has a text field named data.name, then the indexer will add the non-analyzed field: data.name.keyword. Newly added text fields can be identified as: field-name.keyword. Also installations with keywordLower feature flag enabled have additional keywordLower field, allowing case agnostic precise search.
Note 1: The keyword and keywordLower field value can have a maximum of 256 characters, and only exact match is supported for this field, so a partial field value query will not return any response. If a text field is longer than 256 characters, then both keyword and keywordLower fields will have only the first 256 characters.
Note 2: text array fields indexed with flattened indexing hint are non-analyzed during indexing by default and do not require keyword subfield. Exact match, aggregations and sort queries on such fields do not require keyword suffix.

## Exact match
Use the exact match query to search records based on a precise value using keyword subfield mentioned here, such as well ID, name, etc. on text fields.
As indexed keyword subfield is not analyzed, query on this field is case sensitive & no escaping is required for special characters covered in the reserved characters section.

Here is an example query, it two special characters, space and period, without any escaping:
{
    "query": "data.name.keyword:\"Spillpath DA no.109\""
}

The keywordLower (OSDU Data Platform deployment with keywordLower feature enabled) subfield has only one difference - it is allowing non-case sensitive search. Example:
{
    "query": "data.name.keywordLower:\"spillpath da no.109\""
}

## Query null or empty values
text field's keyword subfield can also be utilized to query records by null or empty value on text attributes. null value search/index workflows are only supported on text fields.

Here is a sample query to search null value:
{
"query": "data.FacilityID.keyword:null"
}

Here is an example query to search empty value:
{
"query": "data.FacilityID.keyword:\"\""
}

## Exists query
Returns documents that contain an indexed value for a field. Use the _exists_ prefix for a field to search to see if the field exists.
While a text field is deemed non-existent if the JSON value is null, following values will indicate the field does exist:
Empty strings, such as "".
keyword subfield with explicit null value.
Similarly text array field considered non-existent if the JSON value is null or [], text arrays containing null and another value , such as [null, "abc"] indicates the field does exist.

Example request:
Where query returns if the text field Status has any non-null value.
{
"query": "_exists_:data.Status"
}

## Reserved characters
If you need to use any of the characters which function as operators in your query itself (and not as operators), then you must escape them with a leading backslash. 
The reserved characters are: + - = && || > < ! ( ) { } [ ] ^ " ~ * ? : \\ /
Failing to escape these special characters correctly could lead to a syntax error which prevents your query from running.
Note: < and > can't be escaped at all. The only way to prevent them from attempting to create a range query is to remove them from the query string entirely.
Wildcards
Wildcard searches can be run on individual terms using ? to replace a single character and * to replace zero or more characters.
{
"query": "data.Rig_Contractor:Oc?an Dr*"
}
Be aware that wildcard queries can use an enormous amount of memory and therefore can effect the performance. They should be used very sparingly.
Note: Leading wildcards are disabled by the OSDU Data Platform Search service. Allowing a wildcard at the beginning of a word, such as "*ean", is particularly heavy because all the terms in the index need to be examined, just in case they match.

## Grouping
Multiple terms or clauses can be grouped together with parentheses to form sub-queries.
{
"query": "data.Rig_Contractor:(Ocean OR Drilling) AND Exploration NOT Basin"
}


## Query nested arrays objects
Starting with OSDU's M6 release, you can set nested hints in a data scheme's object array nodes. It leads to accurate indexing of those arrays objects in the underlying search backend.
nested attributes can be queried using the Search service in the form of the nested() function:
For one level "nested array":
{
"query": "nested(<path-to-root-nested-array-node>, <root-nested-array-object-fields-query>)"
}

For nested (multi-level) "nested array" queries:
{
"query": "nested(<path-to-root-nested-array-node>, nested(<path-to-subrootA-nested-array-node>, <subrootA-nested-array-object-fields-query>))"
}

Multi-level nested queries are not limited in their depth. You nest them as required by the particular schema.
In the examples below, you can see several examples of the root and multi-level nested queries. The syntax of those queries is the same as described in the previous sections. The only distinction is that their conditions are scoped by their own fields of objects of the array, pointed in the first argument of the current nested(path,(conditions)) function.

### Single-level one condition nested query
Where work-product-component--WellboreMarkerSet has any marker with MarkerMeasuredDepth field value greater than 10000:
{
"query": "nested(data.Markers, (MarkerMeasuredDepth:(>10000)))"
}

### Single-level several conditions nested query
Where work-product-component--WellboreMarkerSet has any marker with VerticalMeasurement field value greater than 100 and VerticalMeasurementPathID field value is osdu-openness:reference-data--VerticalMeasurementPath:ELEV::
{
"query": "nested(data.VerticalMeasurements, (VerticalMeasurement:(>100) AND VerticalMeasurementPathID:\"osdu-openness:reference-data--VerticalMeasurementPath:ELEV:\"))"
}

### Combination of single-level nested queries
Where work-product-component--WellboreMarkerSet has any marker with MarkerMeasuredDepth field value greater 10000 or SurfaceDipAzimuth field value less than 360:
{
"query":"nested(data.Markers, (MarkerMeasuredDepth:(>10000))) OR nested(data.Markers, (SurfaceDipAzimuth:(<360)))"
}


### Nested and non-nested queries parts combinations
We can combine both types of queries in one request, such as in the following example:

{
"query":"data.Name:\"Example Name\" AND nested(data.Markers, (MarkerMeasuredDepth:(>10000)))"
}
"""



system_prompt_query = """
You are an AI agent that is trying to find the correct OSDU query. 
Your job is to understand the user's ask, combine it with the information about the schema provided
and the schema property fields needed to answer the user's query.
Respond ONLY with the OSDU query that is most relevant to the user's ask.
OSDU query syntax follows Apache Lucene syntax.
If property type is 'array' or marked as nested, use the 'nested' function to query the array.
Respond in JSON format with the following keys: 'query'. do not include any other text.
Do not include kind in your response.
The 2nd term in a nested should be in more parentheses and only include the nested property name.
The first part of the nested should include 'data.' before the property name.
All property names outside a nested should be prefixed with 'data.'.
Check that you are searching for every field.
If no specific filtering is needed, return "*" as the query to match all records.
Some queries need to use GeoContext data.  This should be the full ID name, keyword search does not work.  
The type of data is GeoPoliticalEntityID, which can be countries, fields, locations etc.
A list should be provided of GeoContext if needed.  Use them vertbatim!

<Examples>
user: wells that have both GR and DT logs
assistant: nested(data.Curves,(Mnemonic:GR)) AND nested(data.Curves,(Mnemonic:DT))

user: wells that have logs that have reached over 4000 meters
assistant: data.BottomMeasuredDepth: >4000
                                
user: which wells have Dongen Formation markers
assistant: nested(data.Markers, (MarkerName.keyword: "Dongen Formation"))

user: show me wells in Netherlands
assistant: nested(data.GeoContexts, (GeoPoliticalEntityID:"osdu:master-data--GeoPoliticalEntity:Netherlands_Country"))

user: show all wells in the North Sea
assistant: data.WellID:*

user: show me all data for well 4226.
assistant: data.WellID:"4226"
</Examples>
"""



class OSDUClient:
    """
    OSDUClient - Interface to OSDU API
    
    Responsibilities:
    - Authenticate with OSDU instance
    - Search for wells, wellbores, and welllogs
    - Handle OSDU API responses
    - Transform OSDU data formats
    """
    
    def __init__(self, base_url: str, partition_id: str):
        """
        Initialize OSDU client.
        
        Args:
            base_url: OSDU instance base URL
            partition_id: OSDU data partition ID
            
        Note:
            Authentication is handled via environment variables:
            - OSDU_CLIENT_ID: Cognito client ID
            - OSDU_CLIENT_SECRET: Cognito client secret
            - OSDU_USER_POOL_ID: Cognito user pool ID
            - OSDU_USERNAME: OSDU username
            - OSDU_PASSWORD: OSDU password
        """
        self.base_url = base_url.rstrip('/')
        self.partition_id = partition_id
        self.api_version = 'v2'
        
        # Get OSDU authentication headers from environment variables
        self.osdu_headers = get_osdu_headers()
        if not self.osdu_headers:
            raise Exception("Failed to authenticate with OSDU platform")
    
    def fetch_all_wells(self, spatial_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Fetch all wells from OSDU using search API.
        
        Uses OSDU Search API to retrieve all well records accessible to the user.
        Implements pagination to handle large datasets.
        Optionally applies spatial filtering using polygon geometry.
        
        Args:
            spatial_filter: Optional spatial filter with polygon geometry
                Format: {
                    "field": "data.SpatialLocation.Wgs84Coordinates",
                    "byGeoPolygon": {
                        "points": [
                            {"longitude": 2.667, "latitude": 56.327},
                            ...
                        ]
                    }
                }
        
        Returns:
            List of OSDU well records
            
        Raises:
            Exception: If OSDU API call fails
        """
        if spatial_filter:
            print(f"Fetching wells from OSDU with spatial filter (polygon with {len(spatial_filter.get('byGeoPolygon', {}).get('points', []))} points)")
        else:
            print("Fetching all wells from OSDU")
        
        try:
            # OSDU Search API endpoint
            search_url = f"{self.base_url}/api/search/{self.api_version}/query"
            
            # Use OSDU authentication headers
            headers = self.osdu_headers
            
            # Search query for all wells
            # OSDU uses kind-based search with wildcard
            query_body = {
                'kind': f'{self.partition_id}:wks:master-data--Well:*',
                'limit': 1000,  # Maximum records per page
                'offset': 0,
                "sort": {
                    "field": ["id"],
                    "order": ["DESC"],
                }
            }
            
            # Add spatial filter if provided
            if spatial_filter:
                query_body['spatialFilter'] = spatial_filter
                print(f"Applied spatial filter to query: {spatial_filter}")
            
            all_wells = []
            total_count = 0
            
            # Paginate through results
            while True:
                print(f"Fetching wells: offset={query_body['offset']}, limit={query_body['limit']}")
                
                # Make API request
                response = requests.post(
                    search_url,
                    headers=headers,
                    json=query_body,
                    timeout=30
                )
                
                # Check response status
                if response.status_code == 401:
                    raise Exception("OSDU authentication failed. Please check your credentials.")
                elif response.status_code == 404:
                    raise Exception("OSDU endpoint not found. Please verify the instance URL.")
                elif response.status_code != 200:
                    raise Exception(f"OSDU API error: {response.status_code} - {response.text}")
                
                # Parse response
                result = response.json()
                
                # Extract results
                results = result.get('results', [])
                total_count = result.get('totalCount', 0)
                
                print(f"Received {len(results)} wells (total: {total_count})")
                
                # Add to collection
                all_wells.extend(results)
                
                # Check if we have all results
                if len(all_wells) >= total_count or len(results) == 0:
                    break
                
                # Update offset for next page
                query_body['offset'] += query_body['limit']
            
            print(f"✅ Fetched {len(all_wells)} wells from OSDU")
            return all_wells
            
        except requests.exceptions.Timeout:
            logger.error("OSDU API request timed out")
            raise Exception("OSDU API request timed out. Please try again.")
        except requests.exceptions.ConnectionError:
            logger.error("Failed to connect to OSDU API")
            raise Exception("Failed to connect to OSDU instance. Please check the URL.")
        except Exception as e:
            logger.error(f"Error fetching wells from OSDU: {str(e)}", exc_info=True)
            raise
    
    def fetch_all_wellbores(self) -> List[Dict[str, Any]]:
        """
        Fetch ALL wellbores from OSDU using search API.
        
        Fetches all wellbore records accessible to the user.
        Wellbores will be linked to wells later using WellID field.
        
        Returns:
            List of OSDU wellbore records
            
        Raises:
            Exception: If OSDU API call fails
        """
        print("Fetching all wellbores from OSDU")
        
        try:
            search_url = f"{self.base_url}/api/search/{self.api_version}/query"
            headers = self.osdu_headers
            
            # Search query for all wellbores
            query_body = {
                'kind': f'{self.partition_id}:wks:master-data--Wellbore:*',
                'returnedFields': ['id', 'data.FacilityName', 'data.WellID', 'data.NameAliases'],
                'limit': 1000,
                'offset': 0,
                'sort': {
                    'field': ['id'],
                    'order': ['DESC']
                }
            }
            
            all_wellbores = []
            total_count = 0
            
            # Paginate through results
            while True:
                print(f"Fetching wellbores: offset={query_body['offset']}, limit={query_body['limit']}")
                
                response = requests.post(
                    search_url,
                    headers=headers,
                    json=query_body,
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.warning(f"Wellbore query failed: {response.status_code} - {response.text}")
                    break
                
                result = response.json()
                results = result.get('results', [])
                total_count = result.get('totalCount', 0)
                
                print(f"Received {len(results)} wellbores (total: {total_count})")
                
                all_wellbores.extend(results)
                
                # Check if we have all results
                if len(all_wellbores) >= total_count or len(results) == 0:
                    break
                
                query_body['offset'] += query_body['limit']
            
            print(f"✅ Fetched {len(all_wellbores)} wellbores from OSDU")
            return all_wellbores
            
        except Exception as e:
            logger.error(f"Error fetching wellbores: {str(e)}", exc_info=True)
            logger.warning("Continuing without wellbore data")
            return []
    
    def fetch_wellbores_for_wells(self, well_ids: List[str], batch_size: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch wellbores for multiple wells.
        
        Note: This method now calls fetch_all_wellbores() and filters in memory,
        as OSDU search API doesn't support complex query filters reliably.
        
        Args:
            well_ids: List of well IDs (not used, kept for compatibility)
            batch_size: Not used, kept for compatibility
            
        Returns:
            List of OSDU wellbore records
        """
        print(f"Fetching wellbores (will fetch all and filter in memory)")
        return self.fetch_all_wellbores()
    
    def fetch_all_welllogs(self) -> List[Dict[str, Any]]:
        """
        Fetch ALL welllogs from OSDU using search API.
        
        Fetches all welllog records accessible to the user.
        Welllogs will be linked to wellbores later using WellboreID field.
        
        Returns:
            List of OSDU welllog records
            
        Raises:
            Exception: If OSDU API call fails
        """
        print("Fetching all welllogs from OSDU")
        
        try:
            search_url = f"{self.base_url}/api/search/{self.api_version}/query"
            headers = self.osdu_headers
            
            # Search query for all welllogs
            query_body = {
                'kind': f'{self.partition_id}:wks:work-product-component--WellLog:*',
                'returnedFields': ['id', 'data.WellboreID', 'data.Name', 'data.NameAliases', 'data.Datasets', 'data.Curves'],
                'limit': 1000,
                'offset': 0,
                'sort': {
                    'field': ['id'],
                    'order': ['DESC']
                }
            }
            
            all_welllogs = []
            total_count = 0
            
            # Paginate through results
            while True:
                print(f"Fetching welllogs: offset={query_body['offset']}, limit={query_body['limit']}")
                
                response = requests.post(
                    search_url,
                    headers=headers,
                    json=query_body,
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.warning(f"Welllog query failed: {response.status_code} - {response.text}")
                    break
                
                result = response.json()
                results = result.get('results', [])
                total_count = result.get('totalCount', 0)
                
                print(f"Received {len(results)} welllogs (total: {total_count})")
                
                all_welllogs.extend(results)
                
                # Check if we have all results
                if len(all_welllogs) >= total_count or len(results) == 0:
                    break
                
                query_body['offset'] += query_body['limit']
            
            print(f"✅ Fetched {len(all_welllogs)} welllogs from OSDU")
            return all_welllogs
            
        except Exception as e:
            logger.error(f"Error fetching welllogs: {str(e)}", exc_info=True)
            logger.warning("Continuing without welllog data")
            return []
    
    def fetch_welllogs_for_wellbores(self, wellbore_ids: List[str], batch_size: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch welllogs for multiple wellbores.
        
        Note: This method now calls fetch_all_welllogs() and filters in memory,
        as OSDU search API doesn't support complex query filters reliably.
        
        Args:
            wellbore_ids: List of wellbore IDs (not used, kept for compatibility)
            batch_size: Not used, kept for compatibility
            
        Returns:
            List of OSDU welllog records
        """
        print(f"Fetching welllogs (will fetch all and filter in memory)")
        return self.fetch_all_welllogs()
    
    def search_wells(self, user_prompt: str) -> List[Dict[str, Any]]:
        """
        Search for wells matching a natural language query.
        
        Args:
            user_prompt: User's natural language query
            
        Returns:
            List of matching OSDU well records
        """
        print(f"Searching OSDU wells for: {user_prompt}")
        
        try:
            # Build OSDU search JSON
            search_json = self.build_osdu_search_json(user_prompt, 'well')
            
            # Execute search
            search_url = f"{self.base_url}/api/search/{self.api_version}/query"
            headers = self.osdu_headers
            
            all_results = []
            total_count = 0
            
            # Paginate through results
            while True:
                print(f"Fetching wells: offset={search_json['offset']}, limit={search_json['limit']}")
                
                # DEBUG: Log the complete search request
                print(f"[DEBUG] OSDU Search URL: {search_url}")
                print(f"[DEBUG] OSDU Search JSON Request: {json.dumps(search_json, indent=2)}")
                
                response = requests.post(
                    search_url,
                    headers=headers,
                    json=search_json,
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.error(f"OSDU search failed: {response.status_code} - {response.text}")
                    break
                
                result = response.json()
                results = result.get('results', [])
                total_count = result.get('totalCount', 0)
                
                print(f"Received {len(results)} wells (total: {total_count})")
                all_results.extend(results)
                
                # Check if we have all results
                if len(all_results) >= total_count or len(results) == 0:
                    break
                
                # Update offset for next page
                search_json['offset'] += search_json['limit']
            
            print(f"✅ Found {len(all_results)} matching wells")
            return all_results
            
        except Exception as e:
            logger.error(f"Error searching wells: {str(e)}", exc_info=True)
            return []


    def search_wellbores(self, user_prompt: str) -> Dict[str, Any]:
        """
        Search for wellbores matching a natural language query.
        Returns wellbores grouped by their parent WellID.
        
        Args:
            user_prompt: User's natural language query
            
        Returns:
            Dictionary with:
                - wellbores: List of matching wellbore records
                - well_ids: Set of unique parent well IDs
        """
        print(f"Searching OSDU wellbores for: {user_prompt}")
        
        try:
            # Build OSDU search JSON with aggregation by WellID
            search_json = self.build_osdu_search_json(user_prompt, 'wellbore')
            
            # Execute search
            search_url = f"{self.base_url}/api/search/{self.api_version}/query"
            headers = self.osdu_headers
            
            all_wellbores = []
            well_ids = set()
            total_count = 0
            
            # Paginate through results
            while True:
                print(f"Fetching wellbores: offset={search_json['offset']}, limit={search_json['limit']}")
                
                # DEBUG: Log the complete search request
                print(f"[DEBUG] OSDU Search URL: {search_url}")
                print(f"[DEBUG] OSDU Search JSON Request: {json.dumps(search_json, indent=2)}")
                
                response = requests.post(
                    search_url,
                    headers=headers,
                    json=search_json,
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.error(f"OSDU search failed: {response.status_code} - {response.text}")
                    break
                
                result = response.json()
                results = result.get('results', [])
                total_count = result.get('totalCount', 0)
                
                print(f"Received {len(results)} wellbores (total: {total_count})")
                
                # Extract wellbores and their parent well IDs
                for wellbore in results:
                    all_wellbores.append(wellbore)
                    well_id = wellbore.get('data', {}).get('WellID')
                    if well_id:
                        well_ids.add(well_id)
                
                # Check if we have all results
                if len(all_wellbores) >= total_count or len(results) == 0:
                    break
                
                # Update offset for next page
                search_json['offset'] += search_json['limit']
            
            print(f"✅ Found {len(all_wellbores)} wellbores belonging to {len(well_ids)} wells")
            return {
                'wellbores': all_wellbores,
                'well_ids': well_ids
            }
            
        except Exception as e:
            logger.error(f"Error searching wellbores: {str(e)}", exc_info=True)
            return {'wellbores': [], 'well_ids': set()}


    def search_welllogs(self, user_prompt: str) -> Dict[str, Any]:
        """
        Search for welllogs matching a natural language query.
        Returns welllogs grouped by their parent WellboreID, with mapping to WellID.
        
        Args:
            user_prompt: User's natural language query
            
        Returns:
            Dictionary with:
                - welllogs: List of matching welllog records
                - wellbore_ids: Set of unique parent wellbore IDs
                - well_ids: Set of unique parent well IDs (requires wellbore lookup)
        """
        print("=" * 80)
        print(f"SEARCH_WELLLOGS CALLED")
        print(f"User prompt: {user_prompt}")
        print("=" * 80)
        
        try:
            # Build OSDU search JSON with aggregation by WellboreID
            print("Building OSDU search JSON...")
            search_json = self.build_osdu_search_json(user_prompt, 'welllog')
            print(f"Search JSON built successfully")
            
            # Execute search
            search_url = f"{self.base_url}/api/search/{self.api_version}/query"
            headers = self.osdu_headers
            
            all_welllogs = []
            wellbore_ids = set()
            total_count = 0
            
            # Paginate through results
            while True:
                print(f"Fetching welllogs: offset={search_json['offset']}, limit={search_json['limit']}")
                
                # DEBUG: Log the complete search request
                print(f"[DEBUG] OSDU Search URL: {search_url}")
                print(f"[DEBUG] OSDU Search JSON Request: {json.dumps(search_json, indent=2)}")
                
                response = requests.post(
                    search_url,
                    headers=headers,
                    json=search_json,
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.error(f"OSDU search failed: {response.status_code} - {response.text}")
                    break
                
                result = response.json()
                results = result.get('results', [])
                total_count = result.get('totalCount', 0)
                
                print(f"Received {len(results)} welllogs (total: {total_count})")
                
                # Extract welllogs and their parent wellbore IDs
                for welllog in results:
                    all_welllogs.append(welllog)
                    wellbore_id_raw = welllog.get('data', {}).get('WellboreID')
                    if wellbore_id_raw:
                        # Normalize: remove trailing colon
                        wellbore_id = wellbore_id_raw.rstrip(':')
                        wellbore_ids.add(wellbore_id)
                
                # Check if we have all results
                if len(all_welllogs) >= total_count or len(results) == 0:
                    break
                
                # Update offset for next page
                search_json['offset'] += search_json['limit']
            
            print(f"✅ Found {len(all_welllogs)} welllogs belonging to {len(wellbore_ids)} wellbores")
            
            # Now we need to map wellbore IDs to well IDs
            # Fetch ALL wellbores and filter in memory
            well_ids = set()
            if wellbore_ids:
                print(f"Fetching all wellbore records to map to wells...")
                
                try:
                    # Fetch ALL wellbores (not just the ones we need)
                    all_wellbores = self.fetch_all_wellbores()
                    
                    # Create a mapping of wellbore ID to well ID
                    wellbore_to_well_map = {}
                    wellbores_without_wellid = 0
                    
                    # Debug: Check first wellbore structure
                    if all_wellbores and len(all_wellbores) > 0:
                        sample_wellbore = all_wellbores[0]
                        sample_well_id = sample_wellbore.get('data', {}).get('WellID')
                        print(f"[DEBUG] Sample wellbore structure:")
                        print(f"[DEBUG]   ID: {sample_wellbore.get('id')}")
                        print(f"[DEBUG]   Data keys: {list(sample_wellbore.get('data', {}).keys())}")
                        print(f"[DEBUG]   WellID (raw): {sample_well_id}")
                        if sample_well_id:
                            normalized = sample_well_id.rstrip(':')
                            print(f"[DEBUG]   WellID (normalized): {normalized}")
                    
                    for wellbore in all_wellbores:
                        wellbore_id_raw = wellbore.get('id')
                        well_id_raw = wellbore.get('data', {}).get('WellID')
                        
                        if wellbore_id_raw:
                            # Normalize wellbore ID: remove trailing colon
                            wellbore_id = wellbore_id_raw.rstrip(':')
                            
                            if well_id_raw:
                                # Normalize well ID: remove trailing colon
                                well_id = well_id_raw.rstrip(':')
                                wellbore_to_well_map[wellbore_id] = well_id
                            else:
                                wellbores_without_wellid += 1
                    
                    print(f"Built mapping for {len(wellbore_to_well_map)} wellbores")
                    if wellbores_without_wellid > 0:
                        print(f"[WARNING] {wellbores_without_wellid} wellbores missing WellID field")
                    
                    # Debug: Show sample wellbore IDs from welllogs
                    sample_wellbore_ids = list(wellbore_ids)[:3]
                    print(f"[DEBUG] Sample wellbore IDs from welllogs: {sample_wellbore_ids}")
                    
                    # Debug: Show sample wellbore IDs from mapping
                    sample_mapping_ids = list(wellbore_to_well_map.keys())[:3]
                    print(f"[DEBUG] Sample wellbore IDs from mapping: {sample_mapping_ids}")
                    
                    # Map our wellbore IDs to well IDs
                    matched_count = 0
                    for wellbore_id in wellbore_ids:
                        if wellbore_id in wellbore_to_well_map:
                            well_ids.add(wellbore_to_well_map[wellbore_id])
                            matched_count += 1
                    
                    print(f"✅ Mapped {len(wellbore_ids)} wellbores to {len(well_ids)} parent wells ({matched_count} matched)")
                    
                except Exception as e:
                    logger.warning(f"Error mapping wellbores to wells: {str(e)}")
                    import traceback
                    traceback.print_exc()
            
            return {
                'welllogs': all_welllogs,
                'wellbore_ids': wellbore_ids,
                'well_ids': well_ids
            }
            
        except Exception as e:
            logger.error(f"Error searching welllogs: {str(e)}", exc_info=True)
            return {'welllogs': [], 'wellbore_ids': set(), 'well_ids': set()}


    def generate_query(self, user_prompt: str, schema_type: str) -> str:
        """
        Generates a query based on user prompt, schema data, and identified fields.

        Args:
            query: Search query string
            schema_type: A choice between well, wellbore or welllog based on user prompt
        
        Returns:
            dict: Generated osdu query string
        """

        schema_data_well = {
            "NameAliases": "Alternative names, including historical, by which this master data is/has been known (it should include all the identifiers).",
            "SpatialLocation": "The spatial location information such as coordinates, CRS information (left empty when not appropriate).",
            "GeoContexts": "List of geographic entities which provide context to the master data. This may include multiple types or multiple values of the same type.",
            "Wgs84Coordinates": "The normalized coordinates (Point, MultiPoint, LineString, MultiLineString, Polygon or MultiPolygon) based on WGS 84 (EPSG:4326 for 2-dimensional coordinates, EPSG:4326 + EPSG:5714 (MSL) for 3-dimensional coordinates). This derived coordinate representation is intended for global discoverability only. The schema of this substructure is identical to the GeoJSON FeatureCollection https://geojson.org/schema/FeatureCollection.json. The coordinate sequence follows GeoJSON standard, i.e. longitude, latitude {, height}",
            "FacilityStates": "The history of life cycle states the facility has been through.",
            "FacilityEvents": "A list of key facility events.",
            "CurrentOperatorID": "The current operator organization ID; the organization ID may also be found in the FacilityOperatorOrganisationID of the FacilityOperator array providing the actual dates.",
            "FacilityName": "Name of the Facility.",
            "FacilityID": "Native identifier from a Master Data Management System or other trusted source external to OSDU - stored here in order to allow for multi-system connection and synchronization. If used, the \"Source\" property should identify that source system.",
            "DataSourceOrganisationID": "The main source of the header information.",
            "InitialOperatorID": "A initial operator organization ID; the organization ID may also be found in the FacilityOperatorOrganisationID of the FacilityOperator array providing the actual dates.",
            "FacilityOperators": "The history of operator organizations of the facility.",
            "TerminationDateTime": "The date and time at which the event is no longer in effect. For point-in-time events the 'TerminationDateTime' must be set equal to 'EffectiveDateTime'. Open time intervals have an absent 'TerminationDateTime'.",
            "AliasName": "Alternative Name value of defined name type for an object.",
            "FieldID": "Reference to Field.",
            "BasinID": "Reference to Basin.",
            "FacilityOperatorID": "Internal, unique identifier for an item 'AbstractFacilityOperator'. This identifier is used by 'AbstractFacility.CurrentOperatorID' and 'AbstractFacility.InitialOperatorID'.",
        }

        schema_data_wellbore = {
            "FormationNameAtTotalDepth": "The name of the formation encountered at total depth. The value is not controlled by any reference value list.",
            "OutcomeID": "Outcome [Well Drilling Outcome] is the result of attempting to accomplish the Business Intention [Well Business Intention].",
            "ConditionID": "Condition [Well Condition] is the operational state of a wellbore component relative to the Role [Well Role].",
            "WellID": "the WellID of the parent well of this wellbore",
            "Source": "The entity that produced the record, or from which it is received; could be an organization, agency, system, internal team, or individual. For informational purposes only, the list of sources is not governed.",
            "NameAliases": "Alternative names, including historical, by which this master data is/has been known (it should include all the identifiers).",
            "SpatialLocation": "The spatial location information such as coordinates, CRS information (left empty when not appropriate).",
            "GeoContexts": "List of geographic entities which provide context to the master data. This may include multiple types or multiple values of the same type.",
            "Wgs84Coordinates": "The normalized coordinates (Point, MultiPoint, LineString, MultiLineString, Polygon or MultiPolygon) based on WGS 84 (EPSG:4326 for 2-dimensional coordinates, EPSG:4326 + EPSG:5714 (MSL) for 3-dimensional coordinates). This derived coordinate representation is intended for global discoverability only. The schema of this substructure is identical to the GeoJSON FeatureCollection https://geojson.org/schema/FeatureCollection.json. The coordinate sequence follows GeoJSON standard, i.e. longitude, latitude {, height}",
            "CurrentOperatorID": "The current operator organization ID; the organization ID may also be found in the FacilityOperatorOrganisationID of the FacilityOperator array providing the actual dates.",
            "FacilityName": "Name of the Facility.",
            "FacilityOperators": "The history of operator organizations of the facility.",
            "AliasName": "Alternative Name value of defined name type for an object.",
            "FieldID": "Reference to Field.",
            "BasinID": "Reference to Basin.",
            "EffectiveDateTime": "The date and time at which the facility operator becomes effective.",
            "FacilityOperatorOrganisationID": "The company that currently operates, or previously operated the facility",
            "TerminationDateTime": "The date and time at which the facility operator is no longer in effect. If the operator is still effective, the 'TerminationDateTime' is left absent.",
        }

        schema_data_welllog = {
            "SamplingStop": "The stop value/last value of the ReferenceCurveID, typically the largest value that represents depth or time of the logging. At the Well Log level, this is designed to represent the largest sampling interval of any and all individual logging runs and passes.",
            "SamplingInterval": "For regularly sampled curves this property holds the sampling interval. For non regular sampled data this property is not set. This property can be captured here for composite log sets and within the Well Log Acquisition schema for raw data for each Log Run using the `LogRun[].SamplingInterval`. The IsRegular flag indicates whether SamplingInterval is required.",
            "Remarks":  "A remark array for contextual information during the actual log object acquisition. Explains how the measurement in the wellbore is taken on a point in time or depth. Additional information may be included such as bad weather, tool failure, etc. Usually a part of the log header, log remark contains info specific for an acquisition run, specific for a given logging tool (multiple measurements) and/or a specific interval. In essence, log remark represents the external factors and operational environment, directly or indirectly affecting the measurement quality/uncertainty (dynamically over time/depth) - adding both noise and bias to the measurements.",
            "SamplingStart": "The start value/first value of the ReferenceCurveID, typically the smallest value that represents the depth or time of the logging. At Well Log level, this is designed to represent the smallest sampling interval of any and all individual logging runs and passes.",
            "WellboreID":  "The Wellbore where the Well Log Work Product Component was recorded",
            "Curves": {
                "description": "A curve is a data type that is represented by a series of digits, and are commonly displayed as a continuous line or a series of points referenced to the WellLog reference curve.   A WellLog commonly contains multiple curves.",
                "nested": True,
                "properties": {
                    "SamplingStop": "The stop or largest value of the ReferenceCurveID, typically the stop depth or time of the logging.",
                    "SamplingStart": "The start or smallest value of the ReferenceCurveID, typically the start depth or time of the logging.",
                    "LogCurveMainFamilyID": "The related record id of the Log Curve Main Family Type - which is the Geological Physical Quantity measured - such as porosity.",
                    "LogCurveFamilyID": "The related record id of the Log Curve Family - which is the detailed Geological Physical Quantity Measured - such as neutron porosity",
                    "CurveID": "The ID of the Well Log Curve",
                    "NullValue": "Indicates that there is no measurement within the curve. This attribute is required for the Wellbore DDMS.",
                    "DepthUnit": "Unit of Measure for TopDepth and BaseDepth.",
                    "Mnemonic": "A short or abbreviated form of the curve name, typically provided by the logging vendor or the processing company.  Curve mnemonics have meaning to expert users.",
                    "BaseDepth":  "DEPRECATED: Use `SamplingStop` for consistency. The curves maximum \"depth\" i.e., the reference value at which the curve has its last non-absent value. The curve may contain further absent values in between TopDepth and BaseDepth. Note that the SamplingDomainType may not be a depth as the property name indicates.",
                    "CurveUnit": "Unit of Measure for the Log Curve",
                    "CurveDescription": "Curve description is specific to that single curve mnemonic. In essence, curve description defines the internal factors such as what the \"curve\" or measurement ideally is representing, how is it calculated, what are the assumptions and the \"constants\"."
                }
            }
        }


        messages = []

        if schema_type == 'well':
            messages.append({"role": "user", "content": [{"text": "Schema Data: " + json.dumps(schema_data_well)}]})
        elif schema_type == 'wellbore':
            messages.append({"role": "user", "content": [{"text": "Schema Data: " + json.dumps(schema_data_wellbore)}]})
        elif schema_type == 'welllog':
            messages.append({"role": "user", "content": [{"text": "Schema Data: " + json.dumps(schema_data_welllog)}]})
        messages.append({"role": "user", "content": [{"text": "Query Syntax: " + osdu_search_query_documentation_long}]})
        messages.append({"role": "user", "content": [{"text": "User Prompt: " + user_prompt}]})

        # Use environment variable for model, default to standard Claude 4.5 Sonnet
        model_id = os.environ.get('OSDU_QUERY_MODEL', 'global.anthropic.claude-sonnet-4-5-20250929-v1:0')
        
        agent = Agent(
            model=model_id,
            system_prompt=system_prompt_query,
            messages=messages,
        )

        result = agent("Create an OSDU Apache Lucene query")
        
        # The Agent returns a structured response object, not a JSON string
        # Try to access the content directly
        try:
            # Check if result has content attribute (structured response)
            if hasattr(result, 'content'):
                content = result.content
                print(f'[DEBUG] Agent content: {content}')
                
                # Content is typically a list of content blocks
                if isinstance(content, list) and len(content) > 0:
                    # Get the first content block
                    first_block = content[0]
                    
                    # Check if it's a text block
                    if isinstance(first_block, dict) and 'text' in first_block:
                        text_content = first_block['text']
                    elif hasattr(first_block, 'text'):
                        text_content = first_block.text
                    else:
                        text_content = str(first_block)
                    
                    print(f'[DEBUG] Text content: {text_content}')
                    
                    # Strip markdown code blocks (```json ... ```)
                    import re
                    text_content = re.sub(r'^```(?:json)?\s*\n?', '', text_content.strip())
                    text_content = re.sub(r'\n?```\s*$', '', text_content.strip())
                    text_content = text_content.strip()
                    
                    print(f'[DEBUG] Text content after stripping markdown: {text_content}')
                    
                    # Try to parse as JSON
                    try:
                        parsed = json.loads(text_content)
                        if 'query' in parsed:
                            query = parsed['query']
                            # If query is empty, use wildcard
                            if not query or query.strip() == '':
                                print('[DEBUG] Query is empty, using wildcard')
                                return '*'
                            print(f'[DEBUG] Extracted query: {query}')
                            return query
                    except json.JSONDecodeError:
                        # Text might be just the query itself
                        if text_content and text_content.strip():
                            print(f'[DEBUG] Using text as query: {text_content}')
                            return text_content
                        else:
                            print('[DEBUG] Text content is empty, using wildcard')
                            return '*'
            
            # Fallback: convert to string and try to extract
            result_text = str(result)
            print(f'[DEBUG] Converted to string: {result_text}')
            
            # Strip markdown code blocks
            import re
            result_text = re.sub(r'^```(?:json)?\s*\n?', '', result_text.strip())
            result_text = re.sub(r'\n?```\s*$', '', result_text.strip())
            result_text = result_text.strip()
            
            print(f'[DEBUG] Result text after stripping markdown: {result_text}')
            
            # Try to parse as JSON
            try:
                parsed = json.loads(result_text)
                if 'query' in parsed:
                    query = parsed['query']
                    if not query or query.strip() == '':
                        return '*'
                    print(f'[DEBUG] Result text to be returned: {query}')
                    return query
            except json.JSONDecodeError:
                pass
            
            # Try to extract query from text using regex
            query_match = re.search(r'"query"\s*:\s*"([^"]+)"', result_text)
            if query_match:
                query = query_match.group(1)
                print(f'[DEBUG] Extracted query from regex: {query}')
                return query
            
            # If the text looks like a query itself, use it
            if result_text and result_text != 'None' and len(result_text) > 0:
                print(f'[DEBUG] Using result text as query: {result_text}')
                return result_text
            
        except Exception as e:
            print(f'[ERROR] Error processing agent response: {e}')
            import traceback
            traceback.print_exc()
        
        # Final fallback: return a basic wildcard query
        print('[WARN] Using fallback wildcard query')
        return '*'
    
    def search_and_filter_wells(self, user_prompt: str, current_wells: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Search OSDU based on user prompt and filter to only show wells that are in both
        the search results and currently displayed on the frontend.
        
        This method:
        1. Determines the hierarchy level (well, wellbore, or welllog) from the query
        2. Searches OSDU at the appropriate level
        3. Maps results back to parent wells
        4. Filters current_wells to only include wells that match the search
        
        Args:
            user_prompt: User's natural language query
            current_wells: List of wells currently displayed on frontend
            
        Returns:
            Dictionary with:
                - filtered_wells: Wells that match both search and current display
                - search_results: Raw search results from OSDU
                - hierarchy_level: Level at which search was performed
                - stats: Statistics about the filtering
        """
        print("=" * 80)
        print("SEARCH AND FILTER WELLS")
        print(f"User prompt: {user_prompt}")
        print(f"Current wells count: {len(current_wells)}")
        print("=" * 80)
        
        # Step 1: Determine hierarchy level from query
        hierarchy_level = self._determine_search_hierarchy(user_prompt)
        print(f"Determined hierarchy level: {hierarchy_level}")
        
        # Step 2: Search OSDU at appropriate level
        matching_well_ids = set()
        search_results = None
        
        if hierarchy_level == 'well':
            # Search wells directly
            print("Searching at WELL level...")
            wells = self.search_wells(user_prompt)
            search_results = {'wells': wells}
            
            # Extract well IDs (no normalization needed here, will be normalized later)
            for well in wells:
                well_id = well.get('id') or well.get('data', {}).get('FacilityID')
                if well_id:
                    matching_well_ids.add(well_id)
            
            print(f"Found {len(matching_well_ids)} matching wells")
        
        elif hierarchy_level == 'wellbore':
            # Search wellbores and map to wells
            print("Searching at WELLBORE level...")
            result = self.search_wellbores(user_prompt)
            search_results = result
            matching_well_ids = result['well_ids']
            
            print(f"Found {len(result['wellbores'])} wellbores belonging to {len(matching_well_ids)} wells")
        
        elif hierarchy_level == 'welllog':
            # Search welllogs, map to wellbores, then to wells
            print("Searching at WELLLOG level...")
            result = self.search_welllogs(user_prompt)
            search_results = result
            matching_well_ids = result['well_ids']
            
            print(f"Found {len(result['welllogs'])} welllogs belonging to {len(result['wellbore_ids'])} wellbores and {len(matching_well_ids)} wells")
        
        # Step 3: Filter current wells to only include matching wells
        print("Filtering current wells to match search results...")
        
        # Normalize all matching well IDs from search (only remove trailing colons)
        normalized_matching_ids = set()
        for well_id in matching_well_ids:
            normalized = well_id.rstrip(':') if well_id else well_id
            normalized_matching_ids.add(normalized)
        
        # Create a set of current well IDs (normalized) for fast lookup
        current_well_ids = set()
        well_id_map = {}  # Map normalized ID back to original well object
        for well in current_wells:
            well_id_raw = well.get('well_id') or well.get('id') or well.get('data', {}).get('FacilityID')
            if well_id_raw:
                # Only remove trailing colon, keep everything else as-is
                well_id_normalized = well_id_raw.rstrip(':')
                current_well_ids.add(well_id_normalized)
                well_id_map[well_id_normalized] = well
        
        print(f"Current well IDs: {len(current_well_ids)}")
        print(f"Matching well IDs from search: {len(normalized_matching_ids)}")
        
        # Debug: Show sample IDs
        if current_well_ids:
            sample_current = list(current_well_ids)[:10]
            print(f"[DEBUG] First 10 current well IDs: {sample_current}")
        
        if normalized_matching_ids:
            sample_matching = list(normalized_matching_ids)[:10]
            print(f"[DEBUG] First 10 matching well IDs: {sample_matching}")
        
        # Find intersection - wells that are both in current display AND in search results
        intersection_ids = current_well_ids.intersection(normalized_matching_ids)
        print(f"Intersection (wells to show): {len(intersection_ids)}")
        
        # Filter current wells to only include intersection
        filtered_wells = []
        for normalized_id in intersection_ids:
            if normalized_id in well_id_map:
                filtered_wells.append(well_id_map[normalized_id])
        
        # Calculate statistics
        stats = {
            'total_current_wells': len(current_wells),
            'total_search_matches': len(matching_well_ids),
            'filtered_wells': len(filtered_wells),
            'hierarchy_level': hierarchy_level
        }
        
        print("=" * 80)
        print("SEARCH AND FILTER COMPLETE")
        print(f"  Current wells: {stats['total_current_wells']}")
        print(f"  Search matches: {stats['total_search_matches']}")
        print(f"  Filtered result: {stats['filtered_wells']} wells")
        print(f"  Hierarchy level: {hierarchy_level}")
        print("=" * 80)
        
        return {
            'filtered_wells': filtered_wells,
            'search_results': search_results,
            'hierarchy_level': hierarchy_level,
            'stats': stats
        }
    
    def _determine_search_hierarchy(self, query: str) -> str:
        """
        Determine which hierarchy level to search based on the query.
        
        Args:
            query: User's natural language query
            
        Returns:
            'well', 'wellbore', or 'welllog'
        """
        query_lower = query.lower()
        
        # Check for welllog/curve-specific keywords
        welllog_keywords = [
            'curve', 'curves', 'log', 'logs', 'welllog', 'welllogs',
            'mnemonic', 'mnemonics', 'gr', 'density', 'porosity', 'resistivity',
            'sonic', 'neutron', 'caliper', 'gamma ray', 'dt', 'rhob', 'nphi'
        ]
        
        for keyword in welllog_keywords:
            if keyword in query_lower:
                print(f"Detected welllog-level query (keyword: '{keyword}')")
                return 'welllog'
        
        # Check for wellbore-specific keywords
        wellbore_keywords = [
            'wellbore', 'wellbores', 'bore', 'bores',
            'lateral', 'laterals', 'sidetrack', 'sidetracks'
        ]
        
        for keyword in wellbore_keywords:
            if keyword in query_lower:
                print(f"Detected wellbore-level query (keyword: '{keyword}')")
                return 'wellbore'
        
        # Default to well-level
        print("Defaulting to well-level query")
        return 'well'


    def build_osdu_search_json(self, user_prompt: str, schema_type: str) -> Dict[str, Any]:
        """
        Function that combines the needed elements for an OSDU Search API call JSON.
        
        Args:
            user_prompt: User's natural language query
            schema_type: Type of schema to search ('well', 'wellbore', or 'welllog')
            
        Returns:
            Complete OSDU search JSON with kind, query, and aggregateBy fields
            
        Required format:
        {
            'kind' : schema (*:*:master-data--Well:* or *:*:master-data--Wellbore:* or *:*:work-product-component--WellLog:*),
            'query': an Apache Lucene query,
            'aggregateBy': either 'data.WellID' if kind is Wellbore or 'data.WellboreID' if kind is WellLog,
            'limit': 1000,
            'offset': 0
        }
        """
        print(f"Building OSDU search JSON for schema_type: {schema_type}")
        
        # Generate the Lucene query using AI
        lucene_query = self.generate_query(user_prompt, schema_type)
        print(f"Generated Lucene query: {lucene_query}")
        print(f"Generated Lucene query: {lucene_query}")
        
        # Build the kind string based on schema type
        if schema_type == 'well':
            kind = f'{self.partition_id}:wks:master-data--Well:*'
            aggregate_by = None  # No aggregation needed for wells
        elif schema_type == 'wellbore':
            kind = f'{self.partition_id}:wks:master-data--Wellbore:*'
            aggregate_by = 'data.WellID.keyword'  # Aggregate wellbores by their parent well
        elif schema_type == 'welllog':
            kind = f'{self.partition_id}:wks:work-product-component--WellLog:*'
            aggregate_by = 'data.WellboreID.keyword'  # Aggregate welllogs by their parent wellbore
        else:
            raise ValueError(f"Invalid schema_type: {schema_type}. Must be 'well', 'wellbore', or 'welllog'")
        
        # Build the complete search JSON
        search_json = {
            'kind': kind,
            'limit': 1000,
            'offset': 0,
            'sort': {
                'field': ['id'],
                'order': ['DESC']
            }
        }
        
        # Add query if one was generated
        if lucene_query and lucene_query.strip():
            search_json['query'] = lucene_query
        
        # Add aggregateBy if needed
        if aggregate_by:
            search_json['aggregateBy'] = aggregate_by
        
        print(f"[DEBUG] Complete search JSON built: {json.dumps(search_json, indent=2)}")
        
        return search_json