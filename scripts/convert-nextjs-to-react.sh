#!/bin/bash

# Script to convert Next.js pages to React Router pages
# This handles the common patterns in bulk

echo "Converting Next.js pages to React Router..."

# Function to convert a single page
convert_page() {
    local src_file=$1
    local dest_file=$2
    local page_name=$3
    
    echo "Converting $page_name..."
    
    # Copy the file
    cp "$src_file" "$dest_file"
    
    # Remove 'use client' directive
    sed -i '' "s/'use client';//g" "$dest_file"
    sed -i '' 's/"use client";//g' "$dest_file"
    
    # Replace Next.js router imports
    sed -i '' "s/import { useRouter } from 'next\/navigation'/import { useNavigate } from 'react-router-dom'/g" "$dest_file"
    sed -i '' "s/import { useRouter, useSearchParams } from 'next\/navigation'/import { useNavigate, useSearchParams } from 'react-router-dom'/g" "$dest_file"
    sed -i '' "s/import { useSearchParams } from 'next\/navigation'/import { useSearchParams } from 'react-router-dom'/g" "$dest_file"
    sed -i '' "s/import { useParams } from 'next\/navigation'/import { useParams } from 'react-router-dom'/g" "$dest_file"
    
    # Replace router usage
    sed -i '' 's/const router = useRouter()/const navigate = useNavigate()/g' "$dest_file"
    sed -i '' 's/router\.push(/navigate(/g' "$dest_file"
    sed -i '' 's/router\.replace(/navigate(/g' "$dest_file"
    
    # Replace searchParams usage (Next.js returns object, React Router returns array)
    sed -i '' 's/const searchParams = useSearchParams()/const [searchParams] = useSearchParams()/g' "$dest_file"
    
    echo "✓ Converted $page_name"
}

# Convert collections page
if [ -f "src/app/collections/page.tsx" ]; then
    convert_page "src/app/collections/page.tsx" "src/pages/CollectionsPage.tsx" "CollectionsPage"
fi

# Convert canvases page
if [ -f "src/app/canvases/page.tsx" ]; then
    convert_page "src/app/canvases/page.tsx" "src/pages/CanvasesPage.tsx" "CanvasesPage"
fi

echo "✓ Conversion complete!"
