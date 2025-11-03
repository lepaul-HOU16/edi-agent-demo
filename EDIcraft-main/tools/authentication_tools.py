#!/usr/bin/env python3
"""
Authentication tools for EDIcraft Agent.

This module provides a unified authentication system through the AuthenticationManager class.
Internal authentication backends (_EDIAuthenticator, _ManualAuthenticator) are implementation
details and should not be used directly.

Public API:
- AuthenticationManager: Central authentication management

Usage:
    auth_manager = AuthenticationManager(config)
    access_token, base_url, partition_id = auth_manager.setup_authentication()
"""

import base64
import hashlib
import hmac
import boto3
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from osdu_client.auth import AuthBackendInterface
from config import EDIcraftConfig


class _BaseAuthBackend(ABC):
    """Internal base authentication backend interface."""
    
    @abstractmethod
    def get_access_token(self) -> Optional[str]:
        """Get current access token."""
        pass
    
    @abstractmethod
    def is_authenticated(self) -> bool:
        """Check if authentication is valid."""
        pass
    
    @abstractmethod
    def get_auth_info(self) -> Dict[str, Any]:
        """Get authentication information for debugging."""
        pass


class _OSDUAuthBackend(AuthBackendInterface):
    """Internal OSDU authentication backend for API clients."""
    
    def __init__(self, access_token: str, base_url: str, partition_id: str):
        self._access_token = access_token
        self._base_url = base_url
        self._partition_id = partition_id

    @property
    def authorization_header(self) -> dict:
        return {"Authorization": f"Bearer {self._access_token}"}

    @property
    def default_data_partition_id(self) -> str:
        return self._partition_id

    @property
    def base_url(self) -> str:
        return self._base_url

    def get_sd_connection_params(self, log_level: int = None) -> dict:
        return {}


class _EDIAuthenticator(_BaseAuthBackend):
    """Internal EDI (managed OSDU service) authentication handler."""
    
    def __init__(self, config: EDIcraftConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Extract EDI configuration
        edi_config = config.get_edi_config()
        self.username = edi_config["username"]
        self.password = edi_config["password"]
        self.client_id = edi_config["client_id"]
        self.client_secret = edi_config["client_secret"]
        self.partition = edi_config["partition"]
        self.platform_url = edi_config["platform_url"]
        self.aws_region = edi_config["aws_region"]
        
        self.cognito = boto3.client('cognito-idp', region_name=self.aws_region)
        self._access_token = None
    
    def get_access_token(self) -> Optional[str]:
        """Get access token from EDI using AWS Cognito authentication"""
        try:
            # Compute secret hash
            message = self.username + self.client_id
            dig = hmac.new(
                self.client_secret.encode('UTF-8'), 
                msg=message.encode('UTF-8'), 
                digestmod=hashlib.sha256
            ).digest()
            secret_hash = base64.b64encode(dig).decode()

            # Authenticate with Cognito
            auth_response = self.cognito.initiate_auth(
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={
                    "USERNAME": self.username, 
                    "PASSWORD": self.password, 
                    "SECRET_HASH": secret_hash
                },
                ClientId=self.client_id,
            )
            
            self._access_token = auth_response["AuthenticationResult"]["AccessToken"]
            self.logger.info("EDI authentication successful")
            return self._access_token
            
        except Exception as e:
            self.logger.error(f"EDI Authentication error: {e}")
            return None
    
    def is_authenticated(self) -> bool:
        """Check if authentication is valid."""
        return self._access_token is not None
    
    def get_auth_info(self) -> Dict[str, Any]:
        """Get authentication information for debugging."""
        # Mask the token for security
        masked_token = None
        if self._access_token:
            if len(self._access_token) > 20:
                masked_token = f"{self._access_token[:10]}...{self._access_token[-10:]}"
            else:
                masked_token = f"{self._access_token[:5]}..."
        
        return {
            "auth_type": "edi",
            "platform_url": self.platform_url,
            "partition": self.partition,
            "username": self.username,
            "access_token": masked_token,
            "token_length": len(self._access_token) if self._access_token else 0,
            "is_authenticated": self.is_authenticated()
        }


class _ManualAuthenticator(_BaseAuthBackend):
    """Internal manual OSDU authentication handler for direct token usage."""
    
    def __init__(self, config: EDIcraftConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Extract OSDU configuration
        osdu_config = config.get_osdu_config()
        self.access_token = osdu_config["access_token"]
        self.base_url = osdu_config["base_url"]
        self.partition_id = osdu_config["partition_id"]
    
    def get_access_token(self) -> Optional[str]:
        """Get the manually configured access token."""
        return self.access_token
    
    def is_authenticated(self) -> bool:
        """Check if authentication is valid."""
        return bool(self.access_token and self.base_url)
    
    def get_auth_info(self) -> Dict[str, Any]:
        """Get authentication information for debugging."""
        # Mask the token for security
        masked_token = None
        if self.access_token:
            if len(self.access_token) > 20:
                masked_token = f"{self.access_token[:10]}...{self.access_token[-10:]}"
            else:
                masked_token = f"{self.access_token[:5]}..."
        
        return {
            "auth_type": "manual",
            "base_url": self.base_url,
            "partition_id": self.partition_id,
            "access_token": masked_token,
            "token_length": len(self.access_token) if self.access_token else 0,
            "is_authenticated": self.is_authenticated()
        }


class AuthenticationManager:
    """Central authentication manager that handles different auth backends."""
    
    def __init__(self, config: EDIcraftConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.authenticator = None
        self.auth_backend = None
        
    def setup_authentication(self) -> tuple[Optional[str], Optional[str], Optional[str]]:
        """Setup authentication and return access token, base URL, and partition ID.
        
        Returns:
            Tuple of (access_token, base_url, partition_id)
        """
        access_token = None
        base_url = None
        partition_id = None
        
        if self.config.has_edi_auth():
            self.logger.info("Setting up EDI authentication...")
            self.authenticator = _EDIAuthenticator(self.config)
            access_token = self.authenticator.get_access_token()
            edi_config = self.config.get_edi_config()
            base_url = edi_config["platform_url"]
            partition_id = edi_config["partition"]
            
        elif self.config.has_manual_auth():
            self.logger.info("Setting up manual authentication...")
            self.authenticator = _ManualAuthenticator(self.config)
            access_token = self.authenticator.get_access_token()
            osdu_config = self.config.get_osdu_config()
            base_url = osdu_config["base_url"]
            partition_id = osdu_config["partition_id"]
        
        # Create OSDU auth backend if we have valid credentials
        if access_token and base_url and partition_id:
            self.auth_backend = _OSDUAuthBackend(
                access_token=access_token,
                base_url=base_url,
                partition_id=partition_id
            )
            self.logger.info(f"Authentication setup successful: {self.config.get_auth_type()}")
        else:
            self.logger.error("Authentication setup failed")
        
        return access_token, base_url, partition_id
    
    def get_auth_info(self) -> Dict[str, Any]:
        """Get current authentication information."""
        if self.authenticator:
            return self.authenticator.get_auth_info()
        else:
            return {
                "auth_type": "none",
                "is_authenticated": False,
                "message": "No authentication configured"
            }
    
    def is_authenticated(self) -> bool:
        """Check if authentication is valid."""
        if self.authenticator:
            return self.authenticator.is_authenticated()
        return False
    
    def refresh_token(self) -> bool:
        """Refresh authentication token if supported."""
        if isinstance(self.authenticator, _EDIAuthenticator):
            # For EDI auth, get a new token
            new_token = self.authenticator.get_access_token()
            if new_token:
                # Update the auth backend with new token
                if self.auth_backend:
                    self.auth_backend._access_token = new_token
                return True
        
        # Manual auth doesn't support refresh
        return False


# Main exports - focused on AuthenticationManager
__all__ = [
    'AuthenticationManager'
]