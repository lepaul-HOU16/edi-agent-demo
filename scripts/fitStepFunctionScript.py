"""PySpark Step Function Analysis Script.

This script analyzes production data using PySpark to fit step functions
for well production rate analysis.
"""

import os
from datetime import datetime, timedelta

# Core imports with error handling
try:
    from pyspark.sql.functions import (
        input_file_name, regexp_extract, col, to_date, datediff,
        current_date, sum as spark_sum, avg, when
    )
    from pyspark.sql.window import Window
    from pyspark.sql import SparkSession
except ImportError as e:
    print(f"PySpark import error: {e}")
    print("Please install PySpark: pip install pyspark>=3.0.0")
    exit(1)

try:
    import pandas as pd
    import numpy as np
except ImportError as e:
    print(f"Data processing library import error: {e}")
    print("Please install required packages: pip install pandas numpy")
    exit(1)

try:
    import plotly.graph_objects as go
    from plotly.subplots import make_subplots
except ImportError as e:
    print(f"Plotly import error: {e}")
    print("Please install Plotly: pip install plotly>=5.0.0")
    # Note: Plotting is optional, so we don't exit here
    go = None
    make_subplots = None

# Initialize Spark session
spark = SparkSession.builder.appName("StepFunctionAnalysis").getOrCreate()

# Define required variables (these should be set before running the script)
s3_bucket_name = os.environ.get('S3_BUCKET_NAME', 'your-bucket-name-here')

# Create output directories
os.makedirs('data', exist_ok=True)
os.makedirs('plots', exist_ok=True)

base_path = f's3://{s3_bucket_name}/global/production-data/'

production_df = spark.read.format('csv') \
    .option('header', 'true') \
    .option('inferSchema', 'true') \
    .option('recursiveFileLookup', 'true') \
    .option('basePath', base_path) \
    .load(base_path)

# First, let's see what columns we have and a sample of file_path
print("Original columns:", production_df.columns)

print("Adding file_path, api, FirstDayOfMonth, Oil(BBLS), Days P/I, DailyGasRate")
production_df = (production_df
    .withColumn('file_path', input_file_name())
    .withColumn('api', regexp_extract(col('file_path'), 'api=(\\d+)', 1))
    .withColumn('FirstDayOfMonth', to_date('FirstDayOfMonth', 'yyyy-MM-dd'))
    .withColumn('Oil(BBLS)', col('Oil(BBLS)').cast('double'))
    .withColumn('Days P/I', col('Days P/I').cast('int'))
    .withColumn('DailyGasRate',
        when(
            (col('Days P/I').isNotNull() & (col('Days P/I') > 0) &
             col('Gas(MCF)').isNotNull()),
            col('Gas(MCF)') / col('Days P/I')
        ).otherwise(0.0)
    )
)
print(production_df.printSchema())

# Filter for last 5 years and remove cumulative rows
five_years_ago = (datetime.now() - timedelta(days=5*365)).strftime('%Y-%m-%d')
production_df = production_df.where(
    (col('FirstDayOfMonth') >= five_years_ago) &
    (~col('Year').contains('Cum'))
)

# Calculate daily gas rate and ensure it's not null
production_df = production_df.withColumn(
    'DailyGasRate',
    when(
        (col('Days P/I').isNotNull() & (col('Days P/I') > 0) &
         col('Gas(MCF)').isNotNull()),
        col('Gas(MCF)') / col('Days P/I')
    ).otherwise(0.0)
)

# Print sample of data to verify calculations
print("\nSample of production data with gas rates:")
production_df.select('api', 'FirstDayOfMonth', 'Gas(MCF)', 'Days P/I',
                    'DailyGasRate').show(5)

def fit_step_function(pdf):
    """Fit step function to production data for a single well."""
    if len(pdf) < 2:  # Need at least 2 points to fit a step
        return pd.DataFrame({
            'api': [pdf['api'].iloc[0]],
            'initial_rate': [0.0],
            'step_date': [pdf['FirstDayOfMonth'].iloc[0]],
            'final_rate': [0.0],
            'rate_drop': [0.0],
            'fit_error': [float('inf')]
        })
    
    # Sort by date
    pdf = pdf.sort_values('FirstDayOfMonth')
    
    # Get production rates and remove any NaN values
    rates = (pdf['DailyGasRate']
            .replace([np.inf, -np.inf], np.nan)
            .fillna(0)
            .values)
    dates = pdf['FirstDayOfMonth'].values
    
    if np.all(rates == 0):
        return pd.DataFrame({
            'api': [pdf['api'].iloc[0]],
            'initial_rate': [0.0],
            'step_date': [dates[0]],
            'final_rate': [0.0],
            'rate_drop': [0.0],
            'fit_error': [0.0]
        })
    
    best_fit = None
    min_error = float('inf')
    
    # Try each date as a potential step point
    for i in range(1, len(dates)-1):
        initial_rate = np.median(rates[:i])
        final_rate = np.median(rates[i:])
        step_date = dates[i]
        rate_drop = initial_rate - final_rate
        
        # Calculate error
        predicted = np.where(dates < step_date, initial_rate, final_rate)
        error = np.sum((rates - predicted) ** 2)
        
        if error < min_error:
            min_error = error
            best_fit = {
                'api': [pdf['api'].iloc[0]],
                'initial_rate': [float(initial_rate)],
                'step_date': [step_date],
                'final_rate': [float(final_rate)],
                'rate_drop': [float(rate_drop)],
                'fit_error': [float(error)]
            }
    
    if best_fit is None:  # If no fit was found
        rate_drop = float(rates[0] - rates[-1])
        best_fit = {
            'api': [pdf['api'].iloc[0]],
            'initial_rate': [float(rates[0])],
            'step_date': [dates[0]],
            'final_rate': [float(rates[-1])],
            'rate_drop': [rate_drop],
            'fit_error': [float('inf')]
        }
    
    return pd.DataFrame(best_fit)

# Group by API and fit step function
step_function_fit_df = production_df.groupBy('api').applyInPandas(
    fit_step_function, 
    schema="""
        api string,
        initial_rate double,
        step_date date,
        final_rate double,
        rate_drop double,
        fit_error double
    """
)

# Show results sorted by rate drop (largest drops first)
print("\nStep Function Fits for Each Well (Gas Rates), "
      "Sorted by Largest Rate Drops:")
step_function_fit_df.orderBy(col('rate_drop').desc()).show(10,
                                                          truncate=False)

# Create data directory if it doesn't exist
data_dir = 'data'
if not os.path.exists(data_dir):
    os.makedirs(data_dir)

# Save the step function fits to CSV
csv_path = os.path.join(data_dir, 'step_function_fit_df.csv')
step_function_fit_df.toPandas().to_csv(csv_path, index=False)
print(f"\nStep function fits saved to: {csv_path}")

# Stop Spark session
spark.stop()
