#!/usr/bin/env python3
"""
Enhanced RCON Executor for EDIcraft Agent.
Provides reliable RCON command execution with timeouts, retries, and verification.
"""

import time
import re
import logging
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from rcon.source import Client


@dataclass
class RCONResult:
    """Result of RCON command execution."""
    success: bool
    command: str
    response: str
    blocks_affected: int = 0
    execution_time: float = 0.0
    retries: int = 0
    error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging."""
        return {
            'success': self.success,
            'command': self.command,
            'response': self.response[:100] if self.response else '',  # Truncate long responses
            'blocks_affected': self.blocks_affected,
            'execution_time': self.execution_time,
            'retries': self.retries,
            'error': self.error
        }


class RCONExecutor:
    """Enhanced RCON command executor with reliability features."""
    
    def __init__(
        self, 
        host: str, 
        port: int, 
        password: str,
        timeout: int = 10,
        max_retries: int = 3,
        chunk_size: int = 32
    ):
        """Initialize executor with connection parameters.
        
        Args:
            host: Minecraft server host
            port: RCON port
            password: RCON password
            timeout: Command timeout in seconds (default: 10)
            max_retries: Maximum retry attempts (default: 3)
            chunk_size: Maximum chunk size for batching (default: 32)
        """
        self.host = host
        self.port = port
        self.password = password
        self.timeout = timeout
        self.max_retries = max_retries
        self.chunk_size = chunk_size
        self.logger = logging.getLogger(__name__)
        
        # Cache for gamerule queries (60 second TTL)
        self._gamerule_cache: Dict[str, tuple[str, float]] = {}
        self._cache_ttl = 60.0
        
        # Performance tracking for dynamic batch size tuning
        self._performance_history: List[Dict[str, Any]] = []
        self._max_history_size = 20
        self._adaptive_chunk_size = chunk_size
    
    def _execute_with_timeout(self, command: str) -> str:
        """Execute command with timeout.
        
        Args:
            command: Minecraft command to execute
            
        Returns:
            Command response
            
        Raises:
            TimeoutError: If command times out
            Exception: If command fails
        """
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(self._execute_raw, command)
            try:
                return future.result(timeout=self.timeout)
            except FutureTimeoutError:
                raise TimeoutError(f"Command timed out after {self.timeout} seconds")
    
    def _execute_raw(self, command: str) -> str:
        """Execute raw RCON command.
        
        Args:
            command: Minecraft command to execute
            
        Returns:
            Command response
        """
        with Client(self.host, self.port, passwd=self.password) as client:
            return client.run(command)
    
    def execute_command(
        self, 
        command: str, 
        verify: bool = True,
        operation: str = "command"
    ) -> RCONResult:
        """Execute single command with timeout and retry.
        
        Args:
            command: Minecraft command to execute
            verify: Whether to verify command result
            operation: Type of operation for error messages (e.g., "clear", "fill", "gamerule")
            
        Returns:
            RCONResult with success status, response, and metadata
        """
        start_time = time.time()
        last_error = None
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                # Execute with timeout
                response = self._execute_with_timeout(command)
                
                # Verify success if requested
                if verify and not self._is_success_response(response):
                    if attempt < self.max_retries - 1:
                        # Retry with exponential backoff
                        delay = 2 ** attempt  # 1s, 2s, 4s
                        self.logger.warning(
                            f"Command verification failed (attempt {attempt + 1}/{self.max_retries}), "
                            f"retrying in {delay}s: {command}"
                        )
                        time.sleep(delay)
                        continue
                    else:
                        # Final attempt failed - generate detailed error message
                        error_msg = self.handle_command_error(command, response)
                        return RCONResult(
                            success=False,
                            command=command,
                            response=response,
                            execution_time=time.time() - start_time,
                            retries=attempt,
                            error=error_msg
                        )
                
                # Success!
                blocks_affected = self._parse_fill_response(response)
                
                return RCONResult(
                    success=True,
                    command=command,
                    response=response,
                    blocks_affected=blocks_affected,
                    execution_time=time.time() - start_time,
                    retries=attempt
                )
                
            except TimeoutError as e:
                last_error = str(e)
                last_exception = e
                if attempt < self.max_retries - 1:
                    delay = 2 ** attempt
                    self.logger.warning(
                        f"Command timed out (attempt {attempt + 1}/{self.max_retries}), "
                        f"retrying in {delay}s: {command}"
                    )
                    time.sleep(delay)
                else:
                    # Generate detailed timeout error message
                    error_msg = self.handle_timeout_error(command, operation)
                    return RCONResult(
                        success=False,
                        command=command,
                        response="",
                        execution_time=time.time() - start_time,
                        retries=attempt,
                        error=error_msg
                    )
                    
            except Exception as e:
                last_error = str(e)
                last_exception = e
                if attempt < self.max_retries - 1:
                    delay = 2 ** attempt
                    self.logger.warning(
                        f"Command failed (attempt {attempt + 1}/{self.max_retries}), "
                        f"retrying in {delay}s: {command}. Error: {str(e)}"
                    )
                    time.sleep(delay)
                else:
                    # Generate detailed error message based on exception type
                    error_msg = self.categorize_and_handle_error(e, command, operation)
                    return RCONResult(
                        success=False,
                        command=command,
                        response="",
                        execution_time=time.time() - start_time,
                        retries=attempt,
                        error=error_msg
                    )
        
        # Should never reach here, but just in case
        if last_exception:
            error_msg = self.categorize_and_handle_error(last_exception, command, operation)
        else:
            error_msg = "Unknown error occurred"
            
        return RCONResult(
            success=False,
            command=command,
            response="",
            execution_time=time.time() - start_time,
            retries=self.max_retries,
            error=error_msg
        )
    
    def execute_batch(
        self, 
        commands: List[str], 
        parallel: bool = False
    ) -> List[RCONResult]:
        """Execute multiple commands with optional parallelization.
        
        Args:
            commands: List of Minecraft commands
            parallel: Whether to execute in parallel
            
        Returns:
            List of RCONResult objects
        """
        if parallel:
            # Execute commands in parallel (limit concurrency to avoid overwhelming server)
            max_workers = min(4, len(commands))
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = [executor.submit(self.execute_command, cmd) for cmd in commands]
                return [future.result() for future in futures]
        else:
            # Execute commands sequentially
            return [self.execute_command(cmd) for cmd in commands]
    
    def execute_fill(
        self,
        x1: int, y1: int, z1: int,
        x2: int, y2: int, z2: int,
        block: str,
        replace: Optional[str] = None,
        smart_fill: bool = False
    ) -> RCONResult:
        """Execute fill command with automatic batching and smart optimization.
        
        Automatically splits large fills into chunks to prevent server overload.
        Optionally uses smart fill to skip layers with no air blocks.
        
        Args:
            x1, y1, z1: Start coordinates
            x2, y2, z2: End coordinates
            block: Block type to fill
            replace: Optional block type to replace
            smart_fill: If True, skip layers with no air blocks (terrain optimization)
            
        Returns:
            RCONResult with total blocks filled
        """
        start_time = time.time()
        
        # Calculate dimensions
        dx = abs(x2 - x1) + 1
        dy = abs(y2 - y1) + 1
        dz = abs(z2 - z1) + 1
        total_blocks = dx * dy * dz
        
        # Use adaptive chunk size for better performance
        effective_chunk_size = self._adaptive_chunk_size
        
        # Check if batching is needed
        max_blocks_per_command = effective_chunk_size ** 3
        
        if total_blocks <= max_blocks_per_command:
            # Small enough to execute in one command
            replace_clause = f" replace {replace}" if replace else ""
            command = f"fill {x1} {y1} {z1} {x2} {y2} {z2} {block}{replace_clause}"
            return self.execute_command(command, operation="fill")
        
        # Need to batch - split into chunks
        self.logger.info(
            f"Batching fill operation: {total_blocks} blocks into chunks of {max_blocks_per_command}"
        )
        
        chunks = self._batch_fill_command(x1, y1, z1, x2, y2, z2, block, replace)
        
        # Apply smart fill optimization if enabled
        if smart_fill and replace == 'air':
            self.logger.info("Smart fill enabled: checking for air blocks before filling")
            chunks = self._optimize_chunks_for_terrain(chunks)
            self.logger.info(f"Smart fill reduced chunks from {len(chunks)} to {len(chunks)} (skipped empty layers)")
        
        # Determine if parallel execution is beneficial
        use_parallel = len(chunks) > 4 and self._should_use_parallel_execution()
        
        if use_parallel:
            self.logger.info(f"Using parallel execution for {len(chunks)} chunks")
            return self._execute_chunks_parallel(chunks, start_time)
        else:
            self.logger.info(f"Using sequential execution for {len(chunks)} chunks")
            return self._execute_chunks_sequential(chunks, start_time)
    
    def _should_use_parallel_execution(self) -> bool:
        """Determine if parallel execution should be used based on server performance.
        
        Returns:
            True if parallel execution is recommended
        """
        # Check if we have recent performance metrics
        # For now, always allow parallel for large operations
        # In future, could track server TPS and adjust dynamically
        return True
    
    def _execute_chunks_sequential(
        self,
        chunks: List[Dict[str, Any]],
        start_time: float
    ) -> RCONResult:
        """Execute chunks sequentially.
        
        Args:
            chunks: List of chunk dictionaries with commands
            start_time: Operation start time
            
        Returns:
            Combined RCONResult
        """
        total_blocks_affected = 0
        total_execution_time = 0.0
        total_retries = 0
        errors = []
        
        for i, chunk in enumerate(chunks):
            result = self.execute_command(chunk['command'], operation="fill")
            
            if result.success:
                total_blocks_affected += result.blocks_affected
                total_execution_time += result.execution_time
                total_retries += result.retries
                self.logger.debug(
                    f"Chunk {i+1}/{len(chunks)} completed: {result.blocks_affected} blocks in {result.execution_time:.2f}s"
                )
            else:
                errors.append(f"Chunk {i+1} failed: {result.error}")
                self.logger.error(f"Chunk {i+1}/{len(chunks)} failed: {result.error}")
        
        # Return combined result
        total_time = time.time() - start_time
        
        # Track performance for adaptive optimization
        self._track_performance(
            operation="fill_sequential",
            blocks=total_blocks_affected,
            execution_time=total_time,
            success=len(errors) == 0
        )
        
        if errors:
            return RCONResult(
                success=False,
                command=f"fill (batched, {len(chunks)} chunks)",
                response=f"Completed {len(chunks) - len(errors)}/{len(chunks)} chunks",
                blocks_affected=total_blocks_affected,
                execution_time=total_time,
                retries=total_retries,
                error="; ".join(errors)
            )
        else:
            return RCONResult(
                success=True,
                command=f"fill (batched, {len(chunks)} chunks)",
                response=f"Successfully filled {total_blocks_affected} blocks in {len(chunks)} chunks",
                blocks_affected=total_blocks_affected,
                execution_time=total_time,
                retries=total_retries
            )
    
    def _execute_chunks_parallel(
        self,
        chunks: List[Dict[str, Any]],
        start_time: float
    ) -> RCONResult:
        """Execute chunks in parallel using ThreadPoolExecutor.
        
        Args:
            chunks: List of chunk dictionaries with commands
            start_time: Operation start time
            
        Returns:
            Combined RCONResult
        """
        total_blocks_affected = 0
        total_execution_time = 0.0
        total_retries = 0
        errors = []
        
        # Limit concurrency to avoid overwhelming server
        max_workers = min(4, len(chunks))
        
        self.logger.info(f"Executing {len(chunks)} chunks with {max_workers} parallel workers")
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all chunk commands
            futures = []
            for i, chunk in enumerate(chunks):
                future = executor.submit(self.execute_command, chunk['command'], True, "fill")
                futures.append((i, future))
            
            # Collect results
            for i, future in futures:
                try:
                    result = future.result()
                    
                    if result.success:
                        total_blocks_affected += result.blocks_affected
                        total_execution_time += result.execution_time
                        total_retries += result.retries
                        self.logger.debug(
                            f"Chunk {i+1}/{len(chunks)} completed: {result.blocks_affected} blocks in {result.execution_time:.2f}s"
                        )
                    else:
                        errors.append(f"Chunk {i+1} failed: {result.error}")
                        self.logger.error(f"Chunk {i+1}/{len(chunks)} failed: {result.error}")
                        
                except Exception as e:
                    errors.append(f"Chunk {i+1} exception: {str(e)}")
                    self.logger.error(f"Chunk {i+1}/{len(chunks)} exception: {str(e)}")
        
        # Return combined result
        total_time = time.time() - start_time
        
        # Track performance for adaptive optimization
        self._track_performance(
            operation="fill_parallel",
            blocks=total_blocks_affected,
            execution_time=total_time,
            success=len(errors) == 0
        )
        
        if errors:
            return RCONResult(
                success=False,
                command=f"fill (parallel, {len(chunks)} chunks, {max_workers} workers)",
                response=f"Completed {len(chunks) - len(errors)}/{len(chunks)} chunks",
                blocks_affected=total_blocks_affected,
                execution_time=total_time,
                retries=total_retries,
                error="; ".join(errors)
            )
        else:
            return RCONResult(
                success=True,
                command=f"fill (parallel, {len(chunks)} chunks, {max_workers} workers)",
                response=f"Successfully filled {total_blocks_affected} blocks in {len(chunks)} chunks",
                blocks_affected=total_blocks_affected,
                execution_time=total_time,
                retries=total_retries
            )
    
    def _optimize_chunks_for_terrain(
        self,
        chunks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Optimize chunks for terrain fill by skipping layers with no air blocks.
        
        This is a smart optimization for terrain repair operations. It checks if
        a layer has any air blocks before attempting to fill it, significantly
        reducing unnecessary operations.
        
        Args:
            chunks: List of chunk dictionaries
            
        Returns:
            Filtered list of chunks that need filling
        """
        optimized_chunks = []
        skipped_count = 0
        
        for chunk in chunks:
            # Extract coordinates from chunk
            x1 = chunk['x1']
            y1 = chunk['y1']
            z1 = chunk['z1']
            x2 = chunk['x2']
            y2 = chunk['y2']
            z2 = chunk['z2']
            
            # For terrain fill, check if layer has air blocks
            # Sample a few positions to determine if layer needs filling
            has_air = self._check_layer_has_air(x1, y1, z1, x2, y2, z2)
            
            if has_air:
                optimized_chunks.append(chunk)
            else:
                skipped_count += 1
                self.logger.debug(
                    f"Skipping chunk at y={y1}-{y2}: no air blocks detected"
                )
        
        if skipped_count > 0:
            self.logger.info(f"Smart fill optimization: skipped {skipped_count} chunks with no air blocks")
        
        return optimized_chunks
    
    def _check_layer_has_air(
        self,
        x1: int, y1: int, z1: int,
        x2: int, y2: int, z2: int
    ) -> bool:
        """Check if a layer has any air blocks by sampling positions.
        
        Args:
            x1, y1, z1: Start coordinates
            x2, y2, z2: End coordinates
            
        Returns:
            True if layer likely has air blocks
        """
        # Sample a few positions in the layer
        # For performance, we only check a few positions rather than the entire layer
        sample_positions = [
            (x1, y1, z1),  # Corner 1
            (x2, y1, z2),  # Corner 2
            ((x1 + x2) // 2, y1, (z1 + z2) // 2),  # Center
        ]
        
        for x, y, z in sample_positions:
            try:
                # Use testforblock to check if position is air
                command = f"testforblock {x} {y} {z} air"
                result = self.execute_command(command, verify=False, operation="test")
                
                # If any position is air, the layer needs filling
                if result.success and "found" in result.response.lower():
                    return True
                    
            except Exception as e:
                # If testforblock fails, assume layer needs filling (safe default)
                self.logger.debug(f"testforblock failed at ({x}, {y}, {z}): {str(e)}")
                return True
        
        # No air blocks found in samples
        return False
    
    def _batch_fill_command(
        self,
        x1: int, y1: int, z1: int,
        x2: int, y2: int, z2: int,
        block: str,
        replace: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Split large fill into chunks using adaptive chunk size.
        
        Args:
            x1, y1, z1: Start coordinates
            x2, y2, z2: End coordinates
            block: Block type to fill
            replace: Optional block type to replace
            
        Returns:
            List of chunk dictionaries with command and coordinates
        """
        chunks = []
        replace_clause = f" replace {replace}" if replace else ""
        
        # Use adaptive chunk size for optimal performance
        effective_chunk_size = self._adaptive_chunk_size
        
        # Ensure coordinates are in correct order
        x_start, x_end = min(x1, x2), max(x1, x2)
        y_start, y_end = min(y1, y2), max(y1, y2)
        z_start, z_end = min(z1, z2), max(z1, z2)
        
        # Split into chunks
        x = x_start
        while x <= x_end:
            y = y_start
            while y <= y_end:
                z = z_start
                while z <= z_end:
                    # Calculate chunk boundaries
                    chunk_x2 = min(x + effective_chunk_size - 1, x_end)
                    chunk_y2 = min(y + effective_chunk_size - 1, y_end)
                    chunk_z2 = min(z + effective_chunk_size - 1, z_end)
                    
                    # Create command for this chunk
                    command = f"fill {x} {y} {z} {chunk_x2} {chunk_y2} {chunk_z2} {block}{replace_clause}"
                    
                    chunks.append({
                        'command': command,
                        'x1': x, 'y1': y, 'z1': z,
                        'x2': chunk_x2, 'y2': chunk_y2, 'z2': chunk_z2
                    })
                    
                    z += effective_chunk_size
                y += effective_chunk_size
            x += effective_chunk_size
        
        return chunks
    
    def verify_gamerule(self, rule: str, expected_value: str) -> bool:
        """Verify gamerule is set to expected value.
        
        Args:
            rule: Gamerule name (e.g., "doDaylightCycle")
            expected_value: Expected value ("true" or "false")
            
        Returns:
            True if gamerule matches expected value
        """
        # Check cache first
        cache_key = rule
        if cache_key in self._gamerule_cache:
            cached_value, cached_time = self._gamerule_cache[cache_key]
            if time.time() - cached_time < self._cache_ttl:
                return cached_value.lower() == expected_value.lower()
        
        # Query gamerule
        command = f"gamerule {rule}"
        result = self.execute_command(command, verify=False, operation="gamerule")
        
        if not result.success:
            self.logger.error(f"Failed to query gamerule {rule}: {result.error}")
            return False
        
        # Parse response
        actual_value = self._parse_gamerule_response(result.response)
        
        if actual_value:
            # Update cache
            self._gamerule_cache[cache_key] = (actual_value, time.time())
            return actual_value.lower() == expected_value.lower()
        
        self.logger.error(f"Failed to parse gamerule response: {result.response}")
        return False
    
    def _parse_fill_response(self, response: str) -> int:
        """Extract blocks filled count from fill command response.
        
        Example responses:
        - "Successfully filled 1234 blocks"
        - "Filled 1234 blocks with grass_block"
        
        Args:
            response: Command response
            
        Returns:
            Number of blocks filled, or 0 if parsing fails
        """
        patterns = [
            r"filled\s+(\d+)\s+blocks?",
            r"successfully\s+filled\s+(\d+)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, response, re.IGNORECASE)
            if match:
                return int(match.group(1))
        
        return 0
    
    def _parse_gamerule_response(self, response: str) -> Optional[str]:
        """Extract gamerule value from query response.
        
        Example response:
        - "Gamerule doDaylightCycle is currently set to: false"
        
        Args:
            response: Command response
            
        Returns:
            Gamerule value ("true" or "false"), or None if parsing fails
        """
        match = re.search(r"set\s+to:\s*(\w+)", response, re.IGNORECASE)
        if match:
            return match.group(1).lower()
        return None
    
    def _is_success_response(self, response: str) -> bool:
        """Determine if command response indicates success.
        
        Args:
            response: Command response
            
        Returns:
            True if response indicates success
        """
        success_indicators = [
            "successfully",
            "filled",
            "set to",
            "teleported",
            "killed",
            "summoned",
            "gave",
            "placed"
        ]
        
        error_indicators = [
            "error",
            "failed",
            "invalid",
            "unknown",
            "cannot",
            "unable",
            "no player",
            "no entity",
            "permission",
            "not allowed",
            "not permitted"
        ]
        
        response_lower = response.lower()
        
        # Check for errors first
        if any(err in response_lower for err in error_indicators):
            return False
        
        # Check for success indicators
        if any(success in response_lower for success in success_indicators):
            return True
        
        # If no clear indicators, assume success if response is not empty
        return len(response.strip()) > 0
    
    def format_error_response(
        self,
        category: str,
        error: str,
        suggestions: List[str]
    ) -> str:
        """Format user-friendly error response.
        
        Args:
            category: Error category (e.g., "Connection Error")
            error: Error message
            suggestions: List of recovery suggestions
            
        Returns:
            Formatted error response
        """
        response = f"❌ **{category}**\n\n"
        response += f"**Error:** {error}\n\n"
        response += "**Recovery Suggestions:**\n"
        
        for i, suggestion in enumerate(suggestions, 1):
            response += f"{i}. {suggestion}\n"
        
        return response
    
    def handle_connection_error(self, error: Exception) -> str:
        """Handle RCON connection errors with troubleshooting steps.
        
        Args:
            error: Connection exception
            
        Returns:
            Formatted error message with recovery suggestions
        """
        error_msg = str(error)
        
        # Categorize connection error
        if "connection refused" in error_msg.lower():
            category = "Connection Refused"
            error_detail = "Unable to connect to Minecraft server RCON port"
            suggestions = [
                "Verify Minecraft server is running",
                "Check that RCON is enabled in server.properties (enable-rcon=true)",
                f"Verify RCON port is correct (currently: {self.port})",
                "Check firewall settings allow RCON port",
                "Ensure server has finished starting up"
            ]
        elif "timeout" in error_msg.lower():
            category = "Connection Timeout"
            error_detail = "Connection to Minecraft server timed out"
            suggestions = [
                "Check network connectivity to server",
                f"Verify server is reachable at {self.host}:{self.port}",
                "Check if server is under heavy load",
                "Increase timeout value if server is slow to respond",
                "Verify no network issues or packet loss"
            ]
        elif "authentication" in error_msg.lower() or "password" in error_msg.lower():
            category = "Authentication Failed"
            error_detail = "RCON password authentication failed"
            suggestions = [
                "Verify RCON password matches server.properties (rcon.password)",
                "Check for special characters in password that may need escaping",
                "Ensure password environment variable is set correctly",
                "Restart Minecraft server after changing RCON password",
                "Check server logs for authentication errors"
            ]
        else:
            category = "Connection Error"
            error_detail = error_msg
            suggestions = [
                "Verify Minecraft server is running and accessible",
                "Check RCON configuration in server.properties",
                f"Verify connection details: {self.host}:{self.port}",
                "Check server logs for RCON-related errors",
                "Try restarting the Minecraft server"
            ]
        
        return self.format_error_response(category, error_detail, suggestions)
    
    def handle_timeout_error(self, command: str, operation: str = "command") -> str:
        """Handle command timeout errors with operation-specific messages.
        
        Args:
            command: Command that timed out
            operation: Type of operation (e.g., "clear", "fill", "gamerule")
            
        Returns:
            Formatted error message with recovery suggestions
        """
        category = "Command Timeout"
        
        # Operation-specific error messages
        if operation == "clear":
            error_detail = f"Clear operation timed out after {self.timeout} seconds"
            suggestions = [
                "The clear area may be too large - try clearing smaller regions",
                "Server may be under heavy load - wait and try again",
                f"Increase timeout value (currently {self.timeout}s) for large operations",
                "Check server TPS (ticks per second) - low TPS indicates lag",
                "Consider using smaller batch sizes for large operations"
            ]
        elif operation == "fill":
            error_detail = f"Fill operation timed out after {self.timeout} seconds"
            suggestions = [
                "The fill region may be too large - operation will be automatically batched",
                "Server may be experiencing lag - check server TPS",
                f"Increase timeout value (currently {self.timeout}s) if needed",
                "Reduce chunk size for better performance",
                "Check server logs for performance issues"
            ]
        elif operation == "gamerule":
            error_detail = f"Gamerule command timed out after {self.timeout} seconds"
            suggestions = [
                "Server may be unresponsive - check server status",
                "Try the command again - gamerule commands are usually fast",
                "Check if server is frozen or crashed",
                "Restart server if it's not responding",
                "Check server logs for errors"
            ]
        else:
            error_detail = f"Command '{command}' timed out after {self.timeout} seconds"
            suggestions = [
                "Server may be under heavy load or experiencing lag",
                f"Increase timeout value (currently {self.timeout}s) if needed",
                "Check server TPS and performance metrics",
                "Try the command again after server load decreases",
                "Check server logs for performance issues"
            ]
        
        return self.format_error_response(category, error_detail, suggestions)
    
    def handle_command_error(self, command: str, response: str) -> str:
        """Handle command execution errors with syntax and permission checks.
        
        Args:
            command: Command that failed
            response: Error response from server
            
        Returns:
            Formatted error message with recovery suggestions
        """
        response_lower = response.lower()
        
        # Categorize command error
        if "unknown" in response_lower or "invalid" in response_lower:
            category = "Invalid Command"
            error_detail = f"Command not recognized: {command}"
            suggestions = [
                "Check command syntax - may have typos or incorrect format",
                "Verify command is valid for your Minecraft version",
                "Check if required command arguments are provided",
                "Consult Minecraft command documentation for correct syntax",
                "Try using tab completion in-game to verify command structure"
            ]
        elif "permission" in response_lower or "not allowed" in response_lower:
            category = "Permission Denied"
            error_detail = f"Insufficient permissions to execute: {command}"
            suggestions = [
                "Verify RCON user has operator permissions",
                "Check server.properties for op-permission-level setting",
                "Ensure enable-command-block=true if using command blocks",
                "Grant operator status to RCON user in server console",
                "Check server logs for permission-related errors"
            ]
        elif "no player" in response_lower or "no entity" in response_lower:
            category = "Target Not Found"
            error_detail = "Command target (player/entity) not found"
            suggestions = [
                "Verify player or entity exists in the world",
                "Check if player name or entity selector is correct",
                "Ensure player is online if targeting by name",
                "Use @a, @e, or other selectors to target multiple entities",
                "Check command syntax for correct target specification"
            ]
        elif "cannot" in response_lower or "unable" in response_lower:
            category = "Command Execution Failed"
            error_detail = f"Server unable to execute command: {response}"
            suggestions = [
                "Check if command parameters are within valid ranges",
                "Verify world coordinates are within loaded chunks",
                "Ensure target blocks/entities are accessible",
                "Check server logs for detailed error information",
                "Try breaking command into smaller operations"
            ]
        else:
            category = "Command Error"
            error_detail = f"Command failed: {response}"
            suggestions = [
                "Check command syntax and parameters",
                "Verify server state allows this command",
                "Check server logs for detailed error information",
                "Try the command manually in server console",
                "Consult Minecraft command documentation"
            ]
        
        return self.format_error_response(category, error_detail, suggestions)
    
    def handle_verification_error(self, command: str, expected: str, actual: str) -> str:
        """Handle command verification errors with retry suggestions.
        
        Args:
            command: Command that was executed
            expected: Expected result
            actual: Actual result
            
        Returns:
            Formatted error message with recovery suggestions
        """
        category = "Verification Failed"
        error_detail = f"Command executed but verification failed. Expected: {expected}, Got: {actual}"
        
        suggestions = [
            "Command may have partially succeeded - check server state manually",
            "Retry the operation - verification may have been premature",
            "Check server logs to see if command actually executed",
            "Verify server is not experiencing lag or performance issues",
            "If problem persists, try executing command manually in server console"
        ]
        
        return self.format_error_response(category, error_detail, suggestions)
    
    def categorize_and_handle_error(self, error: Exception, command: str = "", operation: str = "") -> str:
        """Categorize error and return appropriate error message.
        
        Args:
            error: Exception that occurred
            command: Command that caused the error (if applicable)
            operation: Type of operation (if applicable)
            
        Returns:
            Formatted error message with recovery suggestions
        """
        error_str = str(error).lower()
        
        # Connection errors
        if any(keyword in error_str for keyword in ["connection", "refused", "unreachable", "network"]):
            return self.handle_connection_error(error)
        
        # Timeout errors
        elif "timeout" in error_str:
            return self.handle_timeout_error(command, operation)
        
        # Authentication errors
        elif any(keyword in error_str for keyword in ["authentication", "password", "auth"]):
            return self.handle_connection_error(error)  # Uses same handler
        
        # Generic error
        else:
            category = "Execution Error"
            error_detail = str(error)
            suggestions = [
                "Check server status and logs",
                "Verify RCON connection is stable",
                "Try the operation again",
                "Check if server is experiencing issues",
                "Contact server administrator if problem persists"
            ]
            return self.format_error_response(category, error_detail, suggestions)
    
    def _track_performance(
        self,
        operation: str,
        blocks: int,
        execution_time: float,
        success: bool
    ) -> None:
        """Track performance metrics for adaptive optimization.
        
        Args:
            operation: Type of operation (e.g., "fill", "clear")
            blocks: Number of blocks affected
            execution_time: Time taken in seconds
            success: Whether operation succeeded
        """
        # Calculate blocks per second
        blocks_per_second = blocks / execution_time if execution_time > 0 else 0
        
        # Add to performance history
        self._performance_history.append({
            'operation': operation,
            'blocks': blocks,
            'execution_time': execution_time,
            'blocks_per_second': blocks_per_second,
            'success': success,
            'timestamp': time.time()
        })
        
        # Limit history size
        if len(self._performance_history) > self._max_history_size:
            self._performance_history.pop(0)
        
        # Log performance
        self.logger.debug(
            f"Performance: {operation} - {blocks} blocks in {execution_time:.2f}s "
            f"({blocks_per_second:.0f} blocks/s)"
        )
        
        # Adjust chunk size based on performance
        self._adjust_chunk_size()
    
    def _adjust_chunk_size(self) -> None:
        """Dynamically adjust chunk size based on recent performance.
        
        This method analyzes recent performance metrics and adjusts the chunk
        size to optimize for server performance. If operations are consistently
        fast, increase chunk size. If operations are slow or timing out, decrease
        chunk size.
        """
        if len(self._performance_history) < 5:
            # Not enough data to make adjustments
            return
        
        # Get recent performance metrics
        recent_metrics = self._performance_history[-10:]
        
        # Calculate average blocks per second
        successful_metrics = [m for m in recent_metrics if m['success']]
        if not successful_metrics:
            return
        
        avg_blocks_per_second = sum(m['blocks_per_second'] for m in successful_metrics) / len(successful_metrics)
        avg_execution_time = sum(m['execution_time'] for m in successful_metrics) / len(successful_metrics)
        
        # Determine if we should adjust chunk size
        # Fast performance (>10000 blocks/s, <2s per operation) -> increase chunk size
        # Slow performance (<5000 blocks/s, >5s per operation) -> decrease chunk size
        
        if avg_blocks_per_second > 10000 and avg_execution_time < 2.0:
            # Server is handling operations well, increase chunk size
            new_chunk_size = min(self._adaptive_chunk_size + 4, 48)  # Max 48
            if new_chunk_size != self._adaptive_chunk_size:
                self.logger.info(
                    f"Increasing chunk size from {self._adaptive_chunk_size} to {new_chunk_size} "
                    f"(avg {avg_blocks_per_second:.0f} blocks/s)"
                )
                self._adaptive_chunk_size = new_chunk_size
                
        elif avg_blocks_per_second < 5000 or avg_execution_time > 5.0:
            # Server is struggling, decrease chunk size
            new_chunk_size = max(self._adaptive_chunk_size - 4, 16)  # Min 16
            if new_chunk_size != self._adaptive_chunk_size:
                self.logger.info(
                    f"Decreasing chunk size from {self._adaptive_chunk_size} to {new_chunk_size} "
                    f"(avg {avg_blocks_per_second:.0f} blocks/s)"
                )
                self._adaptive_chunk_size = new_chunk_size
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get current performance statistics.
        
        Returns:
            Dictionary with performance metrics
        """
        if not self._performance_history:
            return {
                'operations': 0,
                'avg_blocks_per_second': 0,
                'avg_execution_time': 0,
                'success_rate': 0,
                'current_chunk_size': self._adaptive_chunk_size
            }
        
        successful_ops = [m for m in self._performance_history if m['success']]
        
        return {
            'operations': len(self._performance_history),
            'successful_operations': len(successful_ops),
            'avg_blocks_per_second': sum(m['blocks_per_second'] for m in successful_ops) / len(successful_ops) if successful_ops else 0,
            'avg_execution_time': sum(m['execution_time'] for m in successful_ops) / len(successful_ops) if successful_ops else 0,
            'success_rate': len(successful_ops) / len(self._performance_history) if self._performance_history else 0,
            'current_chunk_size': self._adaptive_chunk_size,
            'default_chunk_size': self.chunk_size
        }
