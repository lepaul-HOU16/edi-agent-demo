# Use AWS Lambda Python 3.12 base image
FROM public.ecr.aws/lambda/python:3.12

# Install dependencies
COPY requirements.txt .
RUN pip3 install -r requirements.txt --no-cache-dir

# Copy all Python files
COPY *.py ${LAMBDA_TASK_ROOT}/

# Set the handler
CMD ["handler.handler"]
