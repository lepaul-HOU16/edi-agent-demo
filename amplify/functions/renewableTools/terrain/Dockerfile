FROM public.ecr.aws/lambda/python:3.12

# Copy requirements.txt
COPY terrain/requirements.txt .

# Install the specified packages
RUN pip install -r requirements.txt

# Copy function code
COPY terrain/handler.py .
COPY terrain/osm_client.py .
COPY terrain/wind_client.py .

# Copy shared visualization modules
COPY visualization_generator.py .
COPY visualization_config.py .

# Set the CMD to your handler
CMD [ "handler.handler" ]
