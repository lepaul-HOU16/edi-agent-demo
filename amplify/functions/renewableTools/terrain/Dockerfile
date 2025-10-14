# AWS Lambda Python 3.12 container image
FROM public.ecr.aws/lambda/python:3.12

# Copy requirements from parent directory and install dependencies
COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip3 install -r ${LAMBDA_TASK_ROOT}/requirements.txt --target "${LAMBDA_TASK_ROOT}"

# Copy shared Python modules from parent directory  
COPY *.py ${LAMBDA_TASK_ROOT}/

# Copy terrain-specific handler to root of task directory
COPY terrain/handler.py ${LAMBDA_TASK_ROOT}/handler.py

# Set the Lambda handler
CMD [ "handler.handler" ]
