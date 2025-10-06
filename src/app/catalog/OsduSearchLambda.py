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


def perform_wellbore_to_well_lookup(wellbore_ids: list, headers: dict):
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

    return well_ids


def well_to_geojson_and_tabular_data(well_ids: list, headers: dict):
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

    prompt = json.loads(event.get('body'))
    prompt = prompt.get('prompt')

    print(f'prompt={prompt}')

    request = {
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

    results_tool = osdu_search_tool(request)

    print(f'results_tool={results_tool}')

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

    full_query = {
        'kind': results_tool['searchResults']['search_queries'][0]['data_source']['body']['kind'],
        'query': results_tool['searchResults']['search_queries'][0]['data_source']['body']['query'],
        'aggregateBy': results_tool['searchResults']['search_queries'][0]['data_source']['body']['aggregateBy'],
        'limit': 1,
    }

    print(f'full_query=\n{full_query}')
    results_data = requests.post(edi_search_url, headers=auth_headers, json=full_query)
    results_data = results_data.json()
    print(f'results_data=\n{results_data}')
    results_aggregate = results_data['aggregations']
    results_aggregate_keys = [item['key'] for item in results_aggregate]
    print(f'results_aggregate_keys=\n{results_aggregate_keys}')

    # Get map and table data
    well_geojson_data = {}
    tabular_data = {}

    if results_tool['searchResults']['search_queries'][0]['data_source']['body']['aggregateBy'] == 'data.WellboreID.keyword':
        well_ids = perform_wellbore_to_well_lookup(results_aggregate_keys, auth_headers)
        # print(f'\n\n\n well_ids={well_ids}')
        well_geojson_data, tabular_data = well_to_geojson_and_tabular_data(well_ids, auth_headers)

    if results_tool['searchResults']['search_queries'][0]['data_source']['body']['aggregateBy'] == 'data.FacilityID.keyword' or \
        results_tool['searchResults']['search_queries'][0]['data_source']['body']['aggregateBy'] == 'data.FacilityName.keyword':
        well_geojson_data, tabular_data = well_to_geojson_and_tabular_data(results_aggregate_keys, auth_headers)
    

    body['geojson'] = well_geojson_data
    body['tabular_data'] = tabular_data

    # print(f'\n\n\n well_geojson_data=\n{well_geojson_data}')

    # print(f'body=\n{body}')

    return {
        'statusCode': 200,
        'body': json.dumps(body)
    }


if __name__ == "__main__":

    prompt = "what wells have GR and RHOB and DT logs?"
    # prompt = "Show me WELL-008"
    # prompt = "Show me wells in Vietnam"
    # prompt = "Display wells with core data"
    # prompt = "Show me data owned by my company"

    event = {}
    event['body'] = json.dumps({
        "prompt": prompt,
    })

    response = lambda_handler(event, None)

    # print(f'response=\n{response['body']}')
