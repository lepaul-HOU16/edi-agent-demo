import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))

import boto3
import hmac
import hashlib
import base64
import logging
import requests
import json
import math
import uuid
import time
from urllib.parse import urlparse

# EDI
edi_username = "edi-user"
edi_password = "Asd!1edi"
edi_client_id="7se4hblptk74h59ghbb694ovj4"
edi_client_secret="k7iq7mnm4k0rp5hmve7ceb8dajkj9vulavetg90epn7an5sekfi"
edi_partition = "osdu"
edi_platform_url = "https://osdu.vavourak.people.aws.dev"
edi_search_url = edi_platform_url + '/api/search/v2/query/'

S3_URI = 's3://vavourak-edi-kb-data/demo_map_data/'
S3_BUCKET = "vavourak-edi-kb-data"
S3_PREFIX = "demo_map_data/"
S3_WELL_FILENAME = 'map_well_locations.json'
S3_SEISMIC_FILENAME = 'map_seismic_grids.json'
S3_WELL_SUBSET_FILENAME = 'map_well_locations_subset.json'
S3_SEISMIC_SUBSET_FILENAME = 'map_seismic_grids_subset.json'
AWS_REGION = "us-east-1"

# GeoJSON types
GEOJSON_POINT = "Point"
GEOJSON_POLYGON = "Polygon"
GEOJSON_FEATURE = "Feature"
GEOJSON_FEATURE_COLLECTION = "FeatureCollection"


logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


# Initialize AWS clients
cognito = boto3.client('cognito-idp', region_name = AWS_REGION)
s3 = boto3.client('s3', region_name = AWS_REGION)


# Authenticate with EDI
def authenticate_edi():
    """
    Authenticates against AWS Cognito to obtain access tokens for EDI (Energy Data Infrastructure) platform.
    
    This function:
    1. Computes a secret hash using HMAC-SHA256
    2. Attempts to authenticate with AWS Cognito using username/password
    3. Returns authentication headers if successful
    
    Returns:
        dict: Authentication headers containing:
            - Authorization: Bearer token
            - Content-Type: application/json
            - data-partition-id: EDI partition ID
        None: If authentication fails
    """
    # Authenticate against AWS Cognito

    # Compute secret hash
    message = edi_username + edi_client_id
    dig = hmac.new(edi_client_secret.encode('UTF-8'), msg=message.encode('UTF-8'), digestmod=hashlib.sha256).digest()
    secretHash = base64.b64encode(dig).decode()

    # Attempt to authenticate with the identity provider
    access_token = ""
    try:
        auth_response = cognito.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={"USERNAME": edi_username, "PASSWORD": edi_password, "SECRET_HASH": secretHash},
            ClientId=edi_client_id,
        )
        access_token = auth_response["AuthenticationResult"]["AccessToken"]
        # print("EDI: Authentication successful!")
        # Headers
        headers = {
            "Authorization": "Bearer " + (access_token or ""),
            "Content-Type": "application/json",
            "data-partition-id": edi_partition
        }
        return headers
    except:    
        print("EDI: An error occurred in the authentication process.")   
        return None


# Send a full query to EDI
def edi_search(query):
    headers = authenticate_edi()
    response = requests.post(edi_search_url, headers=headers, json=query)
    return response.json()


def convert_well_to_geojson(well_data):
    """
    Convert well data from EDI format to GeoJSON Feature format.
    
    Args:
        well_data (dict): Well data in EDI format
        
    Returns:
        dict: Well data in GeoJSON Feature format
    """
    feature = {
        "type": GEOJSON_FEATURE,
        "geometry": {
            "type": GEOJSON_POINT,
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


def convert_seismic_to_geojson(seismic_data):
    """
    Convert seismic data from EDI format to GeoJSON Feature format.
    
    Args:
        seismic_data (dict): Seismic data in EDI format
        
    Returns:
        dict: Seismic data in GeoJSON Feature format
    """
    feature = {
        "type": GEOJSON_FEATURE,
        "geometry": {
            "type": GEOJSON_POLYGON,
            "coordinates": []
        },
        "properties": {
            "id": seismic_data.get("id", ""),
            "name": ""
        }
    }
    
    # Extract coordinates
    if "data" in seismic_data and "SpatialArea.Wgs84Coordinates" in seismic_data["data"]:
        spatial_data = seismic_data["data"]["SpatialArea.Wgs84Coordinates"]
        if "geometries" in spatial_data and len(spatial_data["geometries"]) > 0:
            if "coordinates" in spatial_data["geometries"][0]:
                # GeoJSON polygons are arrays of linear rings
                # The first element is the exterior ring
                feature["geometry"]["coordinates"] = [spatial_data["geometries"][0]["coordinates"]]
    
    # Extract name
    if "data" in seismic_data and "Name" in seismic_data["data"]:
        feature["properties"]["name"] = seismic_data["data"]["Name"]
    
    return feature


def convert_to_geojson_collection(features, feature_type="features"):
    """
    Convert a list of GeoJSON features to a GeoJSON FeatureCollection.
    
    Args:
        features (list): List of GeoJSON features
        feature_type (str): Type of features (for metadata)
        
    Returns:
        dict: GeoJSON FeatureCollection
    """
    return {
        "type": GEOJSON_FEATURE_COLLECTION,
        "features": features,
        "metadata": {
            "count": len(features),
            "type": feature_type
        }
    }


def writeAllWellCoords():
    query_AllWells = {
        "kind": "*:*:*master-data--Well:*",
        "returnedFields": ['id', 'data.NameAliases.AliasName', 'data.SpatialLocation.Wgs84Coordinates.geometries.coordinates'],
        "offset": 0,
        "limit": 1,
    }

    check_count = edi_search(query_AllWells)
    query_AllWells['limit'] = 1000
    
    if check_count['totalCount'] > 1000:
        results = []
        for i in range(0, check_count['totalCount'], 1000):
            query_AllWells['offset'] = i
            results.extend(edi_search(query_AllWells)['results'])
    else:
        results = edi_search(query_AllWells)['results']

    # Convert results to GeoJSON and write to S3
    try:
        # Convert each well to GeoJSON Feature
        geojson_features = [convert_well_to_geojson(well) for well in results]
        
        # Create a GeoJSON FeatureCollection
        geojson_collection = convert_to_geojson_collection(geojson_features, "wells")
        
        s3_key = S3_PREFIX + S3_WELL_FILENAME
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=json.dumps(geojson_collection),
            ContentType='application/json'
        )
        logger.info(f"Successfully wrote {len(geojson_features)} well locations as GeoJSON to s3://{S3_BUCKET}/{s3_key}")
        return {
            "count": check_count['totalCount'],
            "s3_uri": f"s3://{S3_BUCKET}/{s3_key}",
            "success": True
        }
    except Exception as e:
        logger.error(f"Error writing well locations to S3: {str(e)}")
        return {
            "count": check_count['totalCount'],
            "error": str(e),
            "success": False
        }


def writeAllSeismicCoords():
    query_AllSeismicGrids = {
        "kind": "osdu:wks:work-product-component--SeismicBinGrid:*",
        "returnedFields": ['id', 'data.Name', 'data.SpatialArea.Wgs84Coordinates.geometries.coordinates'],
        "offset": 0,
        "limit": 1,
    }

    check_count = edi_search(query_AllSeismicGrids)
    query_AllSeismicGrids['limit'] = 1000

    if check_count['totalCount'] > 1000:
        results = []
        for i in range(0, check_count['totalCount'], 1000):
            query_AllSeismicGrids['offset'] = i
            results.extend(edi_search(query_AllSeismicGrids)['results'])
    else:
        results = edi_search(query_AllSeismicGrids)['results']

    # Convert results to GeoJSON and write to S3
    try:
        # Convert each seismic grid to GeoJSON Feature
        geojson_features = [convert_seismic_to_geojson(seismic) for seismic in results]
        
        # Create a GeoJSON FeatureCollection
        geojson_collection = convert_to_geojson_collection(geojson_features, "seismic")
        
        s3_key = S3_PREFIX + S3_SEISMIC_FILENAME
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=json.dumps(geojson_collection),
            ContentType='application/json'
        )
        logger.info(f"Successfully wrote {len(geojson_features)} seismic grids as GeoJSON to s3://{S3_BUCKET}/{s3_key}")
        return {
            "count": check_count['totalCount'],
            "s3_uri": f"s3://{S3_BUCKET}/{s3_key}",
            "success": True
        }
    except Exception as e:
        logger.error(f"Error writing seismic grids to S3: {str(e)}")
        return {
            "count": check_count['totalCount'],
            "error": str(e),
            "success": False
        }


def getCurrentCoords():
    """
    Retrieves both well and seismic location data from S3.
    
    Returns:
        dict: A dictionary containing both well and seismic data
    """
    well_data = None
    seismic_data = None
    
    try:
        # Get well data
        well_key = S3_PREFIX + S3_WELL_SUBSET_FILENAME
        well_response = s3.get_object(Bucket=S3_BUCKET, Key=well_key)
        well_data = json.loads(well_response['Body'].read().decode('utf-8'))
        logger.info(f"Successfully retrieved well data from S3: {len(well_data)} records")
    except Exception as e:
        logger.error(f"Error retrieving well data from S3: {str(e)}")
    
    try:
        # Get seismic data
        seismic_key = S3_PREFIX + S3_SEISMIC_SUBSET_FILENAME
        seismic_response = s3.get_object(Bucket=S3_BUCKET, Key=seismic_key)
        seismic_data = json.loads(seismic_response['Body'].read().decode('utf-8'))
        logger.info(f"Successfully retrieved seismic data from S3: {len(seismic_data)} records")
    except Exception as e:
        logger.error(f"Error retrieving seismic data from S3: {str(e)}")

    return {
        "wells": well_data,
        "seismic": seismic_data
    }


def getAllCoords():
    """
    Retrieves both well and seismic location data from S3.
    
    Returns:
        dict: A dictionary containing both well and seismic data
    """
    well_data = None
    seismic_data = None
    
    try:
        # Get well data
        well_key = S3_PREFIX + S3_WELL_FILENAME
        well_response = s3.get_object(Bucket=S3_BUCKET, Key=well_key)
        well_data = json.loads(well_response['Body'].read().decode('utf-8'))
        logger.info(f"Successfully retrieved well data from S3: {len(well_data)} records")
    except Exception as e:
        logger.error(f"Error retrieving well data from S3: {str(e)}")
    
    try:
        # Get seismic data
        seismic_key = S3_PREFIX + S3_SEISMIC_FILENAME
        seismic_response = s3.get_object(Bucket=S3_BUCKET, Key=seismic_key)
        seismic_data = json.loads(seismic_response['Body'].read().decode('utf-8'))
        logger.info(f"Successfully retrieved seismic data from S3: {len(seismic_data)} records")
    except Exception as e:
        logger.error(f"Error retrieving seismic data from S3: {str(e)}")

    return {
        "wells": well_data,
        "seismic": seismic_data
    }


def handler(event, context):
    print(f"Received event: {event}")

    if event.get('body'):
        body = json.loads(event['body'])
        event_type = body.get('type', '')
    else:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No body in request'})
        }
    
    print(f"Received event type: {event_type}")
    
    
    response = {
        'statusCode': 200,
        # 'headers': {
        #     'Content-Type': 'application/json',
        #     'Access-Control-Allow-Origin': '*'
        # },
        'body': {}
    }

    # Handle the main routes
    if event_type == 'get_all_map_data':
        # Get the data
        locations = getAllCoords()
        data_json = json.dumps(locations)
        response['body'] = data_json

    elif event_type == 'write_all_map_data':
        writeAllWellCoords()
        writeAllSeismicCoords()
        response['body'] = json.dumps({"status": "Data written successfully"})
        
    elif event_type == 'get_search_results':
        # Get the subset data
        locations = getCurrentCoords()
        data_json = json.dumps(locations)
        
        # Small enough to send in one response
        response['body'] = data_json
    
    else:
        response['statusCode'] = 400
        response['body'] = json.dumps({'error': f'Unsupported event: {event_type}'})
    
    print(f'response size={len(response["body"])}')
    return response
