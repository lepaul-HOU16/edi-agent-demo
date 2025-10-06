from strands import tool
import os
import json
import re
from typing import Dict, List, Any
from .storage_utils import load_file_from_storage, save_file_with_storage
from .shared_tools import list_project_files, load_project_data, get_latest_images
import tempfile
from datetime import datetime
import markdown
import weasyprint
import base64
import logging

logger = logging.getLogger(__name__)

# Use shared list_project_files function instead of duplicating code

# Use shared load_project_data function instead of duplicating code

@tool
def save_report(project_id: str, report_content: str, report_type: str = "comprehensive") -> Dict[str, Any]:
    """
    Save a report to the reports directory.
    
    Args:
        project_id (str): unique project identifier
        report_content (str): Complete report content in markdown format
        report_type (str): Type of report (default: "comprehensive")
        
    Returns:
        Dict containing save status and file information
    """
    logger.info(f"Saving {report_type} report for project: {project_id}")
    try:
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"wind_farm_{report_type}_report_{timestamp}.md"
        
        # Save using storage utilities - save in project_id/reports/ folder
        reports_filename = f"reports/{filename}"
        save_file_with_storage(
            report_content,
            project_id,
            reports_filename,
            "text",
            "report_agent"
        )
        
        return {
            'success': True,
            'filename': filename,
            'project_id': project_id,
            'report_type': report_type,
            'message': f"Report saved successfully as {filename}"
        }
        
    except Exception as e:
        logger.error(f"Error saving report: {e}")
        return {
            'success': False,
            'error': f"Failed to save report: {str(e)}"
        }

@tool
def create_pdf_report_with_images(project_id: str, markdown_content: str, image_filenames: List[str] = None) -> Dict[str, Any]:
    """
    Create PDF report with embedded images from project storage.
    
    Args:
        project_id (str): unique project identifier
        markdown_content (str): Complete report content in markdown format
        image_filenames (List[str]): List of image filenames to embed in PDF
        
    Returns:
        Dict containing PDF creation status and file information
    """
    logger.info(f"Creating PDF report with images for project: {project_id}")
    logger.info(f"Image filenames: {image_filenames}")
    try:
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"wind_farm_report_{timestamp}.pdf"
        
        # Download and encode images as base64
        embedded_images = {}
        if image_filenames:
            for img_filename in image_filenames:
                try:
                    # Parse agent folder and filename from full path
                    if '/' in img_filename:
                        agent_folder, file_only = img_filename.split('/', 1)
                    else:
                        agent_folder, file_only = None, img_filename
                    
                    img_path = load_file_from_storage(project_id, file_only, agent_folder)
                    with open(img_path, 'rb') as img_file:
                        img_data = base64.b64encode(img_file.read()).decode()
                        embedded_images[img_filename] = f"data:image/png;base64,{img_data}"
                    logger.debug(f"Embedded image: {img_filename}")
                except Exception as e:
                    logger.warning(f"Could not embed image {img_filename}: {e}")
        
        # Replace image references with base64 embedded images
        def replace_image(match):
            alt_text = match.group(1)
            img_filename = match.group(2)
            if img_filename in embedded_images:
                return f'<img src="{embedded_images[img_filename]}" alt="{alt_text}" style="max-width: 100%; height: auto; margin: 20px 0;">'
            else:
                return f'<p><em>Image not available: {img_filename}</em></p>'
        
        # Convert markdown to HTML with embedded images
        html_with_images = re.sub(r'!\[([^\]]*)\]\(([^\)]+\.png)\)', replace_image, markdown_content)
        html_content = markdown.markdown(html_with_images, extensions=['tables', 'fenced_code'])
        
        # Add CSS styling for professional appearance
        styled_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Wind Farm Report - Project {project_id}</title>
            <style>
                body {{
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    margin: 40px;
                    color: #333;
                }}
                h1 {{
                    color: #1e3a8a;
                    border-bottom: 3px solid #1e3a8a;
                    padding-bottom: 10px;
                }}
                h2 {{
                    color: #1e3a8a;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 5px;
                }}
                h3 {{
                    color: #374151;
                }}
                table {{
                    border-collapse: collapse;
                    width: 100%;
                    margin: 20px 0;
                }}
                th, td {{
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }}
                th {{
                    background-color: #1e3a8a;
                    color: white;
                }}
                img {{
                    max-width: 100%;
                    height: auto;
                    margin: 20px 0;
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                }}
                .executive-summary {{
                    background-color: #f8fafc;
                    padding: 20px;
                    border-left: 4px solid #1e3a8a;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            {html_content}
        </body>
        </html>
        """
        
        # Create PDF using temporary file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            weasyprint.HTML(string=styled_html).write_pdf(temp_file.name)
            temp_filepath = temp_file.name
        
        # Save using storage utilities - save in report_agent folder
        save_file_with_storage(
            temp_filepath,
            project_id,
            filename,
            "file_copy",
            "report_agent"
        )
        
        # Clean up temp file
        os.unlink(temp_filepath)
        
        return {
            'success': True,
            'filename': filename,
            'project_id': project_id,
            'embedded_images': len(embedded_images),
            'message': f"PDF report created successfully as {filename} with {len(embedded_images)} embedded images"
        }
    except Exception as e:
        logger.error(f"Error creating PDF report: {e}")
        return {
            'success': False,
            'error': f"Failed to create PDF report: {str(e)}"
        }

@tool
def save_chart(project_id: str, chart_data: str, filename: str) -> Dict[str, Any]:
    """
    Save a chart/image to project storage.
    
    Args:
        project_id (str): unique project identifier
        chart_data (str): Base64 encoded image data or file path
        filename (str): Name of the chart file (e.g., "financial_projections.png")
        
    Returns:
        Dict containing save status and file information
    """
    logger.info(f"Saving chart: {project_id}/{filename}")
    try:
        
        # Check if chart_data is a file path or base64 data
        if os.path.exists(chart_data):
            # It's a file path, copy the file
            save_file_with_storage(
                chart_data,
                project_id,
                filename,
                "file_copy",
                "report_agent"
            )
        else:
            # It's base64 data, decode and save
            try:
                image_data = base64.b64decode(chart_data)
                save_file_with_storage(
                    image_data,
                    project_id,
                    filename,
                    "bytes",
                    "report_agent"
                )
            except Exception:
                # If base64 decode fails, treat as text content
                save_file_with_storage(
                    chart_data,
                    project_id,
                    filename,
                    "text",
                    "report_agent"
                )
        logger.info(f"Chart saved successfully")
        return {
            'success': True,
            'filename': filename,
            'project_id': project_id,
            'message': f"Chart saved successfully as {filename}"
        }
        
    except Exception as e:
        logger.error(f"Error saving chart: {e}")
        return {
            'success': False,
            'error': f"Failed to save chart: {str(e)}"
        }

# Use shared get_latest_images function instead of duplicating code