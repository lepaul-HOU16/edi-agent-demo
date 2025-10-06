"""
Report Generation Tool Lambda
Generates executive reports from analysis results
"""
import json
import sys
import os
import logging

# Add renewable demo code to Python path
sys.path.insert(0, '/opt/python/renewable-demo')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        
        # Build report HTML
        report_html = f"""
        <html>
        <head>
            <title>Wind Farm Development Report - {project_id}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                h1 {{ color: #2c3e50; }}
                h2 {{ color: #34495e; margin-top: 30px; }}
                .summary {{ background: #ecf0f1; padding: 20px; border-radius: 5px; }}
                .recommendations {{ background: #e8f5e9; padding: 20px; border-radius: 5px; }}
                ul {{ line-height: 1.8; }}
            </style>
        </head>
        <body>
            <h1>Wind Farm Development Report</h1>
            <p><strong>Project ID:</strong> {project_id}</p>
            
            <h2>Executive Summary</h2>
            <div class="summary">
                <p>{executive_summary}</p>
            </div>
            
            <h2>Recommendations</h2>
            <div class="recommendations">
                <ul>
                    {"".join([f"<li>{rec}</li>" for rec in recommendations])}
                </ul>
            </div>
            
            <h2>Next Steps</h2>
            <ul>
                <li>Conduct detailed site surveys</li>
                <li>Engage with local stakeholders and regulatory authorities</li>
                <li>Develop detailed project timeline and budget</li>
                <li>Secure necessary permits and approvals</li>
            </ul>
        </body>
        </html>
        """
        
        logger.info(f"Report generated successfully")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'type': 'report_generation',
                'data': {
                    'projectId': project_id,
                    'executiveSummary': executive_summary,
                    'recommendations': recommendations,
                    'reportHtml': report_html,
                    'message': 'Report generated successfully'
                }
            })
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
