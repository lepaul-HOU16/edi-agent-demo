import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))

import json
import logging
import hmac
import hashlib
import base64
import boto3
import requests
from osdu_search_tool import osdu_search_tool


username = "edi-user"
password = "Asd!1edi"
client_id="7se4hblptk74h59ghbb694ovj4"
client_secret="k7iq7mnm4k0rp5hmve7ceb8dajkj9vulavetg90epn7an5sekfi"
edi_partition = "osdu"
edi_platform_url = "https://osdu.vavourak.people.aws.dev"
edi_search_url = edi_platform_url + '/api/search/v2/query/'
region = "us-east-1"

# Initialize AWS clients
cognito = boto3.client('cognito-idp', region_name = region)


# table data format

tabular_data_example = {
    'columns': [
        {'field': 'id', 'label': 'ID'},
        {'field': 'kind', 'label': 'Data Type'},
        {'field': 'data.NameAliases.AliasName', 'label': 'Well Name'},
        {'field': 'data.FacilityName', 'label': 'Facility Name'},
    ],
    'data': [
        {
            'id': 'osdu:master-data--Well:2749',
            'kind': 'osdu:wks:master-data--Well:1.0.0',
            'data.NameAliases.AliasName': 'SNK-02, 2749',
            'data.FacilityName': 'SNK-02',
        }, 
        {
            'id': 'osdu:master-data--Well:3063',
            'kind': 'osdu:wks:master-data--Well:1.0.0',
            'data.NameAliases.AliasName': 'SNK-02, 2749',
            'data.FacilityName': 'SNK-02',
        },
    ],
}

body_example = {
    'results': "some text about the results",
    'tool_metadata': "reasoning, chain of thought etc.",
    'geojson': {
        'type': 'FeatureCollection', 
        'features': [
            {'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [4.72883579, 54.07297004]}, 'properties': {'id': 'osdu:master-data--Well:7072', 'aliases': ['F18-02', '7072'], 'name': 'F18-02'}}, 
            {'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [4.08664047, 55.27719839]}, 'properties': {'id': 'osdu:master-data--Well:8003', 'aliases': ['B13-03', '8003'], 'name': 'B13-03'}}, 
            {'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [3.57410219, 53.50054953]}, 'properties': {'id': 'osdu:master-data--Well:7107', 'aliases': ['K08-06', '7107'], 'name': 'K08-06'}}
        ]
    },
    'tabular_data': {
        'columns': [
            {'field': 'id', 'label': 'ID'},
            {'field': 'kind', 'label': 'Data Type'},
            {'field': 'data.NameAliases.AliasName', 'label': 'Well Name'},
            {'field': 'data.FacilityName', 'label': 'Facility Name'},
        ],
        'data': [
            {
                'id': 'osdu:master-data--Well:2749',
                'kind': 'osdu:wks:master-data--Well:1.0.0',
                'data.NameAliases.AliasName': 'SNK-02, 2749',
                'data.FacilityName': 'SNK-02',
            }, 
            {
                'id': 'osdu:master-data--Well:3063',
                'kind': 'osdu:wks:master-data--Well:1.0.0',
                'data.NameAliases.AliasName': 'SNK-02, 2749',
                'data.FacilityName': 'SNK-02',
            }
        ]
    }
}

body = {
    'results': "results data",
    'tool_metadata': "reasoning etc.",
    'geojson': {},
    'tabular_data': {}
}



# Authenticate with EDI
def authenticate_edi(username, password, client_id, client_secret, partition) -> dict:
    """
    Authenticates against AWS Cognito to obtain access tokens for EDI (Energy Data Infrastructure) platform.
    
    Args:
        username (str): EDI username
        password (str): EDI password
        client_id (str): EDI client ID
        client_secret (str): EDI client secret
        partition (str): EDI partition ID
    
    Returns:
        headers is a dict containing:
            - Authorization: Bearer token
            - Content-Type: application/json
            - data-partition-id: EDI partition ID
        Returns (None, None) if authentication fails
    """
    # Authenticate against AWS Cognito

    # Compute secret hash
    message = username + client_id
    dig = hmac.new(client_secret.encode('UTF-8'), msg=message.encode('UTF-8'), digestmod=hashlib.sha256).digest()
    secretHash = base64.b64encode(dig).decode()

    # Attempt to authenticate with the identity provider
    access_token = ""
    try:
        auth_response = cognito.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={"USERNAME": username, "PASSWORD": password, "SECRET_HASH": secretHash},
            ClientId=client_id,
        )
        access_token = auth_response["AuthenticationResult"]["AccessToken"]
        # print("EDI: Authentication successful!")
        # Headers
        headers = {
            "Authorization": "Bearer " + access_token,
            "Content-Type": "application/json",
            "data-partition-id": partition
        }
        return headers
    except:    
        print("EDI: An error occurred in the authentication process.")   
        return None


def transform_to_tabular(results):
    """
    Transform the received data into the tabular_data_example format.
    
    Args:
        results (list): List of dictionaries containing well data
        
    Returns:
        dict: Data in tabular format with columns and data
    """
    # Define the columns structure
    tabular_data = {
        'columns': [
            {'field': 'id', 'label': 'ID'},
            {'field': 'kind', 'label': 'Data Type'},
            {'field': 'data.NameAliases.AliasName', 'label': 'Well Name'},
            {'field': 'data.FacilityName', 'label': 'Facility Name'},
        ],
        'data': []
    }
    
    # Transform each result into the required format
    for item in results:
        # Extract the AliasNames and join them with commas
        alias_names = []
        if 'NameAliases' in item['data']:
            alias_names = [alias['AliasName'] for alias in item['data']['NameAliases']]
        
        # Create the transformed item
        transformed_item = {
            'id': item['id'],
            'kind': item['kind'],
            'data.NameAliases.AliasName': ', '.join(alias_names),
            'data.FacilityName': item['data'].get('FacilityName', '')
        }
        
        # Add to the data list
        tabular_data['data'].append(transformed_item)
    
    return tabular_data


def convert_well_to_geojson(well_data):
    """
    Convert well data from EDI format to GeoJSON Feature format.
    
    Args:
        well_data (dict): Well data in EDI format
        
    Returns:
        dict: Well data in GeoJSON Feature format
    """
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": []
        },
        "properties": {
            "id": well_data.get("id", ""),
            "aliases": []
        }
    }
    
    # Extract coordinates
    if "data" in well_data and "SpatialLocation.Wgs84Coordinates" in well_data["data"]:
        spatial_data = well_data["data"]["SpatialLocation.Wgs84Coordinates"]
        if "geometries" in spatial_data and len(spatial_data["geometries"]) > 0:
            if "coordinates" in spatial_data["geometries"][0]:
                # GeoJSON uses [longitude, latitude] order
                feature["geometry"]["coordinates"] = spatial_data["geometries"][0]["coordinates"]
    
    # Extract name aliases
    if "data" in well_data and "NameAliases" in well_data["data"]:
        aliases = well_data["data"]["NameAliases"]
        for alias in aliases:
            if "AliasName" in alias:
                feature["properties"]["aliases"].append(alias["AliasName"])
    
    # Use the first alias as the name if available
    if feature["properties"]["aliases"]:
        feature["properties"]["name"] = feature["properties"]["aliases"][0]
    
    return feature


# def determine_returned_fields() -> list:
#     """
#     Determines which fields would be useful to show on a table view for the frontend.

#     Args:
#         user_prompt (str): The user's input prompt
#         schema_data (dict or list): Schema data containing available fields
#         schema_fields (dict): Identified schema fields from the query
#         query (str): The generated query string

#     Returns:
#         list: List of fields to return in the search results
#     """

#     global input_data, output_data, search_fields

#     try:
#         print(f'determine_returned_fields: Determining fields to display for user prompt: {input_data["prompt"]}')

#         # Always include these basic fields
#         base_fields = ["id", "kind"]

#         schema_context = f"The schemas being queried are {output_data['searchResults']['search_queries'][0]['data_source']['body']['kind']}."

#         system_prompt_fields = """
#         You are an AI assistant helping determine which fields from OSDU data would be most useful to display in a table view for the frontend.
#         Your job is to analyze the user's query, the schema data, and the fields being searched to determine what information would be most relevant to show in search results.

#         Consider the following when making your selection:
#         1. Include fields that directly answer the user's question
#         2. Include identifying information (names, IDs, etc.) that would help users recognize the records
#         3. Include key metrics or values mentioned in the user's query
#         4. For well data, typically include fields like WellName, WellID, Field, Operator, Status
#         5. For seismic data, typically include fields like SurveyName, VintageName, LineNumber
#         6. For log data, include fields like WellboreID, LogName, TopMeasuredDepth, BottomMeasuredDepth
#         7. Include location information when available (coordinates, field names, etc.)
#         8. Include date information when relevant (acquisition date, drilling date, etc.)

#         Respond with a JSON array of field names that should be returned. All field names should be prefixed with "data."
#         unless they are system fields like "id" or "kind". For nested fields, use dot notation.

#         Example response format:
#         ["id", "kind", "data.WellName", "data.Field", "data.Status", "data.TopMeasuredDepth"]

#         Keep your selection focused and relevant - typically between 5-10 fields total.
#         """

#         # Clean up schema data to make it more manageable for the agent
#         schema_data = get_schema_data(output_data['searchResults']['search_queries'][0]['data_source']['body']['kind'])
#         schema_data = remove_descriptions(schema_data)

#         agent_fields = Agent(
#             model=model_id,
#             system_prompt=system_prompt_fields,
#             messages=[
#                 {"role": "user", "content": [{"text": f"Schema Context: {schema_context}"}]},
#                 {"role": "user", "content": [{"text": "Schema Data: " + json.dumps(schema_data)}]},
#                 # {"role": "user", "content": [{"text": "Schema Fields: " + json.dumps(schema_fields)}]},
#                 {"role": "user", "content": [{"text": "Query: " + output_data['searchResults']['search_queries'][0]['data_source']['body']['query']}]},
#                 {"role": "user", "content": [{"text": "User Prompt: " + input_data["prompt"]}]}
#             ]
#         )

#         response = agent_fields("Determine which fields would be most useful to display in search results")
#         response_text = str(response)

#         print(f'determine_returned_fields: Agent response: {response_text}')


#         returned_fields = []
#         # Parse the response to extract the field list
#         # Try to extract JSON array from the response
#         if "[" in response_text and "]" in response_text:
#             # Extract content between first [ and last ]
#             fields_str = response_text[response_text.find("["):response_text.rfind("]")+1]
#             returned_fields = json.loads(fields_str)

#             # Ensure base fields are included
#             for field in base_fields:
#                 if field not in returned_fields:
#                     returned_fields.append(field)
#         else:
#             print("Could not find JSON array in agent response")

#         print(f'determine_returned_fields: Extracted fields: {returned_fields}')
#         output_data['searchResults']['search_queries'][0]['data_source']['body']['returnedFields'] = returned_fields

#         return returned_fields

#         # system_prompt_names = """
#         # You are an AI assistant helping determine names for fields from OSDU data would be most useful to display in a table view for the frontend.
#         # Your job is to analyze the user's query and the fields being searched to determine how to name the columns in a more user-friendly way, if needed.

#         # Consider the following when making your selection:
#         # 1. process fields one by one.
#         # 2. determine if the field name is easy to understand or if it needs to be modified to something better.
#         # 3. if it needs to be modified, suggest a better name for the field while retaining the meaning.
#         # 4. if it doesn't need to be modified, use the original field name, but make sure it is capitalized correctly.


#         # Respond with a JSON array of field names and labels that should be returned. 

#         # Example response format:
#         # [
#         #     { "field": "id", "label": "ID" },
#         #     { "field": "data.FacilityName", "label": "Well Name" },
#         #     { "field": "data.SeismicVolume", "label": "Seismic Volume" },
#         # ]

#         # Keep your selection focused and relevant - typically between 5-10 fields total.
#         # """

#         # agent_names = Agent(
#         #     model=model_id,
#         #     system_prompt=system_prompt_names,
#         #     messages=[
#         #         {"role": "user", "content": [{"text": f"Schema Context: {schema_context}"}]},
#         #         {"role": "user", "content": [{"text": "Schema Fields: " + json.dumps(returned_fields)}]},
#         #         {"role": "user", "content": [{"text": "User Prompt: " + input_data["prompt"]}]}
#         #     ]
#         # )

#         # response = agent_names("Generate column names following the example.")
#         # response_text = str(response)

#         # print(f'determine_returned_fields: Agent names response: {response_text}')

#         # returned_columns = []
#         # # Parse the response to extract the field list
#         # # Try to extract JSON array from the response
#         # if "[" in response_text and "]" in response_text:
#         #     # Extract content between first [ and last ]
#         #     columns_str = response_text[response_text.find("["):response_text.rfind("]")+1]
#         #     returned_columns = json.loads(columns_str)

#         # else:
#         #     print("Could not find JSON array in agent response")
#         #     base_columns = [
#         #         { "field": "id", "label": "ID" },
#         #         { "field": "kind", "label": "Data Type" },
#         #     ]
#         #     return base_columns

#         # print(f'determine_returned_fields: Extracted fields: {returned_fields}')
#         # output_data['searchResults']['search_queries'][0]['data_source']['body']['tabular_data']['columns'] = returned_fields

#         # return returned_columns
    
#     except Exception as e:
#         print(f"determine_returned_fields: Error processing returned fields: {str(e)}")
#         print(traceback.format_exc())
#         return []


def perform_wellbore_to_well_lookup(wellbore_ids, headers):

    # Build query
    query = ''
    for id in wellbore_ids:
        query += f'id:"{id[:-1]}" OR '
    query = query[:-4]

    full_query_wellbores = {
        'kind': ['*:*:master-data--WellBore:*'],
        'query': query,
        'aggregateBy': 'data.WellID.keyword',
        'limit': 1,
    }

    # print(f'full_query_wellbores={full_query_wellbores}')
    response_wellbores = requests.post(edi_search_url, headers=headers, json=full_query_wellbores).json()
    # print(f'response_wellbores={response_wellbores}')

    well_ids = [item['key'][:-1] for item in response_wellbores['aggregations']]

    print(f'well_ids count=\n{len(well_ids)}')

    query = ''
    for id in well_ids:
        # query += f'id:"{id[:-1]}" OR '
        query += f'id:"{id}" OR '
    query = query[:-4]

    print(f'well_ids query length=\n{len(query)}')
    # print(f'well_ids query=\n{query}')

    full_query_wells = {
        'kind': ['*:*:master-data--Well:*'],
        "returnedFields": ['id', 'kind', 'data.NameAliases.AliasName', 'data.SpatialLocation.Wgs84Coordinates.geometries.coordinates'],
        'limit': 1000,
        'query': query,
    }
    # print(f'full_query_wells=\n{full_query_wells}')

    response_wells = requests.post(edi_search_url, headers=headers, json=full_query_wells).json()
    # print(f'response_wells=\n{response_wells}')

    # Convert each well to GeoJSON Feature
    geojson_features = [convert_well_to_geojson(well) for well in response_wells['results']]

    # Create a GeoJSON FeatureCollection
    geojson_collection = {
        "type": "FeatureCollection",
        "features": geojson_features,
        "metadata": {
            "count": len(geojson_features),
            "type": "wells"
        }
    }

    returned_fields_table = ['id', 'kind', 'data.NameAliases.AliasName', 'data.FacilityName']

    table_query_wells = {
        'kind': ['*:*:master-data--Well:*'],
        "returnedFields": returned_fields_table,
        'limit': 10,
        'query': query,
    }

    # print(f'table_query_wells=\n{table_query_wells}')
    
    response_wells_table = requests.post(edi_search_url, headers=headers, json=table_query_wells).json()

    # print(f'response_wells_table=\n{response_wells_table['results']}')
    
    # Transform the well data to tabular format
    tabular_data = transform_to_tabular(response_wells_table['results'])
    
    return geojson_collection, tabular_data


def lambda_handler(event, context):
    global body

    auth_headers = authenticate_edi(username, password, client_id, client_secret, edi_partition)

    prompt = event.get('prompt', "Which wells have DT and GR logs")
    print(f'prompt={prompt}')

    sample_request = {
        "prompt": prompt,
        "sessionId": "test-session-123",
        "data_sources": [
            {
                "name": "osdu",
                "type": "osdu",
                "connection_info": {
                    "url": edi_search_url,
                    "auth_type": "bearer_token",
                    "method": "POST",
                    "headers": auth_headers
                }
            }
        ],
        # "spatial_data": {
        #     "type": "Polygon",
        #     "coordinates": [
        #     [
        #         [3.331, 53.510],
        #         [7.227, 53.510],
        #         [7.227, 50.750],
        #         [3.331, 50.750],
        #         [3.331, 53.510]
        #     ]
        #     ],
        #     "crs": "EPSG:4326"
        # }
    }
    
    # print(f'sample_request={sample_request}')

    results_tool = osdu_search_tool(sample_request)

    # results_tool = {
    #     'chainOfThought': 'Because!', 
    #     'sessionId': 'test-session-123', 
    #     'chat_history': [], 
    #     'searchResults': {
    #         'search_queries': [
    #             {
    #                 'data_source': {
    #                     'name': 'osdu', 
    #                     'type': 'osdu', 
    #                     'connection_info': {
    #                         'url': 'https://osdu.vavourak.people.aws.dev/api/search/v2/query/', 
    #                         'auth_type': 'bearer_token', 
    #                         'method': 'POST', 
    #                         'headers': {
    #                             'Authorization': '', 
    #                             'Content-Type': 'application/json', 
    #                             'data-partition-id': 'osdu'
    #                         }
    #                     }, 
    #                     'body': {
    #                         'kind': ['*:*:work-product-component--WellLog:*'],
    #                         'query': 'nested(data.Curves,(Mnemonic:GR)) AND nested(data.Curves,(Mnemonic:DT))', 
    #                         'aggregateBy': 'data.WellboreID.keyword', 
    #                         'returnedFields': '',
    #                         'spatial_filter': {}, 
    #                         'tabular_data': {},
    #                     }
    #                 }
    #             }
    #         ]
    #     }
    # }

    # results_data = perform_osdu_search(results_tool['searchResults']['search_queries'][0]['data_source']['body'], auth_headers)

    full_query = {
        'kind': results_tool['searchResults']['search_queries'][0]['data_source']['body']['kind'],
        'query': results_tool['searchResults']['search_queries'][0]['data_source']['body']['query'],
        'aggregateBy': results_tool['searchResults']['search_queries'][0]['data_source']['body']['aggregateBy'],
        'limit': 1,
    }

    # print(f'full_query={full_query}')
    results_data = requests.post(edi_search_url, headers=auth_headers, json=full_query)
    results_data = results_data.json()
    # print(f'results_data=\n{results_data}')
    results_aggregate = results_data['aggregations']
    results_aggregate_keys = [item['key'] for item in results_aggregate]
    # print(f'\n\n\n results_aggregate_keys={results_aggregate_keys}')

    well_geojson_data = {}
    tabular_data = {}
    if results_tool['searchResults']['search_queries'][0]['data_source']['body']['aggregateBy'] == 'data.WellboreID.keyword':
        well_geojson_data, tabular_data = perform_wellbore_to_well_lookup(results_aggregate_keys, auth_headers)
        # print(f'\n\n\n well_ids={well_ids}')



    body['geojson'] = well_geojson_data
    body['tabular_data'] = tabular_data

    # print(f'\n\n\n well_geojson_data=\n{well_geojson_data}')

    print(f'body={body}')

    return {
        'statusCode': 200,
        'body': json.dumps(body)
    }


if __name__ == "__main__":
    event = {}
    event['prompt'] = "what wells have GR and RHOB and DT logs?"

    response = lambda_handler(event, None)

    # print(f'response=\n{response['body']}')
