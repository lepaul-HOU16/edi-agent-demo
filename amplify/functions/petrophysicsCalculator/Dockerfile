FROM --platform=linux/amd64 amazon/aws-lambda-python:3.12

# Build arg for cache busting when code changes
ARG CODE_VERSION=unknown

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy requirements.txt
COPY requirements.txt ./

# Install build tools and packages
# Prefer wheels but allow source builds if needed
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt --no-cache-dir --prefer-binary

# Copy function code
COPY handler.py ./
COPY petrophysics_calculators.py ./
COPY data_quality_assessment.py ./

# Set the CMD to your handler
CMD [ "handler.lambda_handler" ]
