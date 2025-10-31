"""
S3 Session Manager
Manages session-based file storage in S3 for catalog search.
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()

# File naming constants
SESSION_HISTORY_FILE = 'session_history.json'
METADATA_PREFIX = 'well_metadata_'
GEOJSON_PREFIX = 'well_geojson_'


class S3SessionManager:
    """
    S3SessionManager - Manages session-based file storage in S3
    
    Responsibilities:
    - Store and retrieve metadata files (all_well_metadata.json, filtered versions)
    - Store and retrieve GeoJSON files (all_well_geojson.json, filtered versions)
    - Manage session history (session_history.json)
    - Generate versioned filenames for filtered datasets
    - Create S3 signed URLs for frontend access
    - Clean up filtered files on session reset
    """
    
    def __init__(self, bucket_name: str):
        """
        Initialize S3SessionManager.
        
        Args:
            bucket_name: S3 bucket name for session storage
        """
        self.bucket_name = bucket_name
        self.s3_client = boto3.client('s3')
        
        if not self.bucket_name:
            logger.warning('S3SessionManager: No bucket name provided, operations may fail')
    
    def _get_session_key(self, session_id: str, filename: str) -> str:
        """
        Get the S3 key for a session file.
        
        Args:
            session_id: Unique session identifier
            filename: Name of the file
            
        Returns:
            S3 key string in format: {session_id}/{filename}
        """
        return f"{session_id}/{filename}"
    
    def store_metadata(
        self, 
        session_id: str, 
        data: List[Dict[str, Any]], 
        version: Optional[int] = None
    ) -> str:
        """
        Store metadata file in S3.
        
        Args:
            session_id: Unique session identifier
            data: Well metadata array
            version: Optional version number for filtered datasets (1, 2, 3, etc.)
            
        Returns:
            S3 key of stored file
        """
        try:
            # Always use versioned filename (default to version 1 if not specified)
            if version is None:
                version = 1
            
            filename = f"{METADATA_PREFIX}{version:03d}.json"
            key = self._get_session_key(session_id, filename)
            
            logger.info(f"Storing metadata to S3: {key}")
            logger.info(f"Metadata count: {len(data)} wells")
            
            # Prepare metadata
            metadata = {
                'sessionId': session_id,
                'fileType': 'metadata',
                'version': str(version) if version is not None else 'all',
                'wellCount': str(len(data)),
                'timestamp': datetime.now().isoformat()
            }
            
            # Store in S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=json.dumps(data, indent=2),
                ContentType='application/json',
                Metadata=metadata
            )
            
            logger.info(f"✅ Metadata stored successfully: {key}")
            return key
            
        except Exception as e:
            logger.error(f"Error storing metadata to S3: {str(e)}", exc_info=True)
            raise Exception(f"Failed to store metadata: {str(e)}")
    
    def store_geojson(
        self, 
        session_id: str, 
        data: Dict[str, Any], 
        version: Optional[int] = None
    ) -> str:
        """
        Store GeoJSON file in S3.
        
        Args:
            session_id: Unique session identifier
            data: GeoJSON FeatureCollection
            version: Optional version number for filtered datasets
            
        Returns:
            S3 key of stored file
        """
        try:
            # Always use versioned filename (default to version 1 if not specified)
            if version is None:
                version = 1
            
            filename = f"{GEOJSON_PREFIX}{version:03d}.json"
            key = self._get_session_key(session_id, filename)
            
            feature_count = len(data.get('features', []))
            logger.info(f"Storing GeoJSON to S3: {key}")
            logger.info(f"Feature count: {feature_count} features")
            
            # Prepare metadata
            metadata = {
                'sessionId': session_id,
                'fileType': 'geojson',
                'version': str(version) if version is not None else 'all',
                'featureCount': str(feature_count),
                'timestamp': datetime.now().isoformat()
            }
            
            # Store in S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=json.dumps(data, indent=2),
                ContentType='application/geo+json',
                Metadata=metadata
            )
            
            logger.info(f"✅ GeoJSON stored successfully: {key}")
            return key
            
        except Exception as e:
            logger.error(f"Error storing GeoJSON to S3: {str(e)}", exc_info=True)
            raise Exception(f"Failed to store GeoJSON: {str(e)}")
    
    def store_history(self, session_id: str, history: Dict[str, Any]) -> None:
        """
        Store session history in S3.
        
        Args:
            session_id: Unique session identifier
            history: Chat history dictionary
        """
        try:
            key = self._get_session_key(session_id, SESSION_HISTORY_FILE)
            
            message_count = len(history.get('messages', []))
            logger.info(f"Storing session history to S3: {key}")
            logger.info(f"Message count: {message_count} messages")
            
            # Prepare metadata
            metadata = {
                'sessionId': session_id,
                'fileType': 'history',
                'messageCount': str(message_count),
                'timestamp': datetime.now().isoformat()
            }
            
            # Store in S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=json.dumps(history, indent=2),
                ContentType='application/json',
                Metadata=metadata
            )
            
            logger.info(f"✅ Session history stored successfully: {key}")
            
        except Exception as e:
            logger.error(f"Error storing session history to S3: {str(e)}", exc_info=True)
            raise Exception(f"Failed to store session history: {str(e)}")
    
    def get_next_version(self, session_id: str) -> int:
        """
        Get the next version number for filtered files.
        
        Args:
            session_id: Unique session identifier
            
        Returns:
            Next version number (1, 2, 3, etc.)
        """
        try:
            prefix = f"{session_id}/{METADATA_PREFIX}"
            
            logger.info(f"Getting next version for session: {session_id}")
            logger.info(f"Listing objects with prefix: {prefix}")
            
            # List existing files
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            existing_files = response.get('Contents', [])
            logger.info(f"Found {len(existing_files)} existing files")
            
            if not existing_files:
                logger.info("No existing files, returning version 1")
                return 1
            
            # Extract version numbers from filenames
            versions = []
            for file in existing_files:
                key = file.get('Key', '')
                # Extract version from filename like "well_metadata_001.json"
                if METADATA_PREFIX in key:
                    try:
                        # Get the part after the prefix and before .json
                        version_str = key.split(METADATA_PREFIX)[1].split('.json')[0]
                        version = int(version_str)
                        versions.append(version)
                    except (IndexError, ValueError):
                        continue
            
            if not versions:
                logger.info("No valid version numbers found, returning version 1")
                return 1
            
            max_version = max(versions)
            next_version = max_version + 1
            
            logger.info(f"Max existing version: {max_version}, next version: {next_version}")
            return next_version
            
        except Exception as e:
            logger.error(f"Error getting next version: {str(e)}", exc_info=True)
            # If there's an error, default to version 1
            logger.info("Defaulting to version 1 due to error")
            return 1
    
    def get_metadata(
        self, 
        session_id: str, 
        version: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get metadata from S3.
        
        Args:
            session_id: Unique session identifier
            version: Optional version number for filtered datasets
            
        Returns:
            Well metadata array
        """
        try:
            # Always use versioned filename (default to version 1 if not specified)
            if version is None:
                version = 1
            
            filename = f"{METADATA_PREFIX}{version:03d}.json"
            key = self._get_session_key(session_id, filename)
            
            logger.info(f"Retrieving metadata from S3: {key}")
            
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=key
            )
            
            body = response['Body'].read().decode('utf-8')
            metadata = json.loads(body)
            
            logger.info(f"✅ Retrieved {len(metadata)} wells from S3")
            return metadata
            
        except Exception as e:
            logger.error(f"Error retrieving metadata from S3: {str(e)}", exc_info=True)
            raise Exception(f"Failed to retrieve metadata: {str(e)}")
    
    def get_geojson(
        self, 
        session_id: str, 
        version: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get GeoJSON from S3.
        
        Args:
            session_id: Unique session identifier
            version: Optional version number for filtered datasets
            
        Returns:
            GeoJSON FeatureCollection
        """
        try:
            # Always use versioned filename (default to version 1 if not specified)
            if version is None:
                version = 1
            
            filename = f"{GEOJSON_PREFIX}{version:03d}.json"
            key = self._get_session_key(session_id, filename)
            
            logger.info(f"Retrieving GeoJSON from S3: {key}")
            
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=key
            )
            
            body = response['Body'].read().decode('utf-8')
            geojson = json.loads(body)
            
            feature_count = len(geojson.get('features', []))
            logger.info(f"✅ Retrieved {feature_count} features from S3")
            return geojson
            
        except Exception as e:
            logger.error(f"Error retrieving GeoJSON from S3: {str(e)}", exc_info=True)
            raise Exception(f"Failed to retrieve GeoJSON: {str(e)}")
    
    def get_history(self, session_id: str) -> Dict[str, Any]:
        """
        Get session history from S3.
        
        Args:
            session_id: Unique session identifier
            
        Returns:
            Chat history dictionary
        """
        try:
            key = self._get_session_key(session_id, SESSION_HISTORY_FILE)
            
            logger.info(f"Retrieving session history from S3: {key}")
            
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=key
            )
            
            body = response['Body'].read().decode('utf-8')
            history = json.loads(body)
            
            message_count = len(history.get('messages', []))
            logger.info(f"✅ Retrieved {message_count} messages from S3")
            return history
            
        except ClientError as e:
            # If file doesn't exist, return empty history
            if e.response['Error']['Code'] == 'NoSuchKey':
                logger.info("No existing history found, returning empty history")
                return {'messages': []}
            raise
            
        except Exception as e:
            logger.error(f"Error retrieving session history from S3: {str(e)}", exc_info=True)
            raise Exception(f"Failed to retrieve session history: {str(e)}")
    
    def get_signed_url(
        self, 
        session_id: str, 
        filename: str, 
        expires_in: int = 900
    ) -> str:
        """
        Generate a signed URL for accessing a file.
        
        Args:
            session_id: Unique session identifier
            filename: Name of the file
            expires_in: URL expiration time in seconds (default: 900 = 15 minutes)
            
        Returns:
            Signed URL string
        """
        try:
            key = self._get_session_key(session_id, filename)
            
            logger.info(f"Generating signed URL for: {key}")
            logger.info(f"Expiration: {expires_in} seconds")
            
            signed_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': key
                },
                ExpiresIn=expires_in
            )
            
            logger.info("✅ Signed URL generated successfully")
            return signed_url
            
        except Exception as e:
            logger.error(f"Error generating signed URL: {str(e)}", exc_info=True)
            raise Exception(f"Failed to generate signed URL: {str(e)}")
    
    def reset_session(self, session_id: str, keep_all_files: bool = True) -> None:
        """
        Reset session by deleting filtered files.
        
        Args:
            session_id: Unique session identifier
            keep_all_files: If True, keep all_well_* files; if False, delete everything
        """
        try:
            logger.info(f"Resetting session: {session_id}")
            logger.info(f"Keep all_well_* files: {keep_all_files}")
            
            # List all files in the session
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"{session_id}/"
            )
            
            files = response.get('Contents', [])
            logger.info(f"Found {len(files)} files in session")
            
            # Determine which files to delete
            files_to_delete = []
            for file in files:
                key = file.get('Key', '')
                filename = key.split('/')[-1] if '/' in key else key
                
                if keep_all_files:
                    # Delete filtered files and history, keep all_well_* files
                    is_filtered_file = (
                        filename.startswith(FILTERED_METADATA_PREFIX) or 
                        filename.startswith(FILTERED_GEOJSON_PREFIX)
                    )
                    is_history_file = filename == SESSION_HISTORY_FILE
                    
                    if is_filtered_file or is_history_file:
                        files_to_delete.append(key)
                else:
                    # Delete everything
                    files_to_delete.append(key)
            
            logger.info(f"Deleting {len(files_to_delete)} files")
            
            # Delete files
            for key in files_to_delete:
                logger.info(f"Deleting: {key}")
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=key
                )
            
            # If keeping all files, clear the history file instead of deleting it
            if keep_all_files:
                logger.info("Clearing session history")
                self.store_history(session_id, {'messages': []})
            
            logger.info("✅ Session reset complete")
            
        except Exception as e:
            logger.error(f"Error resetting session: {str(e)}", exc_info=True)
            raise Exception(f"Failed to reset session: {str(e)}")
