FROM public.ecr.aws/lambda/python:3.12

# Copy requirements and install dependencies
COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install -r requirements.txt

# Copy function code
COPY wind_farm_mcp_server.py ${LAMBDA_TASK_ROOT}

CMD ["wind_farm_mcp_server.lambda_handler"]