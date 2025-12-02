# Implementation Plan - re:Invent Diagram Updates 2025

## Overview

This implementation plan focuses on updating the re:Invent architecture diagrams to show all AWS services, add OSDU data integration, include AWS Data Catalog, and convert all diagrams to JPG format for presentation use.

## Tasks

- [x] 1. Update existing high-level architecture diagram with all AWS services
  - Update `diagrams/01-high-level-architecture.mmd`
  - Add AWS Glue Data Catalog to the diagram
  - Add AWS Secrets Manager for credential storage
  - Add AWS CloudTrail for audit logging
  - Ensure all 12+ AWS services are clearly labeled
  - Add OSDU as external data source with distinct visual styling
  - Show data flow: OSDU → S3 → Data Catalog → Lambda
  - Highlight OSDU data path with distinct color (#ff6b6b or similar)
  - _Requirements: 1.1-1.12, 2.1-2.7, 3.1-3.6_

- [x] 2. Create enhanced data flow diagram with OSDU and Data Catalog
  - Update `diagrams/06-data-flow-architecture.mmd`
  - Add numbered arrows (1-10) showing request/response sequence
  - Use solid arrows for synchronous operations, dashed for async
  - Show OSDU → S3 (well-data/) → Glue Crawler → Data Catalog
  - Show Lambda querying Data Catalog for metadata
  - Show complete flow: Data Catalog → Lambda → DynamoDB → Frontend
  - Show artifact generation: Lambda → S3 → CloudFront → Frontend
  - Add cost/performance annotations (Lambda timeout/memory, DynamoDB on-demand)
  - _Requirements: 2.1-2.7, 3.1-3.6, 4.1-4.7, 6.1-6.6_

- [x] 3. Install Mermaid CLI and dependencies
  - Install mermaid-cli: `npm install -g @mermaid-js/mermaid-cli`
  - Verify installation: `mmdc --version`
  - Install Puppeteer dependencies if needed
  - Test with existing diagram: `mmdc -i diagrams/01-high-level-architecture.mmd -o test.jpg`
  - _Requirements: All (needed for JPG conversion)_

- [x] 4. Create diagram generation script
  - Create script: `scripts/generate-all-diagrams-jpg.sh`
  - Find all .mmd files in diagrams/ directory
  - Convert each to JPG: `mmdc -i input.mmd -o output.jpg -w 1920 -H 1080 -q 90`
  - Create output directory: `diagrams/output/jpg/`
  - Log generation progress and errors
  - Make script executable: `chmod +x scripts/generate-all-diagrams-jpg.sh`
  - _Requirements: All (JPG conversion automation)_

- [x] 5. Generate all diagrams to JPG format
  - Run generation script: `./scripts/generate-all-diagrams-jpg.sh`
  - Verify JPG files created in `diagrams/output/jpg/`
  - Check file sizes are reasonable (< 2MB each)
  - Verify image dimensions are 1920x1080 or larger
  - Manually review each JPG for readability
  - Verify OSDU data flow is visually highlighted
  - _Requirements: All (final deliverable)_

- [x] 6. Update presentation materials with new diagrams
  - Copy JPG files to `public/demo/diagrams/`
  - Update `presentation/master-deck.html` with new diagram references
  - Add slide for OSDU integration highlighting
  - Add slide for Data Catalog architecture
  - Test presentation in browser
  - _Requirements: All (presentation integration)_

