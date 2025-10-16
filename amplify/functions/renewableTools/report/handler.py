"""
Report Generation Tool Lambda
Generates executive reports from analysis results
"""
import json
import sys
import os
import logging
import boto3
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize S3 client
s3_client = boto3.client('s3')
S3_BUCKET = os.environ.get('S3_BUCKET', os.environ.get('RENEWABLE_S3_BUCKET', 'amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy'))

def handler(event, context):
    """
    Lambda handler for report generation
    
    Expected event structure:
    {
        "query": "user query string",
        "parameters": {
            "project_id": str,
            "terrain_results": dict (optional),
            "layout_results": dict (optional),
            "simulation_results": dict (optional)
        }
    }
    """
    try:
        logger.info(f"Report generation Lambda invoked")
        
        # Extract parameters
        params = event.get('parameters', {})
        project_id = params.get('project_id', 'default-project')
        terrain_results = params.get('terrain_results', {})
        layout_results = params.get('layout_results', {})
        simulation_results = params.get('simulation_results', {})
        
        logger.info(f"Generating report for project {project_id}")
        
        # Build executive summary
        summary_parts = []
        
        if terrain_results:
            exclusion_count = terrain_results.get('metrics', {}).get('totalFeatures', 0)
            summary_parts.append(f"Terrain analysis identified {exclusion_count} exclusion zones.")
        
        if layout_results:
            turbine_count = layout_results.get('turbineCount', 0)
            total_capacity = layout_results.get('totalCapacity', 0)
            summary_parts.append(f"Layout design includes {turbine_count} turbines with {total_capacity:.1f} MW total capacity.")
        
        if simulation_results:
            aep = simulation_results.get('performanceMetrics', {}).get('annualEnergyProduction', 0)
            cf = simulation_results.get('performanceMetrics', {}).get('capacityFactor', 0)
            summary_parts.append(f"Performance simulation estimates {aep:.1f} GWh annual production with {cf:.1%} capacity factor.")
        
        executive_summary = " ".join(summary_parts) if summary_parts else "Project analysis in progress."
        
        # Generate recommendations
        recommendations = []
        
        if terrain_results:
            recommendations.append("Review exclusion zones to ensure regulatory compliance")
            recommendations.append("Consider environmental impact assessments for identified constraints")
        
        if layout_results:
            recommendations.append("Optimize turbine spacing based on prevailing wind patterns")
            recommendations.append("Conduct detailed geotechnical surveys at turbine locations")
        
        if simulation_results:
            wake_losses = simulation_results.get('performanceMetrics', {}).get('wakeLosses', 0)
            if wake_losses > 10:
                recommendations.append(f"Wake losses of {wake_losses:.1f}% are high - consider layout optimization")
            recommendations.append("Validate wind resource data with on-site measurements")
            recommendations.append("Develop detailed financial model based on performance estimates")
        
        # Collect visualization URLs from results
        visualizations = {}
        
        if terrain_results:
            terrain_map_url = terrain_results.get('mapUrl')
            if terrain_map_url:
                visualizations['terrain_map'] = terrain_map_url
        
        if layout_results:
            layout_map_url = layout_results.get('mapUrl')
            if layout_map_url:
                visualizations['layout_map'] = layout_map_url
        
        if simulation_results:
            wake_map_url = simulation_results.get('mapUrl')
            if wake_map_url:
                visualizations['wake_heat_map'] = wake_map_url
            
            # Check for wind rose if available
            wind_rose_url = simulation_results.get('windRoseUrl')
            if wind_rose_url:
                visualizations['wind_rose'] = wind_rose_url
        
        # Build comprehensive report HTML with embedded visualizations
        viz_sections = ""
        
        if 'terrain_map' in visualizations:
            viz_sections += f"""
            <h2>Terrain Analysis</h2>
            <div class="visualization">
                <iframe src="{visualizations['terrain_map']}" width="100%" height="600px" frameborder="0"></iframe>
                <p class="caption">Interactive terrain map showing exclusion zones and constraints</p>
            </div>
            """
        
        if 'layout_map' in visualizations:
            viz_sections += f"""
            <h2>Turbine Layout</h2>
            <div class="visualization">
                <iframe src="{visualizations['layout_map']}" width="100%" height="600px" frameborder="0"></iframe>
                <p class="caption">Wind farm layout with turbine positions</p>
            </div>
            """
        
        if 'wind_rose' in visualizations:
            viz_sections += f"""
            <h2>Wind Resource Analysis</h2>
            <div class="visualization">
                <img src="{visualizations['wind_rose']}" width="100%" style="max-width: 800px;" alt="Wind Rose">
                <p class="caption">Wind rose showing directional wind speed distribution</p>
            </div>
            """
        
        if 'wake_heat_map' in visualizations:
            viz_sections += f"""
            <h2>Wake Analysis</h2>
            <div class="visualization">
                <iframe src="{visualizations['wake_heat_map']}" width="100%" height="600px" frameborder="0"></iframe>
                <p class="caption">Wake interaction heat map showing turbine performance impacts</p>
            </div>
            """
        
        # Generate timestamp
        report_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        
        report_html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Wind Farm Development Report - {project_id}</title>
    <meta charset="utf-8">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #34495e;
            margin-top: 40px;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            margin: -40px -40px 40px -40px;
            border-radius: 5px 5px 0 0;
        }}
        .header h1 {{
            margin: 0;
            color: white;
            border: none;
        }}
        .metadata {{
            color: rgba(255,255,255,0.9);
            margin-top: 10px;
        }}
        .summary {{
            background: #ecf0f1;
            padding: 25px;
            border-radius: 8px;
            border-left: 5px solid #3498db;
            margin: 20px 0;
        }}
        .recommendations {{
            background: #e8f5e9;
            padding: 25px;
            border-radius: 8px;
            border-left: 5px solid #27ae60;
            margin: 20px 0;
        }}
        .metrics {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .metric-card {{
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .metric-card h3 {{
            margin: 0 0 10px 0;
            color: #7f8c8d;
            font-size: 14px;
            text-transform: uppercase;
        }}
        .metric-card .value {{
            font-size: 32px;
            font-weight: bold;
            color: #2c3e50;
        }}
        .metric-card .unit {{
            font-size: 16px;
            color: #7f8c8d;
        }}
        ul {{
            line-height: 2;
        }}
        .visualization {{
            margin: 30px 0;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }}
        .caption {{
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
            margin: 10px 0;
        }}
        .footer {{
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #7f8c8d;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Wind Farm Development Report</h1>
            <div class="metadata">
                <strong>Project ID:</strong> {project_id}<br>
                <strong>Report Generated:</strong> {report_date}
            </div>
        </div>
        
        <h2>Executive Summary</h2>
        <div class="summary">
            <p>{executive_summary}</p>
        </div>
        
        <h2>Key Metrics</h2>
        <div class="metrics">
"""
        
        # Add metric cards based on available data
        if layout_results:
            turbine_count = layout_results.get('turbineCount', 0)
            total_capacity = layout_results.get('totalCapacity', 0)
            report_html += f"""
            <div class="metric-card">
                <h3>Turbine Count</h3>
                <div class="value">{turbine_count}</div>
            </div>
            <div class="metric-card">
                <h3>Total Capacity</h3>
                <div class="value">{total_capacity:.1f} <span class="unit">MW</span></div>
            </div>
"""
        
        if simulation_results:
            aep = simulation_results.get('performanceMetrics', {}).get('annualEnergyGWh', 0)
            cf = simulation_results.get('performanceMetrics', {}).get('capacityFactor', 0)
            wake_loss = simulation_results.get('performanceMetrics', {}).get('wakeLossPercent', 0)
            report_html += f"""
            <div class="metric-card">
                <h3>Annual Energy Production</h3>
                <div class="value">{aep:.1f} <span class="unit">GWh</span></div>
            </div>
            <div class="metric-card">
                <h3>Capacity Factor</h3>
                <div class="value">{cf*100:.1f} <span class="unit">%</span></div>
            </div>
            <div class="metric-card">
                <h3>Wake Losses</h3>
                <div class="value">{wake_loss:.1f} <span class="unit">%</span></div>
            </div>
"""
        
        report_html += """
        </div>
        
"""
        
        # Add visualization sections
        report_html += viz_sections
        
        # Add recommendations
        report_html += f"""
        <h2>Recommendations</h2>
        <div class="recommendations">
            <ul>
                {"".join([f"<li>{rec}</li>" for rec in recommendations])}
            </ul>
        </div>
        
        <h2>Next Steps</h2>
        <ul>
            <li>Conduct detailed site surveys and geotechnical investigations</li>
            <li>Engage with local stakeholders and regulatory authorities</li>
            <li>Develop detailed project timeline and budget</li>
            <li>Secure necessary permits and approvals</li>
            <li>Finalize turbine selection and procurement strategy</li>
            <li>Develop construction and commissioning plan</li>
        </ul>
        
        <div class="footer">
            <p>This report was automatically generated by the Wind Farm Development System</p>
            <p>Project ID: {project_id} | Generated: {report_date}</p>
        </div>
    </div>
</body>
</html>
"""
        
        # Save report HTML to S3
        report_key = f'renewable/report/{project_id}/report.html'
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=report_key,
            Body=report_html.encode('utf-8'),
            ContentType='text/html',
            CacheControl='max-age=3600'
        )
        
        report_url = f'https://{S3_BUCKET}.s3.amazonaws.com/{report_key}'
        logger.info(f"✅ Saved report to S3: {report_url}")
        
        # Also save report data as JSON
        report_data = {
            'project_id': project_id,
            'generated_at': report_date,
            'executive_summary': executive_summary,
            'recommendations': recommendations,
            'visualizations': visualizations,
            'terrain_results': terrain_results,
            'layout_results': layout_results,
            'simulation_results': simulation_results
        }
        
        data_key = f'renewable/report/{project_id}/report_data.json'
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=data_key,
            Body=json.dumps(report_data),
            ContentType='application/json'
        )
        
        logger.info(f"📦 Saved report data to S3: s3://{S3_BUCKET}/{data_key}")
        logger.info(f"✅ Report generated successfully")
        
        return {
            'success': True,
            'type': 'report_generation',
            'data': {
                'messageContentType': 'wind_farm_report',
                'title': f'Wind Farm Development Report - {project_id}',
                'subtitle': f'Comprehensive analysis report generated {report_date}',
                'projectId': project_id,
                'executiveSummary': executive_summary,
                'recommendations': recommendations,
                'reportUrl': report_url,
                'reportHtml': report_html,
                'visualizations': visualizations,
                's3Data': {
                    'bucket': S3_BUCKET,
                    'reportKey': report_key,
                    'dataKey': data_key,
                    'reportUrl': report_url,
                    'dataUrl': f'https://{S3_BUCKET}.s3.amazonaws.com/{data_key}'
                },
                'message': 'Comprehensive report generated successfully'
            }
        }
            
    except Exception as e:
        logger.error(f"Error in report generation Lambda: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': f'Lambda execution error: {str(e)}'
            })
        }
