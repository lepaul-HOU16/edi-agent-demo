"""
Command Router
Detects and routes hardcoded commands (/getdata, /reset).
"""

import logging
import os
import re
from typing import Optional, Dict, Any
from osdu_client import OSDUClient
from osdu_data_transformer import OSDUDataTransformer
from s3_session_manager import S3SessionManager

logger = logging.getLogger()


class CommandRouter:
    """
    CommandRouter - Detect and route hardcoded commands
    
    Responsibilities:
    - Parse user input for commands (/getdata, /reset)
    - Determine command type
    - Validate command syntax
    
    Supported Commands:
    - /getdata: Fetch all OSDU well metadata and generate files
    - /reset: Clear filtered data and session history
    """
    
    # Valid command patterns
    VALID_COMMANDS = {
        'getdata': r'^/getdata\s*$',
        'reset': r'^/reset\s*$'
    }
    
    def __init__(self, s3_bucket_name: Optional[str] = None):
        """
        Initialize CommandRouter with compiled regex patterns.
        
        Args:
            s3_bucket_name: S3 bucket name for session storage
        """
        self.command_patterns = {
            cmd: re.compile(pattern, re.IGNORECASE)
            for cmd, pattern in self.VALID_COMMANDS.items()
        }
        self.s3_bucket_name = s3_bucket_name
    
    def is_command(self, prompt: str) -> bool:
        """
        Check if the prompt is a hardcoded command.
        
        Args:
            prompt: User input string
            
        Returns:
            True if prompt is a command, False otherwise
            
        Examples:
            >>> router = CommandRouter()
            >>> router.is_command('/getdata')
            True
            >>> router.is_command('/reset')
            True
            >>> router.is_command('show wells')
            False
            >>> router.is_command('/getdata extra text')
            False
        """
        if not prompt:
            return False
        
        # Normalize whitespace
        normalized_prompt = ' '.join(prompt.strip().split())
        
        # Check if matches any valid command pattern
        for pattern in self.command_patterns.values():
            if pattern.match(normalized_prompt):
                return True
        
        return False
    
    def get_command_type(self, prompt: str) -> Optional[str]:
        """
        Get the type of command.
        
        Args:
            prompt: User input string
            
        Returns:
            Command type ('getdata', 'reset') or None if not a valid command
            
        Examples:
            >>> router = CommandRouter()
            >>> router.get_command_type('/getdata')
            'getdata'
            >>> router.get_command_type('/reset')
            'reset'
            >>> router.get_command_type('show wells')
            None
        """
        if not prompt:
            return None
        
        # Normalize whitespace
        normalized_prompt = ' '.join(prompt.strip().split())
        
        # Check each command pattern
        for cmd_type, pattern in self.command_patterns.items():
            if pattern.match(normalized_prompt):
                return cmd_type
        
        return None
    
    def validate_command(self, prompt: str) -> Dict[str, Any]:
        """
        Validate command syntax and return validation result.
        
        Args:
            prompt: User input string
            
        Returns:
            Dictionary with validation result:
            {
                'valid': bool,
                'command_type': str or None,
                'error': str or None
            }
            
        Examples:
            >>> router = CommandRouter()
            >>> router.validate_command('/getdata')
            {'valid': True, 'command_type': 'getdata', 'error': None}
            >>> router.validate_command('/getdata extra')
            {'valid': False, 'command_type': None, 'error': 'Invalid command syntax...'}
        """
        if not prompt:
            return {
                'valid': False,
                'command_type': None,
                'error': 'Empty prompt provided'
            }
        
        # Normalize whitespace
        normalized_prompt = ' '.join(prompt.strip().split())
        
        # Check if it looks like a command (starts with /)
        if normalized_prompt.startswith('/'):
            # Extract command name
            command_name = normalized_prompt.split()[0].lower()
            
            # Check if it's a valid command
            command_type = self.get_command_type(normalized_prompt)
            
            if command_type:
                return {
                    'valid': True,
                    'command_type': command_type,
                    'error': None
                }
            else:
                # It looks like a command but isn't valid
                if command_name in ['/getdata', '/reset']:
                    return {
                        'valid': False,
                        'command_type': None,
                        'error': f'Invalid command syntax. Commands should not have additional text. Use "{command_name}" only.'
                    }
                else:
                    return {
                        'valid': False,
                        'command_type': None,
                        'error': f'Unknown command: {command_name}. Valid commands are: /getdata, /reset'
                    }
        
        # Not a command at all
        return {
            'valid': False,
            'command_type': None,
            'error': None  # No error, just not a command
        }
    
    def execute_command(
        self,
        command_type: str,
        session_id: str,
        osdu_config: Dict[str, str],
        auth_token: str
    ) -> Dict[str, Any]:
        """
        Execute a hardcoded command.
        
        Args:
            command_type: Type of command ('getdata' or 'reset')
            session_id: Unique session identifier
            osdu_config: OSDU instance configuration with 'url' and 'dataPartitionId'
            auth_token: OSDU authentication token
            
        Returns:
            Command result dictionary:
            {
                'success': bool,
                'message': str,
                'files': {
                    'metadata': str (S3 signed URL),
                    'geojson': str (S3 signed URL)
                },
                'stats': {
                    'wellCount': int,
                    'wellboreCount': int,
                    'welllogCount': int
                }
            }
        """
        logger.info(f"Executing command: {command_type} for session: {session_id}")
        
        try:
            if command_type == 'getdata':
                return self._execute_getdata(session_id, osdu_config, auth_token)
            elif command_type == 'reset':
                return self._execute_reset(session_id)
            else:
                return {
                    'success': False,
                    'message': f'Unknown command type: {command_type}',
                    'error': f'Command type "{command_type}" is not supported'
                }
        except Exception as e:
            logger.error(f"Error executing command {command_type}: {str(e)}", exc_info=True)
            return {
                'success': False,
                'message': f'Command execution failed: {str(e)}',
                'error': str(e)
            }
    
    def _execute_getdata(
        self,
        session_id: str
    ) -> Dict[str, Any]:
        """
        Execute /getdata command.
        
        Fetches all wells, wellbores, and welllogs from OSDU API,
        links them in hierarchical structure, transforms to WellMetadata format,
        generates all_well_metadata.json and all_well_geojson.json,
        stores in S3, and returns signed URLs with statistics.
        
        Args:
            session_id: Unique session identifier
            
        Note:
            OSDU configuration comes from environment variables:
            - OSDU_BASE_URL
            - OSDU_PARTITION_ID
            - OSDU_CLIENT_ID, OSDU_CLIENT_SECRET, etc.
            
        Returns:
            Command result with files and statistics
        """
        logger.info(f"Executing /getdata command for session: {session_id}")
        
        # Validate S3 bucket configuration
        if not self.s3_bucket_name:
            raise Exception("S3 bucket name not configured")
        
        # Initialize components
        # OSDU configuration from environment variables
        osdu_base_url = os.environ.get('OSDU_BASE_URL', 'https://community.opensubsurface.org')
        osdu_partition_id = os.environ.get('OSDU_PARTITION_ID', 'opendes')
        
        osdu_client = OSDUClient(
            base_url=osdu_base_url,
            partition_id=osdu_partition_id
        )
        
        transformer = OSDUDataTransformer()
        s3_manager = S3SessionManager(self.s3_bucket_name)
        
        # Step 1: Fetch all wells from OSDU
        logger.info("Step 1: Fetching all wells from OSDU API")
        osdu_wells = osdu_client.fetch_all_wells()
        logger.info(f"Fetched {len(osdu_wells)} wells from OSDU")
        
        if not osdu_wells:
            logger.warning("No wells returned from OSDU API")
            return {
                'success': True,
                'message': 'No wells found in OSDU instance',
                'stats': {
                    'wellCount': 0,
                    'wellboreCount': 0,
                    'welllogCount': 0
                }
            }
        
        # Step 2: Fetch all wellbores from OSDU
        logger.info("Step 2: Fetching all wellbores from OSDU API")
        osdu_wellbores = osdu_client.fetch_all_wellbores()
        logger.info(f"Fetched {len(osdu_wellbores)} wellbores from OSDU")
        
        # Step 3: Fetch all welllogs from OSDU
        logger.info("Step 3: Fetching all welllogs from OSDU API")
        osdu_welllogs = osdu_client.fetch_all_welllogs()
        logger.info(f"Fetched {len(osdu_welllogs)} welllogs from OSDU")
        
        # Step 4: Transform OSDU responses to metadata format
        logger.info("Step 4: Transforming OSDU data to metadata format")
        wells_metadata = transformer.transform_well_data(osdu_wells)
        logger.info(f"Transformed {len(wells_metadata)} wells")
        
        wellbores_metadata = [transformer._parse_osdu_wellbore(wb) for wb in osdu_wellbores]
        wellbores_metadata = [wb for wb in wellbores_metadata if wb is not None]
        logger.info(f"Transformed {len(wellbores_metadata)} wellbores")
        
        welllogs_metadata = [transformer._parse_osdu_welllog(wl) for wl in osdu_welllogs]
        welllogs_metadata = [wl for wl in welllogs_metadata if wl is not None]
        logger.info(f"Transformed {len(welllogs_metadata)} welllogs")
        
        # Step 5: Link welllogs to wellbores, then wellbores to wells
        logger.info("Step 5: Linking data hierarchy (welllogs → wellbores → wells)")
        
        # Link welllogs to wellbores using WellboreID
        wellbores_with_logs = transformer.link_welllogs_to_wellbores(wellbores_metadata, welllogs_metadata)
        
        # Link wellbores to wells using WellID
        wells_complete = transformer.link_wellbores_to_wells(wells_metadata, wellbores_with_logs)
        
        logger.info(f"✅ Linking complete: {len(wells_complete)} wells with complete hierarchy")
        
        # Step 6: Calculate statistics
        logger.info("Step 6: Calculating statistics")
        wellbore_count = sum(len(well.get('wellbores', [])) for well in wells_complete)
        welllog_count = sum(
            len(wellbore.get('welllogs', []))
            for well in wells_complete
            for wellbore in well.get('wellbores', [])
        )
        
        stats = {
            'wellCount': len(wells_complete),
            'wellboreCount': wellbore_count,
            'welllogCount': welllog_count
        }
        
        logger.info(f"Statistics: {stats}")
        
        # Step 7: Build hierarchical structure matching example format
        logger.info("Step 7: Building hierarchical structure")
        hierarchical_wells = transformer.build_hierarchy(wells_complete)
        logger.info(f"Built hierarchical structure for {len(hierarchical_wells)} wells")
        
        # Step 8: Generate GeoJSON
        logger.info("Step 8: Generating GeoJSON")
        geojson = transformer.to_geojson(wells_complete)
        logger.info(f"Generated GeoJSON with {len(geojson.get('features', []))} features")
        
        # Step 9: Store metadata in S3 (using hierarchical format)
        logger.info("Step 9: Storing all_well_metadata.json in S3")
        metadata_key = s3_manager.store_metadata(session_id, hierarchical_wells)
        logger.info(f"Stored metadata: {metadata_key}")
        
        # Step 10: Store GeoJSON in S3
        logger.info("Step 10: Storing all_well_geojson.json in S3")
        geojson_key = s3_manager.store_geojson(session_id, geojson)
        logger.info(f"Stored GeoJSON: {geojson_key}")
        
        # Step 11: Generate signed URLs
        logger.info("Step 11: Generating S3 signed URLs")
        metadata_url = s3_manager.get_signed_url(session_id, 'all_well_metadata.json')
        geojson_url = s3_manager.get_signed_url(session_id, 'all_well_geojson.json')
        
        logger.info("✅ /getdata command completed successfully")
        
        # Return result
        return {
            'success': True,
            'message': f'Successfully loaded {stats["wellCount"]} wells from OSDU',
            'files': {
                'metadata': metadata_url,
                'geojson': geojson_url
            },
            'stats': stats
        }
    
    def _execute_reset(self, session_id: str) -> Dict[str, Any]:
        """
        Execute /reset command.
        
        Deletes ALL files (including all_well_* and filtered files),
        and clears session history.
        
        Args:
            session_id: Unique session identifier
            
        Returns:
            Command result with success confirmation
        """
        logger.info(f"Executing /reset command for session: {session_id}")
        
        # Validate S3 bucket configuration
        if not self.s3_bucket_name:
            raise Exception("S3 bucket name not configured")
        
        # Initialize S3 manager
        s3_manager = S3SessionManager(self.s3_bucket_name)
        
        # Reset session (delete ALL files including all_well_*)
        logger.info("Resetting session - deleting ALL files and clearing history")
        s3_manager.reset_session(session_id, keep_all_files=False)
        
        logger.info("✅ /reset command completed successfully")
        
        return {
            'success': True,
            'message': 'Session reset successfully. All data and history cleared.'
        }
