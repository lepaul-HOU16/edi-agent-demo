# Use AWS Lambda Python 3.12 base image from Docker Hub
# Force rebuild with platform and security fixes: 2025-01-20-14:30
# Specify platform explicitly to match target architecture
FROM --platform=linux/amd64 amazon/aws-lambda-python:3.12

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy minimal requirements
COPY simulation/requirements.txt ./

# Install essential packages including scipy for NREL Weibull fitting
# Updated versions to address security vulnerabilities
RUN pip3 install --no-cache-dir \
    numpy==1.26.4 \
    scipy==1.12.0 \
    pandas==2.2.0 \
    boto3==1.34.34 \
    requests==2.32.3 \
    plotly==5.18.0 \
    folium==0.15.1 \
    branca==0.7.0 \
    matplotlib==3.8.2 \
    seaborn==0.13.1 \
    aiohttp==3.9.5

# Copy function code from simulation directory
COPY simulation/handler.py ./
COPY simulation/visualization_generator.py ./
COPY simulation/visualization_config.py ./
COPY simulation/matplotlib_generator.py ./
COPY simulation/folium_generator.py ./

# Copy shared modules from parent directory
COPY nrel_wind_client.py ./
COPY plotly_wind_rose_generator.py ./
COPY osm_client.py ./

# Set the handler
CMD [ "handler.handler" ]
