FROM amazon/aws-lambda-python:3.12
# Force rebuild with HTTPS fix: 2025-01-20-13:05

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy requirements.txt
COPY terrain/requirements.txt ./

# Install the specified packages
RUN pip install -r requirements.txt --no-cache-dir

# Copy function code
COPY terrain/handler.py ./
COPY terrain/osm_client.py ./

# Copy shared modules
COPY nrel_wind_client.py ./
COPY visualization_generator.py ./
COPY visualization_config.py ./

# Set the CMD to your handler
CMD [ "handler.handler" ]
