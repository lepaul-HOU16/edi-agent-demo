"""
Data Analysis Tool Lambda - Example Implementation

Demonstrates:
- CSV data processing with pandas
- Statistical analysis
- Visualization generation with matplotlib
- S3 artifact storage
"""

import json
import os
import boto3
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO, StringIO
from typing import Dict, Any, List
from datetime import datetime

s3_client = boto3.client('s3')
STORAGE_BUCKET = os.environ.get('STORAGE_BUCKET')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for data analysis tool
    
    Args:
        event: Lambda event containing s3Key, analysisType, parameters
        context: Lambda context
        
    Returns:
        Analysis results with visualizations
    """
    try:
        # Parse input
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
        s3_key = body.get('s3Key')
        analysis_type = body.get('analysisType', 'general_analysis')
        parameters = body.get('parameters', {})
        
        if not s3_key:
            return error_response('s3Key is required', 400)
        
        # Load data from S3
        df = load_data_from_s3(s3_key)
        
        # Perform analysis
        result = perform_analysis(df, analysis_type, parameters)
        
        # Generate visualizations
        visualizations = generate_visualizations(df, analysis_type, s3_key)
        
        # Combine results
        response_data = {
            'rowCount': len(df),
            'columnCount': len(df.columns),
            'statistics': result['statistics'],
            'insights': result['insights'],
            'visualizations': visualizations,
            'dataTable': {
                'headers': df.columns.tolist(),
                'rows': df.head(10).values.tolist()
            }
        }
        
        return success_response(response_data)
        
    except Exception as e:
        print(f"Error in data analysis tool: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(str(e), 500)


def load_data_from_s3(s3_key: str) -> pd.DataFrame:
    """
    Load CSV data from S3
    
    Args:
        s3_key: S3 object key
        
    Returns:
        pandas DataFrame
    """
    response = s3_client.get_object(Bucket=STORAGE_BUCKET, Key=s3_key)
    csv_content = response['Body'].read().decode('utf-8')
    df = pd.read_csv(StringIO(csv_content))
    return df


def perform_analysis(df: pd.DataFrame, analysis_type: str, parameters: Dict) -> Dict[str, Any]:
    """
    Perform statistical analysis on data
    
    Args:
        df: pandas DataFrame
        analysis_type: Type of analysis to perform
        parameters: Analysis parameters
        
    Returns:
        Analysis results dictionary
    """
    # Calculate descriptive statistics
    numeric_cols = df.select_dtypes(include=['number']).columns
    statistics = {}
    
    for col in numeric_cols:
        statistics[col] = {
            'mean': float(df[col].mean()),
            'median': float(df[col].median()),
            'std': float(df[col].std()),
            'min': float(df[col].min()),
            'max': float(df[col].max()),
            'count': int(df[col].count()),
            'missing': int(df[col].isna().sum())
        }
    
    # Generate insights based on analysis type
    insights = generate_insights(df, analysis_type, statistics)
    
    return {
        'statistics': statistics,
        'insights': insights
    }


def generate_insights(df: pd.DataFrame, analysis_type: str, statistics: Dict) -> List[str]:
    """
    Generate insights from data analysis
    
    Args:
        df: pandas DataFrame
        analysis_type: Type of analysis
        statistics: Calculated statistics
        
    Returns:
        List of insight strings
    """
    insights = []
    
    # Data quality insights
    total_rows = len(df)
    missing_data = df.isna().sum().sum()
    if missing_data > 0:
        insights.append(f"Dataset contains {missing_data} missing values across all columns")
    
    # Numeric column insights
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) > 0:
        insights.append(f"Found {len(numeric_cols)} numeric columns for analysis")
        
        # Find columns with high variability
        for col in numeric_cols:
            if col in statistics:
                cv = statistics[col]['std'] / statistics[col]['mean'] if statistics[col]['mean'] != 0 else 0
                if cv > 1.0:
                    insights.append(f"{col} shows high variability (CV: {cv:.2f})")
    
    # Categorical column insights
    categorical_cols = df.select_dtypes(include=['object']).columns
    if len(categorical_cols) > 0:
        insights.append(f"Found {len(categorical_cols)} categorical columns")
        for col in categorical_cols:
            unique_count = df[col].nunique()
            if unique_count < 10:
                insights.append(f"{col} has {unique_count} unique categories")
    
    # Analysis-specific insights
    if analysis_type == 'trend_analysis':
        insights.append("Time series analysis shows overall trends in the data")
    elif analysis_type == 'correlation_analysis':
        # Calculate correlations
        corr_matrix = df[numeric_cols].corr()
        high_corr = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                if abs(corr_matrix.iloc[i, j]) > 0.7:
                    high_corr.append(f"{corr_matrix.columns[i]} and {corr_matrix.columns[j]}")
        if high_corr:
            insights.append(f"Strong correlations found between: {', '.join(high_corr)}")
    
    return insights


def generate_visualizations(df: pd.DataFrame, analysis_type: str, s3_key: str) -> List[Dict[str, str]]:
    """
    Generate visualizations and upload to S3
    
    Args:
        df: pandas DataFrame
        analysis_type: Type of analysis
        s3_key: Original data S3 key
        
    Returns:
        List of visualization metadata
    """
    visualizations = []
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    base_key = s3_key.rsplit('/', 1)[0] if '/' in s3_key else 'visualizations'
    
    numeric_cols = df.select_dtypes(include=['number']).columns
    
    # 1. Distribution plots for numeric columns
    if len(numeric_cols) > 0:
        fig, axes = plt.subplots(1, min(3, len(numeric_cols)), figsize=(15, 5))
        if len(numeric_cols) == 1:
            axes = [axes]
        
        for idx, col in enumerate(numeric_cols[:3]):
            axes[idx].hist(df[col].dropna(), bins=30, edgecolor='black')
            axes[idx].set_title(f'Distribution of {col}')
            axes[idx].set_xlabel(col)
            axes[idx].set_ylabel('Frequency')
        
        plt.tight_layout()
        viz_key = f"{base_key}/distribution_{timestamp}.png"
        upload_plot_to_s3(fig, viz_key)
        visualizations.append({
            'title': 'Distribution Analysis',
            'type': 'histogram',
            's3Key': viz_key,
            'url': f"s3://{STORAGE_BUCKET}/{viz_key}"
        })
        plt.close(fig)
    
    # 2. Correlation heatmap
    if len(numeric_cols) > 1:
        fig, ax = plt.subplots(figsize=(10, 8))
        corr_matrix = df[numeric_cols].corr()
        sns.heatmap(corr_matrix, annot=True, fmt='.2f', cmap='coolwarm', ax=ax)
        ax.set_title('Correlation Matrix')
        
        viz_key = f"{base_key}/correlation_{timestamp}.png"
        upload_plot_to_s3(fig, viz_key)
        visualizations.append({
            'title': 'Correlation Analysis',
            'type': 'heatmap',
            's3Key': viz_key,
            'url': f"s3://{STORAGE_BUCKET}/{viz_key}"
        })
        plt.close(fig)
    
    # 3. Box plots for outlier detection
    if len(numeric_cols) > 0:
        fig, ax = plt.subplots(figsize=(12, 6))
        df[numeric_cols].boxplot(ax=ax)
        ax.set_title('Box Plot - Outlier Detection')
        ax.set_ylabel('Value')
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        viz_key = f"{base_key}/boxplot_{timestamp}.png"
        upload_plot_to_s3(fig, viz_key)
        visualizations.append({
            'title': 'Outlier Detection',
            'type': 'boxplot',
            's3Key': viz_key,
            'url': f"s3://{STORAGE_BUCKET}/{viz_key}"
        })
        plt.close(fig)
    
    return visualizations


def upload_plot_to_s3(fig: plt.Figure, s3_key: str) -> None:
    """
    Upload matplotlib figure to S3
    
    Args:
        fig: matplotlib Figure object
        s3_key: S3 object key
    """
    buffer = BytesIO()
    fig.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
    buffer.seek(0)
    
    s3_client.put_object(
        Bucket=STORAGE_BUCKET,
        Key=s3_key,
        Body=buffer.getvalue(),
        ContentType='image/png'
    )


def success_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """Format success response"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data)
    }


def error_response(message: str, status_code: int = 500) -> Dict[str, Any]:
    """Format error response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'error': message
        })
    }


# Example event for testing:
# {
#     "s3Key": "data/sales-2024.csv",
#     "analysisType": "general_analysis",
#     "parameters": {
#         "includeVisualizations": true,
#         "confidenceLevel": 0.95
#     }
# }
