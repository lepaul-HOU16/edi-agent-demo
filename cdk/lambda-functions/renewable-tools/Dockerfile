FROM public.ecr.aws/lambda/python:3.12

# Copy requirements first for better caching
COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Copy the complete original tools
COPY agents/ ${LAMBDA_TASK_ROOT}/agents/

# Copy handler
COPY handler.py ${LAMBDA_TASK_ROOT}/

# Set the handler
CMD [ "handler.handler" ]
