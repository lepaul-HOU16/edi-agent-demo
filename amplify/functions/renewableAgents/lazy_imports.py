"""
Lazy loading helper functions for heavy dependencies
Reduces cold start time by loading dependencies only when needed
"""
import logging

logger = logging.getLogger('lazy_imports')

# Global variables to cache loaded modules
_pywake = None
_geopandas = None
_matplotlib = None
_matplotlib_pyplot = None


def get_pywake():
    """
    Lazy load PyWake on first use (simulation agent only)
    
    Returns:
        py_wake module
    """
    global _pywake
    if _pywake is None:
        logger.info("🔄 Lazy loading PyWake (first use)...")
        import py_wake
        _pywake = py_wake
        logger.info("✅ PyWake loaded successfully")
    return _pywake


def get_geopandas():
    """
    Lazy load GeoPandas on first use (terrain and layout agents)
    
    Returns:
        geopandas module
    """
    global _geopandas
    if _geopandas is None:
        logger.info("🔄 Lazy loading GeoPandas (first use)...")
        import geopandas
        _geopandas = geopandas
        logger.info("✅ GeoPandas loaded successfully")
    return _geopandas


def get_matplotlib():
    """
    Lazy load Matplotlib on first use (report agent)
    
    Returns:
        matplotlib module
    """
    global _matplotlib
    if _matplotlib is None:
        logger.info("🔄 Lazy loading Matplotlib (first use)...")
        import matplotlib
        # Configure for non-GUI environment
        matplotlib.use('Agg')
        _matplotlib = matplotlib
        logger.info("✅ Matplotlib loaded successfully (Agg backend)")
    return _matplotlib


def get_matplotlib_pyplot():
    """
    Lazy load Matplotlib pyplot on first use
    
    Returns:
        matplotlib.pyplot module
    """
    global _matplotlib_pyplot
    if _matplotlib_pyplot is None:
        # Ensure matplotlib is loaded first with correct backend
        get_matplotlib()
        logger.info("🔄 Lazy loading Matplotlib pyplot (first use)...")
        import matplotlib.pyplot as plt
        _matplotlib_pyplot = plt
        logger.info("✅ Matplotlib pyplot loaded successfully")
    return _matplotlib_pyplot


# Convenience function to check if a module is loaded
def is_loaded(module_name: str) -> bool:
    """
    Check if a heavy dependency module is already loaded
    
    Args:
        module_name: One of 'pywake', 'geopandas', 'matplotlib'
    
    Returns:
        True if module is loaded, False otherwise
    """
    if module_name == 'pywake':
        return _pywake is not None
    elif module_name == 'geopandas':
        return _geopandas is not None
    elif module_name == 'matplotlib':
        return _matplotlib is not None
    else:
        logger.warning(f"Unknown module name: {module_name}")
        return False


# Convenience function to get loading status
def get_loading_status() -> dict:
    """
    Get the loading status of all heavy dependencies
    
    Returns:
        Dictionary with module names and their loading status
    """
    return {
        'pywake': _pywake is not None,
        'geopandas': _geopandas is not None,
        'matplotlib': _matplotlib is not None,
        'matplotlib_pyplot': _matplotlib_pyplot is not None
    }
