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


# Authenticate with EDI
def authenticate_edi(username, password, client_id, client_secret, partition):
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
        return None, None


def perform_osdu_search(search_body: dict, headers):
    """
    Tests the complete query by performing a search using the provided parameters.
    """

    full_query = {
        'kind': search_body['kind'],
        'query': search_body['query'],
        'aggregateBy': search_body['aggregateBy'],
        'returnedFields': search_body['returnedFields'],
        'limit': 1,
    }

    print(f'\ntest_complete_query: full_query={full_query}')

    response = requests.post(edi_search_url, headers=headers, json=full_query)
    print(f'\ntest_complete_query: test query response code={response.status_code}')

    trimmed_response = response.json()
    trimmed_response['aggregations'] = trimmed_response['aggregations']

    return trimmed_response


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

def perform_wellbore_to_well_lookup(wellbore_ids, headers):

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

    print(f'full_query_wellbores={full_query_wellbores}')
    response_wellbores = requests.post(edi_search_url, headers=headers, json=full_query_wellbores).json()
    print(f'response_wellbores={response_wellbores}')

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
        "returnedFields": ['id', 'data.NameAliases.AliasName', 'data.SpatialLocation.Wgs84Coordinates.geometries.coordinates'],
        'limit': 1000,
        'query': query,
    }
    print(f'full_query_wells=\n{full_query_wells}')

    response_wells = requests.post(edi_search_url, headers=headers, json=full_query_wells).json()
    print(f'response_wells=\n{response_wells}')

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

    return geojson_collection


def lambda_handler(event, context):
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
    #     'chainOfThought': '', 
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
    #                         'returnedFields': ['id', 'kind', 'data.Name', 'data.WellboreID', 'data.TopMeasuredDepth', 'data.BottomMeasuredDepth', 'data.WellLogTypeID', 'data.LogVersion', 'data.ServiceCompanyID', 'data.LogServiceDateInterval'], 
    #                         'query': 'nested(data.Curves,(Mnemonic:GR)) AND nested(data.Curves,(Mnemonic:DT))', 
    #                         'aggregateBy': 'data.WellboreID.keyword', 
    #                         'spatial_filter': {}, 
    #                         'limit': 50, 
    #                         'tabular_data': {}
    #                     }
    #                 }
    #             }
    #         ]
    #     }
    # }

    results_data = perform_osdu_search(results_tool['searchResults']['search_queries'][0]['data_source']['body'], auth_headers)

    results_aggregate = results_data['aggregations']
    results_aggregate_keys = [item['key'] for item in results_aggregate]
    # print(f'\n\n\n results_aggregate_keys={results_aggregate_keys}')

    well_geojson_data = {}
    if results_tool['searchResults']['search_queries'][0]['data_source']['body']['aggregateBy'] == 'data.WellboreID.keyword':
        well_geojson_data = perform_wellbore_to_well_lookup(results_aggregate_keys, auth_headers)
        # print(f'\n\n\n well_ids={well_ids}')

    # print(f'\n\n\n well_geojson_data=\n{well_geojson_data}')

    body = {
        'results': "results data",
        'tool_metadata': "reasoning etc.",
        'geojson': well_geojson_data
    }

    print(f'body={body}')

    return {
        'statusCode': 200,
        'body': json.dumps(body)
    }


if __name__ == "__main__":
    event = {}
    event['prompt'] = "what wells have GR and RHOB and DT logs?"

    try: 
        response = lambda_handler(event, None)
    except Exception as e:
        print(f"Error: {e}")

    # print(f'response=\n{response['body']}')
