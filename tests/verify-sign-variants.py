#!/usr/bin/env python3
"""
Verification script for sign variants in clear_environment_tool.py

This script verifies that all Minecraft sign block types are included
in the rig_blocks list for proper clearing.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.clear_environment_tool import ClearEnvironmentTool
from config import EDIcraftConfig


def verify_sign_variants():
    """Verify all sign variants are included in rig_blocks."""
    print("\n" + "="*80)
    print("SIGN VARIANTS VERIFICATION")
    print("="*80)
    
    # Expected sign variants (all wood types + generic)
    expected_signs = [
        "oak_sign",
        "oak_wall_sign",
        "spruce_sign",
        "spruce_wall_sign",
        "birch_sign",
        "birch_wall_sign",
        "jungle_sign",
        "jungle_wall_sign",
        "acacia_sign",
        "acacia_wall_sign",
        "dark_oak_sign",
        "dark_oak_wall_sign",
        "crimson_sign",
        "crimson_wall_sign",
        "warped_sign",
        "warped_wall_sign",
        "wall_sign",  # Generic wall sign
    ]
    
    # Create tool instance
    try:
        config = EDIcraftConfig()
        tool = ClearEnvironmentTool(config)
    except Exception as e:
        print(f"\n❌ Failed to create tool instance: {str(e)}")
        return False
    
    # Check which signs are in rig_blocks
    print("\n✅ Sign variants found in rig_blocks:")
    found_signs = []
    for sign in expected_signs:
        if sign in tool.rig_blocks:
            print(f"   ✓ {sign}")
            found_signs.append(sign)
        else:
            print(f"   ✗ {sign} (MISSING)")
    
    # Summary
    print(f"\n📊 Summary:")
    print(f"   Expected: {len(expected_signs)} sign variants")
    print(f"   Found: {len(found_signs)} sign variants")
    
    if len(found_signs) == len(expected_signs):
        print("\n🎉 All sign variants are included!")
        return True
    else:
        missing = set(expected_signs) - set(found_signs)
        print(f"\n⚠️  Missing {len(missing)} sign variant(s):")
        for sign in missing:
            print(f"   - {sign}")
        return False


def main():
    """Run verification."""
    try:
        success = verify_sign_variants()
        return 0 if success else 1
    except Exception as e:
        print(f"\n❌ Verification failed: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
