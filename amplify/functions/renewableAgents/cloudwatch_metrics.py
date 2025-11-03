"""
CloudWatch Custom Metrics Publisher for Strands Agent Performance Monitoring

Task 11.1: Publish custom metrics for cold/warm starts, memory usage, and timeout rate
Requirements: 7.1, 7.2, 7.3
"""
import logging
import boto3
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# CloudWatch client (singleton)
_cloudwatch_client = None


def get_cloudwatch_client():
    """Get or create CloudWatch client (singleton pattern)"""
    global _cloudwatch_client
    if _cloudwatch_client is None:
        _cloudwatch_client = boto3.client('cloudwatch')
    return _cloudwatch_client


def publish_cold_start_metric(duration_seconds: float, agent_type: str):
    """
    Publish ColdStartDuration metric to CloudWatch
    
    Args:
        duration_seconds: Cold start duration in seconds
        agent_type: Type of agent (terrain, layout, simulation, report)
    """
    try:
        cloudwatch = get_cloudwatch_client()
        
        cloudwatch.put_metric_data(
            Namespace='StrandsAgent/Performance',
            MetricData=[
                {
                    'MetricName': 'ColdStartDuration',
                    'Value': duration_seconds,
                    'Unit': 'Seconds',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'AgentType',
                            'Value': agent_type
                        },
                        {
                            'Name': 'StartType',
                            'Value': 'Cold'
                        }
                    ]
                }
            ]
        )
        
        logger.info(f"📊 Published ColdStartDuration metric: {duration_seconds:.2f}s for {agent_type}")
        
    except Exception as e:
        # Don't fail the request if metrics fail
        logger.error(f"Failed to publish ColdStartDuration metric: {e}", exc_info=True)


def publish_warm_start_metric(duration_seconds: float, agent_type: str):
    """
    Publish WarmStartDuration metric to CloudWatch
    
    Args:
        duration_seconds: Warm start duration in seconds
        agent_type: Type of agent (terrain, layout, simulation, report)
    """
    try:
        cloudwatch = get_cloudwatch_client()
        
        cloudwatch.put_metric_data(
            Namespace='StrandsAgent/Performance',
            MetricData=[
                {
                    'MetricName': 'WarmStartDuration',
                    'Value': duration_seconds,
                    'Unit': 'Seconds',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'AgentType',
                            'Value': agent_type
                        },
                        {
                            'Name': 'StartType',
                            'Value': 'Warm'
                        }
                    ]
                }
            ]
        )
        
        logger.info(f"📊 Published WarmStartDuration metric: {duration_seconds:.2f}s for {agent_type}")
        
    except Exception as e:
        # Don't fail the request if metrics fail
        logger.error(f"Failed to publish WarmStartDuration metric: {e}", exc_info=True)


def publish_memory_used_metric(memory_mb: float, agent_type: str):
    """
    Publish MemoryUsed metric to CloudWatch
    
    Args:
        memory_mb: Peak memory usage in MB
        agent_type: Type of agent (terrain, layout, simulation, report)
    """
    try:
        cloudwatch = get_cloudwatch_client()
        
        cloudwatch.put_metric_data(
            Namespace='StrandsAgent/Performance',
            MetricData=[
                {
                    'MetricName': 'MemoryUsed',
                    'Value': memory_mb,
                    'Unit': 'Megabytes',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'AgentType',
                            'Value': agent_type
                        }
                    ]
                }
            ]
        )
        
        logger.info(f"📊 Published MemoryUsed metric: {memory_mb:.2f} MB for {agent_type}")
        
    except Exception as e:
        # Don't fail the request if metrics fail
        logger.error(f"Failed to publish MemoryUsed metric: {e}", exc_info=True)


def publish_timeout_metric(timed_out: bool, agent_type: str):
    """
    Publish TimeoutOccurred metric to CloudWatch
    
    This metric tracks individual timeout events. The TimeoutRate alarm
    will calculate the percentage based on this metric.
    
    Args:
        timed_out: Whether a timeout occurred (True) or not (False)
        agent_type: Type of agent (terrain, layout, simulation, report)
    """
    try:
        cloudwatch = get_cloudwatch_client()
        
        # Publish 1 for timeout, 0 for success
        metric_value = 1.0 if timed_out else 0.0
        
        cloudwatch.put_metric_data(
            Namespace='StrandsAgent/Performance',
            MetricData=[
                {
                    'MetricName': 'TimeoutOccurred',
                    'Value': metric_value,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'AgentType',
                            'Value': agent_type
                        }
                    ]
                }
            ]
        )
        
        status = "timeout" if timed_out else "success"
        logger.info(f"📊 Published TimeoutOccurred metric: {status} for {agent_type}")
        
    except Exception as e:
        # Don't fail the request if metrics fail
        logger.error(f"Failed to publish TimeoutOccurred metric: {e}", exc_info=True)


def publish_invocation_metric(agent_type: str):
    """
    Publish InvocationCount metric to CloudWatch
    
    This metric tracks total invocations for calculating timeout rate.
    
    Args:
        agent_type: Type of agent (terrain, layout, simulation, report)
    """
    try:
        cloudwatch = get_cloudwatch_client()
        
        cloudwatch.put_metric_data(
            Namespace='StrandsAgent/Performance',
            MetricData=[
                {
                    'MetricName': 'InvocationCount',
                    'Value': 1.0,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'AgentType',
                            'Value': agent_type
                        }
                    ]
                }
            ]
        )
        
        logger.info(f"📊 Published InvocationCount metric for {agent_type}")
        
    except Exception as e:
        # Don't fail the request if metrics fail
        logger.error(f"Failed to publish InvocationCount metric: {e}", exc_info=True)


def publish_dependency_load_time_metric(dependency_name: str, load_time: float, agent_type: str):
    """
    Publish DependencyLoadTime metric to CloudWatch
    
    Task 10: Track individual dependency loading times for cold start optimization
    
    Args:
        dependency_name: Name of the dependency (boto3, psutil, agents, etc.)
        load_time: Time taken to load the dependency in seconds
        agent_type: Type of agent (terrain, layout, simulation, report)
    """
    try:
        cloudwatch = get_cloudwatch_client()
        
        cloudwatch.put_metric_data(
            Namespace='StrandsAgent/Performance',
            MetricData=[
                {
                    'MetricName': 'DependencyLoadTime',
                    'Value': load_time,
                    'Unit': 'Seconds',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'AgentType',
                            'Value': agent_type
                        },
                        {
                            'Name': 'Dependency',
                            'Value': dependency_name
                        }
                    ]
                }
            ]
        )
        
        logger.info(f"📊 Published DependencyLoadTime metric: {dependency_name}={load_time:.3f}s for {agent_type}")
        
    except Exception as e:
        # Don't fail the request if metrics fail
        logger.error(f"Failed to publish DependencyLoadTime metric: {e}", exc_info=True)


def publish_all_performance_metrics(
    is_cold_start: bool,
    execution_time: float,
    memory_mb: float,
    agent_type: str,
    timed_out: bool = False
):
    """
    Publish all performance metrics in a single call
    
    Args:
        is_cold_start: Whether this was a cold start
        execution_time: Total execution time in seconds
        memory_mb: Peak memory usage in MB
        agent_type: Type of agent (terrain, layout, simulation, report)
        timed_out: Whether the invocation timed out
    """
    # Publish invocation count
    publish_invocation_metric(agent_type)
    
    # Publish start type metric
    if is_cold_start:
        publish_cold_start_metric(execution_time, agent_type)
    else:
        publish_warm_start_metric(execution_time, agent_type)
    
    # Publish memory metric
    if memory_mb > 0:
        publish_memory_used_metric(memory_mb, agent_type)
    
    # Publish timeout metric
    publish_timeout_metric(timed_out, agent_type)
    
    logger.info(f"📊 Published all performance metrics for {agent_type} agent")
