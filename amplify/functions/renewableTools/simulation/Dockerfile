# AWS Lambda Python 3.12 container image
FROM public.ecr.aws/lambda/python:3.12

# Install dependencies to Lambda's site-packages
COPY simulation/requirements.txt .
RUN python3.12 -m pip install --no-cache-dir -r requirements.txt

# Copy code
COPY *.py ${LAMBDA_TASK_ROOT}/
COPY simulation/handler.py ${LAMBDA_TASK_ROOT}/handler.py

# Handler
CMD ["handler.handler"]
