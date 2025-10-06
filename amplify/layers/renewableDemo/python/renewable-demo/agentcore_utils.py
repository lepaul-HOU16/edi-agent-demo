# Wrapper for agent_core/utils.py to match notebook imports

from agent_core.utils import (
    create_lambda_function,
    create_agentcore_gateway_role,
    setup_cognito_user_pool,
    create_agentcore_runtime_role,
    build_and_push_image,  # Original function name
    list_agentcore_resources
)

# Create alias for the notebook's expected name
build_and_push_image_runtime = build_and_push_image

# Export all functions
__all__ = [
    'create_lambda_function',
    'create_agentcore_gateway_role',
    'setup_cognito_user_pool',
    'create_agentcore_runtime_role',
    'build_and_push_image_runtime',  # Aliased name
    'list_agentcore_resources'
]

