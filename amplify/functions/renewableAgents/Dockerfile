# ============================================================================
# STAGE 1: BUILD STAGE - Install dependencies with full Python image
# ============================================================================
FROM python:3.12-slim AS builder

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libgeos-dev \
    libproj-dev \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory for build
WORKDIR /build

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies to a target directory
# Task 9.3: Use --no-cache-dir to minimize size
RUN pip install --no-cache-dir \
    --timeout=300 \
    --target=/build/python \
    -r requirements.txt

# Task 9.2: Pre-compile Python bytecode to reduce import time
RUN python -m compileall /build/python

# ============================================================================
# STAGE 2: RUNTIME STAGE - Minimal runtime image
# ============================================================================
FROM amazon/aws-lambda-python:3.12

# Force rebuild - 2025-10-23-optimized-multi-stage
# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Runtime system dependencies
# Note: geos and proj libraries are bundled in the Python packages from builder stage
# No additional system packages needed for runtime

# Set matplotlib to use non-interactive backend and configure cache directory
ENV MPLCONFIGDIR=/tmp/matplotlib
ENV MPLBACKEND=Agg

# Disable callback handler for production
ENV DISABLE_CALLBACK_HANDLER=1

# Task 9.1: Copy only necessary files from builder stage
COPY --from=builder /build/python ${LAMBDA_TASK_ROOT}

# Copy application code (lightweight, done last for better caching)
COPY BUILD_VERSION.txt .
COPY lambda_handler.py .
COPY __init__.py .
COPY multi_agent.py .
COPY terrain_agent.py .
COPY layout_agent.py .
COPY simulation_agent.py .
COPY report_agent.py .
COPY wind_farm_dev_agent.py .
COPY lazy_imports.py .
COPY cloudwatch_metrics.py .
COPY tools/ ./tools/
COPY MCP_Server/ ./MCP_Server/

# Task 9.2: Pre-compile application Python bytecode
RUN python -m compileall .

# Set the Lambda handler
CMD ["lambda_handler.handler"]
