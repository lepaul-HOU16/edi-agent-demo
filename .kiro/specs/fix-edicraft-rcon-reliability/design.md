# Design Document

## Overview

This design addresses critical reliability issues in EDIcraft's RCON command execution by implementing a robust command execution layer with timeouts, retries, verification, and proper error handling. The solution wraps the existing RCON client with reliability mechanisms and updates all tools to use the enhanced execution layer.

## Architecture

### Current Architecture (Problematic)

```
Tool (clear_environment_tool.py)
    ↓
Direct RCON Client call
    ↓
Minecraft Server
    ↓
No verification, no timeout, no retry
```

**Problems:**
- Commands can hang indefinitely
- No way to detect silent failures
- No retry mechanism for transient errors
- Large operations overwhelm server
- No command result verification

### New Architecture (Reliable)

```
Tool (clear_environment_tool.py)
    ↓
Enhanced RCON Executor (rcon_executor.py)
    ↓
    ├─ Timeout Handler (10s per command)
    ├─ Retry Logic (3 attempts with backoff)
    ├─ Result Verification (parse response)
    ├─ Batch Processor (chunk large operations)
    └─ Error Handler (detailed error messages)
    ↓
RCON Client
    ↓
Minecraft Server
```

## Components and Interfaces

### 1. Enhanced RCON Executor

**File:** `edicraft-agent/tools/rcon_executor.py`

**Purpose:** Provides reliable RCON command execution with timeouts, retries, and verification.

**Interface:**

```python
class RCONExecutor:
    """Enhanced RCON command executor with reliability features."""
    
    def __init__(self, host: str, port: int, password: str, 
                 timeout: int = 10, max_retries: int = 3):
        """Initialize executor with connection parameters."""
        pass
    
    def execute_command(self, command: str, 
                       verify: bool = True) -> RCONResult:
        """Execute single command with timeout and retry.
        
        Args:
            command: Minecraft command to execute
            verify: Whether to verify command result
            
        Returns:
            RCONResult with success status, response, and metadata
        """
        pass
    
    def execute_batch(self, commands: List[str], 
                     parallel: bool = False) -> List[RCONResult]:
        """Execute multiple commands with optional parallelization.
        
        Args:
            commands: List of Minecraft commands
            parallel: Whether to execute in parallel
            
        Returns:
            List of RCONResult objects
        """
        pass
    
    def execute_fill(self, x1: int, y1: int, z1: int,
                    x2: int, y2: int, z2: int,
                    block: str, replace: str = None) -> RCONResult:
        """Execute fill command with automatic batching.
        
        Automatically splits large fills into chunks to prevent
        server overload.
        
        Args:
            x1, y1, z1: Start coordinates
            x2, y2, z2: End coordinates
            block: Block type to fill
            replace: Optional block type to replace
            
        Returns:
            RCONResult with total blocks filled
        """
        pass
    
    def verify_gamerule(self, rule: str, expected_value: str) -> bool:
        """Verify gamerule is set to expected value.
        
        Args:
            rule: Gamerule name (e.g., "doDaylightCycle")
            expected_value: Expected value ("true" or "false")
            
        Returns:
            True if gamerule matches expected value
        """
        pass
```

**Data Model:**

```python
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
```

### 2. Command Batching Strategy

**Purpose:** Split large fill operations into manageable chunks to prevent server overload.

**Algorithm:**

```python
def batch_fill_command(x1, y1, z1, x2, y2, z2, block, replace=None):
    """Split large fill into chunks of max 32x32x32 blocks."""
    
    MAX_CHUNK_SIZE = 32
    chunks = []
    
    # Calculate dimensions
    dx = abs(x2 - x1) + 1
    dy = abs(y2 - y1) + 1
    dz = abs(z2 - z1) + 1
    
    # Split into chunks
    for x in range(x1, x2 + 1, MAX_CHUNK_SIZE):
        for y in range(y1, y2 + 1, MAX_CHUNK_SIZE):
            for z in range(z1, z2 + 1, MAX_CHUNK_SIZE):
                chunk_x2 = min(x + MAX_CHUNK_SIZE - 1, x2)
                chunk_y2 = min(y + MAX_CHUNK_SIZE - 1, y2)
                chunk_z2 = min(z + MAX_CHUNK_SIZE - 1, z2)
                
                chunks.append({
                    'x1': x, 'y1': y, 'z1': z,
                    'x2': chunk_x2, 'y2': chunk_y2, 'z2': chunk_z2
                })
    
    return chunks
```

### 3. Retry Logic with Exponential Backoff

**Purpose:** Retry failed commands with increasing delays to handle transient errors.

**Algorithm:**

```python
def execute_with_retry(command: str, max_retries: int = 3) -> RCONResult:
    """Execute command with exponential backoff retry."""
    
    for attempt in range(max_retries):
        try:
            result = execute_rcon_command(command)
            
            if is_success(result):
                return RCONResult(
                    success=True,
                    command=command,
                    response=result,
                    retries=attempt
                )
            
            # Command failed, retry with backoff
            if attempt < max_retries - 1:
                delay = 2 ** attempt  # 1s, 2s, 4s
                time.sleep(delay)
                
        except TimeoutError:
            if attempt < max_retries - 1:
                delay = 2 ** attempt
                time.sleep(delay)
            else:
                return RCONResult(
                    success=False,
                    command=command,
                    error="Command timed out after 3 retries"
                )
    
    return RCONResult(
        success=False,
        command=command,
        error="Command failed after 3 retries"
    )
```

### 4. Command Result Verification

**Purpose:** Parse command responses to verify actual execution and extract metrics.

**Parsers:**

```python
def parse_fill_response(response: str) -> int:
    """Extract blocks filled count from fill command response.
    
    Example responses:
    - "Successfully filled 1234 blocks"
    - "Filled 1234 blocks with grass_block"
    
    Returns:
        Number of blocks filled, or 0 if parsing fails
    """
    patterns = [
        r"filled (\d+) blocks?",
        r"successfully filled (\d+)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, response, re.IGNORECASE)
        if match:
            return int(match.group(1))
    
    return 0

def parse_gamerule_response(response: str) -> Optional[str]:
    """Extract gamerule value from query response.
    
    Example response:
    - "Gamerule doDaylightCycle is currently set to: false"
    
    Returns:
        Gamerule value ("true" or "false"), or None if parsing fails
    """
    match = re.search(r"set to: (\w+)", response, re.IGNORECASE)
    if match:
        return match.group(1).lower()
    return None

def is_success_response(response: str) -> bool:
    """Determine if command response indicates success."""
    success_indicators = [
        "successfully",
        "filled",
        "set to",
        "teleported",
        "killed"
    ]
    
    error_indicators = [
        "error",
        "failed",
        "invalid",
        "unknown",
        "cannot"
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
```

### 5. Updated Clear Environment Tool

**Changes:**

1. Replace direct RCON calls with `RCONExecutor`
2. Use batched fill commands for large areas
3. Verify each operation succeeded
4. Return detailed results with blocks cleared count
5. Handle partial success gracefully

**Key Methods:**

```python
def clear_minecraft_environment(self, area: str = "all", 
                               preserve_terrain: bool = True) -> str:
    """Clear environment using enhanced RCON executor."""
    
    executor = RCONExecutor(self.host, self.port, self.password)
    
    results = {
        'wellbores_cleared': 0,
        'rigs_cleared': 0,
        'markers_cleared': 0,
        'terrain_filled': 0,
        'errors': []
    }
    
    # Clear each block type with verification
    for block_type in self.wellbore_blocks:
        result = executor.execute_fill(
            self.clear_region['x1'], self.clear_region['y1'], 
            self.clear_region['z1'], self.clear_region['x2'], 
            self.clear_region['y2'], self.clear_region['z2'],
            'air', replace=block_type
        )
        
        if result.success:
            results['wellbores_cleared'] += result.blocks_affected
        else:
            results['errors'].append(f"Failed to clear {block_type}: {result.error}")
    
    # Fill terrain with batching
    if preserve_terrain:
        result = executor.execute_fill(
            self.clear_region['x1'], 61, self.clear_region['z1'],
            self.clear_region['x2'], 70, self.clear_region['z2'],
            'grass_block', replace='air'
        )
        
        if result.success:
            results['terrain_filled'] = result.blocks_affected
        else:
            results['errors'].append(f"Terrain fill failed: {result.error}")
    
    return self._format_clear_response(results)
```

### 6. Updated Time Lock Tool

**Changes:**

1. Use `RCONExecutor` for command execution
2. Verify gamerule was actually set
3. Retry gamerule command if verification fails
4. Return verified gamerule state in response

**Key Methods:**

```python
def lock_world_time(time: str = "day", enabled: bool = True) -> str:
    """Lock world time with verification."""
    
    executor = RCONExecutor(host, port, password)
    
    # Set time
    time_result = executor.execute_command(f"time set {time_value}")
    if not time_result.success:
        return error_response("Failed to set time", time_result.error)
    
    # Set gamerule with verification
    gamerule_result = executor.execute_command(
        f"gamerule doDaylightCycle {'false' if enabled else 'true'}"
    )
    
    if not gamerule_result.success:
        return error_response("Failed to set gamerule", gamerule_result.error)
    
    # Verify gamerule was set
    expected_value = 'false' if enabled else 'true'
    if not executor.verify_gamerule('doDaylightCycle', expected_value):
        return error_response(
            "Gamerule verification failed",
            "Gamerule was set but verification shows different value"
        )
    
    return success_response(f"Time locked to {time}", verified=True)
```

## Data Models

### RCONResult

```python
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
    
    def to_dict(self) -> dict:
        """Convert to dictionary for logging."""
        return {
            'success': self.success,
            'command': self.command,
            'response': self.response[:100],  # Truncate long responses
            'blocks_affected': self.blocks_affected,
            'execution_time': self.execution_time,
            'retries': self.retries,
            'error': self.error
        }
```

### ClearOperationResult

```python
@dataclass
class ClearOperationResult:
    """Result of clear environment operation."""
    wellbores_cleared: int = 0
    rigs_cleared: int = 0
    markers_cleared: int = 0
    terrain_filled: int = 0
    total_blocks: int = 0
    execution_time: float = 0.0
    errors: List[str] = field(default_factory=list)
    partial_success: bool = False
    
    @property
    def success(self) -> bool:
        """Operation succeeded if no errors or only partial failures."""
        return len(self.errors) == 0 or self.partial_success
```

## Error Handling

### Error Categories

1. **Connection Errors**: RCON connection failed
   - Check Minecraft server is running
   - Verify RCON is enabled in server.properties
   - Check host/port/password configuration

2. **Timeout Errors**: Command took too long
   - Reduce operation size
   - Check server performance
   - Increase timeout if needed

3. **Command Errors**: Command syntax or execution failed
   - Check command syntax
   - Verify permissions
   - Check server logs

4. **Verification Errors**: Command executed but verification failed
   - Retry command
   - Check server state manually
   - Report as partial success

### Error Response Format

```python
def format_error_response(category: str, error: str, 
                         suggestions: List[str]) -> str:
    """Format user-friendly error response."""
    
    response = f"❌ **{category}**\n\n"
    response += f"**Error:** {error}\n\n"
    response += "**Recovery Suggestions:**\n"
    
    for i, suggestion in enumerate(suggestions, 1):
        response += f"{i}. {suggestion}\n"
    
    return response
```

## Testing Strategy

### Unit Tests

1. **RCONExecutor Tests**
   - Test timeout mechanism
   - Test retry logic with exponential backoff
   - Test command batching
   - Test result parsing
   - Test verification logic

2. **Response Parser Tests**
   - Test fill response parsing with various formats
   - Test gamerule response parsing
   - Test success/failure detection

### Integration Tests

1. **Clear Operation Tests**
   - Test clearing all block types
   - Test terrain fill with batching
   - Test partial success handling
   - Test error recovery

2. **Time Lock Tests**
   - Test time setting
   - Test gamerule setting
   - Test gamerule verification
   - Test retry on verification failure

### End-to-End Tests

1. **Complete Workflow Tests**
   - Build wellbore → Clear → Verify clean
   - Set time lock → Wait → Verify still locked
   - Clear with terrain → Verify surface repaired

2. **Error Scenario Tests**
   - Test with RCON disabled
   - Test with invalid credentials
   - Test with server offline
   - Test with large operations

## Performance Considerations

### Optimization Strategies

1. **Parallel Command Execution**
   - Execute independent clear commands in parallel
   - Use ThreadPoolExecutor for concurrent RCON calls
   - Limit concurrency to avoid overwhelming server

2. **Batch Size Tuning**
   - Default chunk size: 32x32x32 (32,768 blocks)
   - Adjust based on server performance
   - Monitor execution time and adjust dynamically

3. **Smart Terrain Fill**
   - Only fill layers that have air blocks
   - Skip underground if no structures were there
   - Use testforblock to check before filling

4. **Response Caching**
   - Cache gamerule queries for 60 seconds
   - Avoid redundant verification queries
   - Clear cache on gamerule changes

### Performance Metrics

- **Clear Operation**: < 30 seconds for typical area
- **Time Lock**: < 5 seconds including verification
- **Terrain Fill**: < 15 seconds for surface layer
- **Command Timeout**: 10 seconds per command
- **Total Retry Time**: Max 21 seconds (1s + 2s + 4s + 10s final attempt)

## Deployment Considerations

### Configuration

Add to `.env`:

```bash
# RCON Configuration
MINECRAFT_HOST=localhost
MINECRAFT_RCON_PORT=25575
MINECRAFT_RCON_PASSWORD=your_password

# RCON Executor Settings
RCON_TIMEOUT=10
RCON_MAX_RETRIES=3
RCON_CHUNK_SIZE=32
```

### Backward Compatibility

- Existing tools continue to work
- Old `execute_rcon_command` function deprecated but still available
- Gradual migration to `RCONExecutor`

### Monitoring

Add logging for:
- Command execution time
- Retry attempts
- Verification failures
- Batch operation progress
- Error rates

## Migration Plan

### Phase 1: Create RCONExecutor
1. Implement `rcon_executor.py`
2. Add unit tests
3. Test with simple commands

### Phase 2: Update Clear Tool
1. Migrate `clear_environment_tool.py` to use RCONExecutor
2. Add batching for large operations
3. Add result verification
4. Test clear operations

### Phase 3: Update Time Lock
1. Migrate time lock in `workflow_tools.py`
2. Add gamerule verification
3. Test time lock persistence

### Phase 4: Update Other Tools
1. Migrate drilling rig builder
2. Migrate terrain tools
3. Migrate any other RCON-using tools

### Phase 5: Deprecate Old Code
1. Mark old `execute_rcon_command` as deprecated
2. Update documentation
3. Remove old code after migration complete
