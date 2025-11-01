#!/bin/bash
set -e

echo "Building Lambda Layer for Catalog Search..."

# Clean previous build
rm -rf python/
mkdir -p python

# Install dependencies to python/ directory using uv
# Lambda layers expect packages in python/ or python/lib/python3.x/site-packages/
uv pip install -r ../../functions/catalogSearch/requirements.txt --target python/ --python-platform aarch64-manylinux2014 --python-version 3.12

echo "Lambda layer built successfully in python/ directory"
echo "Contents:"
ls -la python/
