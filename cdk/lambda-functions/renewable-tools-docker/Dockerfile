FROM public.ecr.aws/lambda/python:3.12

# Copy and install dependencies from pre-built layer
COPY --from=layer /opt/python /var/task/

# Install dependencies
RUN pip install --no-cache-dir matplotlib>=3.8.0 numpy>=1.26.0 scipy>=1.11.0 boto3 requests

# Copy handler
COPY handler.py ${LAMBDA_TASK_ROOT}/

# Set handler
CMD ["handler.handler"]
