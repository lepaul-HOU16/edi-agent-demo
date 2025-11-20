#!/usr/bin/env node

/**
 * Generate HTML preview files for Mermaid diagrams
 * This allows viewing diagrams in a browser without installing mermaid-cli
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const DIAGRAMS_DIR = path.join(SCRIPT_DIR, '../diagrams');
const OUTPUT_DIR = path.join(SCRIPT_DIR, '../output/html');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎨 Generating HTML preview files for Mermaid diagrams...\n');

// HTML template with Mermaid.js
const htmlTemplate = (title, mermaidCode) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Architecture Diagram</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1920px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #232f3e;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #545b64;
            margin-bottom: 30px;
        }
        .diagram-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            background: white;
        }
        .actions {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            margin-right: 10px;
            background: #ff9900;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
        }
        .btn:hover {
            background: #ec7211;
        }
        .instructions {
            margin-top: 20px;
            padding: 15px;
            background: #f0f8ff;
            border-left: 4px solid #ff9900;
            border-radius: 4px;
        }
        .instructions h3 {
            margin-top: 0;
            color: #232f3e;
        }
        .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .instructions li {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <p class="subtitle">AWS Energy Data Insights Platform - Architecture Diagram</p>
        
        <div class="diagram-container">
            <div class="mermaid">
${mermaidCode}
            </div>
        </div>
        
        <div class="actions">
            <a href="#" class="btn" onclick="exportSVG(); return false;">Export as SVG</a>
            <a href="#" class="btn" onclick="exportPNG(); return false;">Export as PNG</a>
            <a href="index.html" class="btn" style="background: #545b64;">Back to Index</a>
        </div>
        
        <div class="instructions">
            <h3>📥 How to Export High-Resolution Diagrams</h3>
            <ol>
                <li><strong>For PNG (Recommended for Presentations):</strong>
                    <ul>
                        <li>Right-click on the diagram</li>
                        <li>Select "Inspect" or "Inspect Element"</li>
                        <li>Find the SVG element in the inspector</li>
                        <li>Right-click the SVG and "Copy" → "Copy outerHTML"</li>
                        <li>Paste into an SVG editor or use online converter</li>
                        <li>Export as PNG at 1920x1080 or higher</li>
                    </ul>
                </li>
                <li><strong>For SVG (Vector Format):</strong>
                    <ul>
                        <li>Click "Export as SVG" button above</li>
                        <li>Or right-click diagram → "Save image as..."</li>
                        <li>Choose SVG format</li>
                    </ul>
                </li>
                <li><strong>Alternative: Use Mermaid Live Editor:</strong>
                    <ul>
                        <li>Visit <a href="https://mermaid.live/" target="_blank">mermaid.live</a></li>
                        <li>Copy the diagram code from this page</li>
                        <li>Paste into the editor</li>
                        <li>Use "Actions" → "Export PNG/SVG/PDF"</li>
                        <li>Set resolution to 1920x1080 or higher</li>
                    </ul>
                </li>
            </ol>
        </div>
    </div>
    
    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            themeVariables: {
                primaryColor: '#ff9900',
                primaryTextColor: '#232f3e',
                primaryBorderColor: '#232f3e',
                lineColor: '#545b64',
                secondaryColor: '#ec7211',
                tertiaryColor: '#ffffff'
            },
            flowchart: {
                curve: 'basis',
                padding: 20
            },
            sequence: {
                actorMargin: 50,
                boxMargin: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35
            }
        });
        
        function exportSVG() {
            const svg = document.querySelector('.mermaid svg');
            if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const blob = new Blob([svgData], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = '${title.toLowerCase().replace(/\\s+/g, '-')}.svg';
                a.click();
                URL.revokeObjectURL(url);
            }
        }
        
        function exportPNG() {
            alert('To export as PNG:\\n\\n1. Right-click on the diagram\\n2. Select "Save image as..."\\n3. Or use browser screenshot tools\\n4. Or copy to image editor and export\\n\\nFor high-resolution PNG, use Mermaid Live Editor (see instructions below).');
        }
    </script>
</body>
</html>`;

// Index page template
const indexTemplate = (diagrams) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Architecture Diagrams - AWS Energy Data Insights</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #232f3e;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #545b64;
            margin-bottom: 30px;
        }
        .diagram-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .diagram-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        .diagram-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        .diagram-card h3 {
            color: #232f3e;
            margin-top: 0;
        }
        .diagram-card p {
            color: #545b64;
            font-size: 14px;
            line-height: 1.6;
        }
        .diagram-card a {
            display: inline-block;
            margin-top: 10px;
            padding: 8px 16px;
            background: #ff9900;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
        }
        .diagram-card a:hover {
            background: #ec7211;
        }
        .info-box {
            background: #f0f8ff;
            border-left: 4px solid #ff9900;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
        }
        .info-box h2 {
            margin-top: 0;
            color: #232f3e;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Architecture Diagrams</h1>
        <p class="subtitle">AWS Energy Data Insights Platform - AWS re:Invent Chalk Talk</p>
        
        <div class="info-box">
            <h2>📊 Available Diagrams</h2>
            <p>Click on any diagram below to view it in your browser. Each diagram can be exported as SVG or PNG for use in presentations.</p>
        </div>
        
        <div class="diagram-grid">
${diagrams.map(d => `
            <div class="diagram-card">
                <h3>${d.title}</h3>
                <p>${d.description}</p>
                <a href="${d.filename}">View Diagram →</a>
            </div>
`).join('')}
        </div>
        
        <div class="info-box" style="margin-top: 40px;">
            <h2>🚀 Quick Start</h2>
            <ol>
                <li>Click on a diagram to view it</li>
                <li>Use the export buttons to save as SVG or PNG</li>
                <li>For high-resolution exports, use <a href="https://mermaid.live/" target="_blank">Mermaid Live Editor</a></li>
                <li>Add AWS service icons using PowerPoint or Draw.io</li>
            </ol>
        </div>
    </div>
</body>
</html>`;

// Read all Mermaid files
const files = fs.readdirSync(DIAGRAMS_DIR).filter(f => f.endsWith('.mmd'));

const diagramInfo = [
  { file: '01-high-level-architecture.mmd', title: 'High-Level Architecture', description: 'Complete system architecture showing all AWS services and their interactions' },
  { file: '02-authentication-flow.mmd', title: 'Authentication Flow', description: 'Detailed sequence diagram of user authentication and JWT validation' },
  { file: '03-agent-routing-flow.mmd', title: 'Agent Routing Flow', description: 'Shows how user queries are routed to specialized agents' },
  { file: '04-async-processing-pattern.mmd', title: 'Async Processing Pattern', description: 'Illustrates the fire-and-forget pattern for long-running analyses' },
  { file: '05-multi-agent-orchestration.mmd', title: 'Multi-Agent Orchestration', description: 'Hierarchical agent architecture with specialized agents' },
  { file: '06-data-flow-architecture.mmd', title: 'Data Flow Architecture', description: 'End-to-end data flow from user to response' },
  { file: '07-chalk-talk-simple.mmd', title: 'Chalk Talk Simple', description: 'Simplified diagram with hand-drawn aesthetic for live presentations' }
];

const generatedDiagrams = [];

// Generate HTML for each diagram
files.forEach(file => {
  const filePath = path.join(DIAGRAMS_DIR, file);
  const mermaidCode = fs.readFileSync(filePath, 'utf8');
  const baseName = path.basename(file, '.mmd');
  const info = diagramInfo.find(d => d.file === file) || { title: baseName, description: 'Architecture diagram' };
  
  const html = htmlTemplate(info.title, mermaidCode);
  const outputPath = path.join(OUTPUT_DIR, `${baseName}.html`);
  
  fs.writeFileSync(outputPath, html);
  console.log(`✅ Generated: ${baseName}.html`);
  
  generatedDiagrams.push({
    filename: `${baseName}.html`,
    title: info.title,
    description: info.description
  });
});

// Generate index page
const indexHtml = indexTemplate(generatedDiagrams);
fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
console.log(`✅ Generated: index.html`);

console.log('\n✨ All HTML previews generated successfully!');
console.log(`\n📁 Output location: ${OUTPUT_DIR}`);
console.log('\n🎯 Next steps:');
console.log('   1. Open index.html in your browser');
console.log('   2. View each diagram');
console.log('   3. Export as SVG or PNG');
console.log('   4. Use in presentations\n');
