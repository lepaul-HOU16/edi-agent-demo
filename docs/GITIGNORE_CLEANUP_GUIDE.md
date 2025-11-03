# Git Repository Cleanup Guide

## Problem Summary

The repository had **8,500+ untracked changes** due to missing entries in `.gitignore`. This was primarily caused by Python package installations in the Lambda layer directory that weren't being ignored.

## Root Causes

### 1. **Lambda Layer Python Packages** (Primary Issue)
- Python packages were installed in `amplify/layers/renewableDemo/python/`
- This directory contained hundreds of Python packages (PIL, boto3, botocore, matplotlib, folium, etc.)
- Each package had multiple files and subdirectories
- **Impact**: ~8,000+ files being tracked

### 2. **Missing Kiro IDE Entries**
- `.kiro/specs/` directory wasn't ignored
- Kiro configuration files were being tracked
- **Impact**: ~100+ files

### 3. **Build Artifacts and Temporary Files**
- Various build outputs and temporary files
- Python cache files (`__pycache__`, `*.pyc`)
- **Impact**: ~50+ files

## Solution Applied

### Updated `.gitignore` with Missing Entries

```gitignore
# Lambda layers - Python packages and dependencies
amplify/layers/*/python/
amplify/layers/*/build/
amplify/layers/*/dist/
amplify/layers/*/*.zip

# Kiro IDE specs and configurations
.kiro/specs/
.kiro/settings/
.kiro/steering/

# Python package installations in layers
**/python/lib/
**/python/bin/
**/python/include/
**/python/share/
**/*.dist-info/
**/*.egg-info/

# Build artifacts and temporary files
*.pyc
*.pyo
*.pyd
__pycache__/
.pytest_cache/
.coverage
htmlcov/
.tox/
.cache
nosetests.xml
coverage.xml
*.cover
.hypothesis/

# Temporary files and backups
*.tmp
*.temp
*.bak
*.backup
*~
.#*

# Editor and IDE files
.vscode/settings.json
.vscode/launch.json
.vscode/tasks.json
.idea/
*.sublime-project
*.sublime-workspace
```

## Results

### Before Cleanup
- **8,500+ untracked changes**
- Repository was unmanageable
- Git operations were slow

### After Cleanup
- **22 legitimate changes**
- All changes are actual code modifications
- Repository is clean and manageable

### Current Status
```
Modified files (14):
- .gitignore (updated)
- amplify/backend.ts (layer fixes)
- amplify/functions/renewableOrchestrator/handler.ts (variable scope fix)
- amplify/functions/renewableTools/folium_generator.py (indentation fix)
- [other legitimate code changes]

New files (8):
- amplify/layers/renewableDemo/resource.ts (new layer definition)
- docs/PYTHON_DEPENDENCIES_SETUP_COMPLETE.md (documentation)
- docs/TYPESCRIPT_LAYER_ISSUES_FIXED.md (documentation)
- [other new documentation and components]
```

## Prevention Guidelines

### 1. **Always Check .gitignore Before Installing Dependencies**
```bash
# Before installing Python packages in layers:
echo "amplify/layers/*/python/" >> .gitignore
```

### 2. **Regular Repository Health Checks**
```bash
# Check for large numbers of untracked files:
git status --porcelain | grep "^??" | wc -l

# If the number is > 50, investigate:
git status --porcelain | grep "^??" | head -20
```

### 3. **Common Patterns to Always Ignore**
- **Build outputs**: `build/`, `dist/`, `*.zip`
- **Dependencies**: `node_modules/`, `**/python/`, `**/*.dist-info/`
- **IDE files**: `.vscode/`, `.idea/`, `*.sublime-*`
- **OS files**: `.DS_Store`, `Thumbs.db`, `Desktop.ini`
- **Temporary files**: `*.tmp`, `*.temp`, `*.bak`, `*~`

### 4. **Layer-Specific Best Practices**
```bash
# When creating Lambda layers with Python:
mkdir -p amplify/layers/myLayer/python
echo "amplify/layers/myLayer/python/" >> .gitignore
pip install -r requirements.txt -t amplify/layers/myLayer/python/
```

### 5. **IDE Configuration**
```bash
# Add IDE-specific ignores:
echo ".vscode/settings.json" >> .gitignore
echo ".idea/" >> .gitignore
```

## Maintenance Commands

### Check Repository Health
```bash
# Count untracked files
git status --porcelain | grep "^??" | wc -l

# List untracked files
git status --porcelain | grep "^??"

# Check repository size
du -sh .git/
```

### Clean Up Accidentally Tracked Files
```bash
# Remove files from git but keep locally
git rm --cached -r amplify/layers/*/python/

# Remove files completely (be careful!)
git clean -fd
```

### Verify .gitignore is Working
```bash
# Test if a file would be ignored
git check-ignore amplify/layers/renewableDemo/python/boto3/

# List all ignored files
git status --ignored
```

## Why This Keeps Occurring

### Common Scenarios
1. **Installing dependencies without updating .gitignore first**
2. **Using new tools/IDEs that create config files**
3. **Build processes that generate artifacts**
4. **Python virtual environments in project directories**

### Prevention Strategy
1. **Always update .gitignore BEFORE installing new dependencies**
2. **Use global gitignore for IDE-specific files**
3. **Regular repository health checks**
4. **Team education on gitignore best practices**

## Global .gitignore Setup (Recommended)

Create a global gitignore for IDE and OS files:

```bash
# Create global gitignore
git config --global core.excludesfile ~/.gitignore_global

# Add common entries
cat >> ~/.gitignore_global << EOF
# IDE
.vscode/
.idea/
*.sublime-project
*.sublime-workspace

# OS
.DS_Store
Thumbs.db
Desktop.ini

# Temporary
*~
*.tmp
*.temp
EOF
```

## Conclusion

The 8,500+ changes were caused by missing `.gitignore` entries for Python packages in Lambda layers. This has been resolved by:

1. ✅ Adding comprehensive `.gitignore` entries
2. ✅ Reducing changes from 8,500+ to 22 legitimate changes
3. ✅ Documenting prevention strategies
4. ✅ Establishing maintenance procedures

**The repository is now clean and manageable.**