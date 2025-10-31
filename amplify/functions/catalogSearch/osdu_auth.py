"""
OSDU Authentication Module
Handles authentication with OSDU platform using AWS Cognito.
"""

import os
import hmac
import hashlib
import base64
import boto3
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class OSDUAuthenticator:
    """Handles OSDU authentication via AWS Cognito."""
    
    def __init__(self):
        """Initialize authenticator with environment variables."""
        self.username = os.environ.get('EDI_USERNAME', 'edi-user')
        self.password = os.environ.get('EDI_PASSWORD')
        self.client_id = os.environ.get('EDI_CLIENT_ID')
        self.client_secret = os.environ.get('EDI_CLIENT_SECRET')
        self.partition = os.environ.get('OSDU_PARTITION_ID', 'osdu')
        self.region = os.environ.get('COGNITO_REGION', os.environ.get('AWS_REGION', 'us-east-1'))
        
        # Initialize Cognito client
        self.cognito = boto3.client('cognito-idp', region_name=self.region)
        
        # Cache for access token
        self._cached_token = None
        self._cached_headers = None
    
    def _compute_secret_hash(self) -> str:
        """Compute the SECRET_HASH for Cognito authentication."""
        message = self.username + self.client_id
        dig = hmac.new(
            self.client_secret.encode('UTF-8'),
            msg=message.encode('UTF-8'),
            digestmod=hashlib.sha256
        ).digest()
        return base64.b64encode(dig).decode()
    
    def authenticate(self) -> Optional[Dict[str, str]]:
        """
        Authenticate with OSDU platform via Cognito.
        
        Returns:
            Dict with headers including Authorization token, or None if auth fails
        """
        # Return cached headers if available
        if self._cached_headers:
            logger.info("Using cached OSDU authentication")
            return self._cached_headers
        
        try:
            logger.info(f"Authenticating with OSDU as user: {self.username}")
            
            # Compute secret hash
            secret_hash = self._compute_secret_hash()
            
            # Authenticate with Cognito
            auth_response = self.cognito.initiate_auth(
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters={
                    'USERNAME': self.username,
                    'PASSWORD': self.password,
                    'SECRET_HASH': secret_hash
                },
                ClientId=self.client_id
            )
            
            # Extract access token
            access_token = auth_response['AuthenticationResult']['AccessToken']
            self._cached_token = access_token
            
            # Build headers
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
                'data-partition-id': self.partition
            }
            
            self._cached_headers = headers
            logger.info("OSDU authentication successful")
            
            return headers
            
        except Exception as e:
            logger.error(f"OSDU authentication failed: {str(e)}")
            return None
    
    def get_headers(self) -> Optional[Dict[str, str]]:
        """
        Get authentication headers for OSDU API calls.
        
        Returns:
            Dict with headers including Authorization token, or None if auth fails
        """
        return self.authenticate()
    
    def clear_cache(self):
        """Clear cached authentication token."""
        self._cached_token = None
        self._cached_headers = None
        logger.info("Cleared OSDU authentication cache")


# Global authenticator instance
_authenticator = None

def get_osdu_headers() -> Optional[Dict[str, str]]:
    """
    Get OSDU authentication headers.
    
    Returns:
        Dict with headers including Authorization token, or None if auth fails
    """
    global _authenticator
    
    if _authenticator is None:
        _authenticator = OSDUAuthenticator()
    
    return _authenticator.get_headers()
