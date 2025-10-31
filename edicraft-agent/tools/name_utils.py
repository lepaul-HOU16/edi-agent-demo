"""
Well Name Simplification Utilities

This module provides utilities for converting long OSDU well identifiers
to user-friendly short names for demo presentations and Minecraft visualizations.

Usage:
    # Using the class directly
    from tools.name_utils import WellNameSimplifier
    
    simplifier = WellNameSimplifier()
    short_name = simplifier.simplify_name("osdu:work-product-component--WellboreTrajectory:WELL-007:abc")
    # Returns: "WELL-007"
    
    full_id = simplifier.get_full_id("WELL-007")
    # Returns: "osdu:work-product-component--WellboreTrajectory:WELL-007:abc"
    
    # Using convenience functions (global instance)
    from tools.name_utils import simplify_well_name, get_full_well_id
    
    short = simplify_well_name("osdu:master-data--Wellbore:12345")
    # Returns: "WELL-12345"
    
    full = get_full_well_id("WELL-12345")
    # Returns: "osdu:master-data--Wellbore:12345"
"""

import re
from typing import Dict, Optional


class WellNameSimplifier:
    """
    Simplify OSDU well identifiers to user-friendly names.
    
    This class maintains bidirectional mappings between full OSDU IDs and
    short, human-readable names like "WELL-007" for use in demonstrations
    and Minecraft visualizations.
    
    Examples:
        >>> simplifier = WellNameSimplifier()
        >>> short = simplifier.simplify_name("osdu:work-product-component--WellboreTrajectory:WELL-007:abc123")
        >>> print(short)  # "WELL-007"
        >>> full = simplifier.get_full_id("WELL-007")
        >>> print(full)  # "osdu:work-product-component--WellboreTrajectory:WELL-007:abc123"
    """
    
    def __init__(self):
        """Initialize the name simplifier with empty caches."""
        self.name_cache: Dict[str, str] = {}  # Map full OSDU ID to short name
        self.id_cache: Dict[str, str] = {}    # Map short name to full OSDU ID
        self.name_counter: Dict[str, int] = {}  # Track duplicate name counts
    
    def simplify_name(self, osdu_id: str) -> str:
        """
        Convert OSDU ID to short name.
        
        This method extracts a human-readable identifier from OSDU IDs and
        caches the mapping for future lookups. It handles various OSDU ID
        patterns and automatically generates short names when no obvious
        identifier is present.
        
        Supported patterns:
        - "osdu:work-product-component--WellboreTrajectory:WELL-007:..." -> "WELL-007"
        - "osdu:master-data--Wellbore:12345..." -> "WELL-12345"
        - "osdu:work-product-component--WellboreTrajectory:abc123..." -> "WELL-abc123"
        
        Args:
            osdu_id: Full OSDU identifier string
            
        Returns:
            Short, user-friendly name (e.g., "WELL-007")
            
        Examples:
            >>> simplifier = WellNameSimplifier()
            >>> simplifier.simplify_name("osdu:work-product-component--WellboreTrajectory:WELL-007:abc")
            'WELL-007'
            >>> simplifier.simplify_name("osdu:master-data--Wellbore:12345")
            'WELL-12345'
        """
        # Check if already cached
        if osdu_id in self.name_cache:
            return self.name_cache[osdu_id]
        
        # Extract identifier from OSDU ID
        short_name = self._extract_identifier(osdu_id)
        
        # Handle duplicates by adding suffix
        short_name = self._handle_duplicate(short_name)
        
        # Cache the mapping
        self.name_cache[osdu_id] = short_name
        self.id_cache[short_name] = osdu_id
        
        return short_name
    
    def get_full_id(self, short_name: str) -> Optional[str]:
        """
        Get full OSDU ID from short name.
        
        Performs reverse lookup from short name to full OSDU ID.
        Returns None if the short name is not registered.
        
        Args:
            short_name: Short name (e.g., "WELL-007")
            
        Returns:
            Full OSDU ID if found, None otherwise
            
        Examples:
            >>> simplifier = WellNameSimplifier()
            >>> simplifier.register_well("osdu:work-product-component--WellboreTrajectory:WELL-007:abc", "WELL-007")
            >>> simplifier.get_full_id("WELL-007")
            'osdu:work-product-component--WellboreTrajectory:WELL-007:abc'
            >>> simplifier.get_full_id("WELL-999")
            None
        """
        return self.id_cache.get(short_name)
    
    def register_well(self, osdu_id: str, short_name: Optional[str] = None) -> str:
        """
        Register well in cache with optional custom short name.
        
        This method allows explicit registration of wells with custom short names.
        If no short name is provided, one will be automatically generated.
        Handles duplicate names by adding numeric suffixes.
        
        Args:
            osdu_id: Full OSDU identifier
            short_name: Optional custom short name. If None, will be auto-generated.
            
        Returns:
            The registered short name (may have suffix if duplicate)
            
        Examples:
            >>> simplifier = WellNameSimplifier()
            >>> simplifier.register_well("osdu:work-product-component--WellboreTrajectory:WELL-007:abc", "WELL-007")
            'WELL-007'
            >>> simplifier.register_well("osdu:work-product-component--WellboreTrajectory:WELL-007:xyz", "WELL-007")
            'WELL-007-2'
        """
        # If already registered, return existing short name
        if osdu_id in self.name_cache:
            return self.name_cache[osdu_id]
        
        # Generate short name if not provided
        if short_name is None:
            short_name = self._extract_identifier(osdu_id)
        
        # Handle duplicates
        final_name = self._handle_duplicate(short_name)
        
        # Cache the mapping
        self.name_cache[osdu_id] = final_name
        self.id_cache[final_name] = osdu_id
        
        return final_name
    
    def _extract_identifier(self, osdu_id: str) -> str:
        """
        Extract identifier from OSDU ID.
        
        Parses various OSDU ID patterns to extract a meaningful identifier.
        
        Args:
            osdu_id: Full OSDU identifier
            
        Returns:
            Extracted identifier or generated name
        """
        # Pattern 1: osdu:work-product-component--WellboreTrajectory:WELL-007:...
        # Extract "WELL-007"
        match = re.search(r':([A-Z]+-\d+):', osdu_id)
        if match:
            return match.group(1)
        
        # Pattern 2: osdu:master-data--Wellbore:12345...
        # Extract "12345" and format as "WELL-12345"
        match = re.search(r'Wellbore:(\d+)', osdu_id)
        if match:
            return f"WELL-{match.group(1)}"
        
        # Pattern 3: osdu:work-product-component--WellboreTrajectory:abc123...
        # Extract "abc123" and format as "WELL-abc123"
        match = re.search(r'WellboreTrajectory:([^:]+)', osdu_id)
        if match:
            identifier = match.group(1)
            # If it doesn't start with WELL-, add it
            if not identifier.startswith('WELL-'):
                return f"WELL-{identifier}"
            return identifier
        
        # Pattern 4: Any other pattern - extract last meaningful segment
        parts = osdu_id.split(':')
        if len(parts) >= 2:
            identifier = parts[-2] if len(parts) > 2 else parts[-1]
            # Clean up the identifier
            identifier = re.sub(r'[^A-Za-z0-9-]', '', identifier)
            if identifier and not identifier.startswith('WELL-'):
                return f"WELL-{identifier}"
            return identifier if identifier else "WELL-UNKNOWN"
        
        # Fallback: Use hash of the ID
        return f"WELL-{abs(hash(osdu_id)) % 10000:04d}"
    
    def _handle_duplicate(self, short_name: str) -> str:
        """
        Handle duplicate short names by adding numeric suffix.
        
        Args:
            short_name: Proposed short name
            
        Returns:
            Unique short name (may have suffix like "-2", "-3", etc.)
        """
        # If name is not in use, return as-is
        if short_name not in self.id_cache:
            return short_name
        
        # Track how many times we've seen this base name
        base_name = short_name
        if base_name not in self.name_counter:
            self.name_counter[base_name] = 1
        
        # Increment counter and generate new name
        self.name_counter[base_name] += 1
        suffix = self.name_counter[base_name]
        
        # Generate unique name with suffix
        new_name = f"{base_name}-{suffix}"
        
        # Recursively check if this name is also taken (unlikely but possible)
        if new_name in self.id_cache:
            return self._handle_duplicate(new_name)
        
        return new_name
    
    def clear_cache(self):
        """
        Clear all cached mappings.
        
        Useful for resetting state between demo sessions.
        """
        self.name_cache.clear()
        self.id_cache.clear()
        self.name_counter.clear()
    
    def get_all_wells(self) -> Dict[str, str]:
        """
        Get all registered wells.
        
        Returns:
            Dictionary mapping short names to full OSDU IDs
        """
        return self.id_cache.copy()
    
    def __len__(self) -> int:
        """Return number of registered wells."""
        return len(self.name_cache)
    
    def __contains__(self, item: str) -> bool:
        """
        Check if a name or ID is registered.
        
        Args:
            item: Either a short name or full OSDU ID
            
        Returns:
            True if registered, False otherwise
        """
        return item in self.name_cache or item in self.id_cache


# Global instance for convenience
_global_simplifier = WellNameSimplifier()


def simplify_well_name(osdu_id: str) -> str:
    """
    Convenience function to simplify a well name using the global instance.
    
    Args:
        osdu_id: Full OSDU identifier
        
    Returns:
        Short, user-friendly name
    """
    return _global_simplifier.simplify_name(osdu_id)


def get_full_well_id(short_name: str) -> Optional[str]:
    """
    Convenience function to get full ID using the global instance.
    
    Args:
        short_name: Short name (e.g., "WELL-007")
        
    Returns:
        Full OSDU ID if found, None otherwise
    """
    return _global_simplifier.get_full_id(short_name)


def register_well(osdu_id: str, short_name: Optional[str] = None) -> str:
    """
    Convenience function to register a well using the global instance.
    
    Args:
        osdu_id: Full OSDU identifier
        short_name: Optional custom short name
        
    Returns:
        The registered short name
    """
    return _global_simplifier.register_well(osdu_id, short_name)
