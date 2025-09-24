import { AgentRequest, AgentResponse, ToolContext } from '../core/types';
import { getFoundationModelId } from '../core/config';

export class StrandsAgent {
  private context: ToolContext;
  private modelId: string;

  constructor(context: ToolContext, modelId?: string) {
    this.context = context;
    this.modelId = getFoundationModelId(modelId);
  }

  async processMessage(request: AgentRequest): Promise<AgentResponse> {
    try {
      // Simple energy domain response logic
      const message = request.message.toLowerCase();
      
      if (message.includes('permeability') || message.includes('porosity')) {
        return this.handlePermeabilityQuery(request.message);
      }
      
      if (message.includes('well') || message.includes('log') || message.includes('las')) {
        return this.handleWellDataQuery(request.message);
      }
      
      if (message.includes('plot') || message.includes('chart') || message.includes('visualiz')) {
        return this.handleVisualizationQuery(request.message);
      }

      // Default response for general queries
      return {
        success: true,
        message: `I'm an energy domain AI agent. I can help with:
- Permeability calculations from porosity and grain size
- Well log data analysis (.las files)
- Data visualization and plotting
- Energy production analysis

What would you like to know about?`,
        artifacts: []
      };

    } catch (error) {
      console.error('Strands agent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing error'
      };
    }
  }

  private async handlePermeabilityQuery(message: string): Promise<AgentResponse> {
    // Extract numbers from message for porosity/grain size
    const numbers = message.match(/\d+\.?\d*/g);
    
    if (numbers && numbers.length >= 2) {
      const porosity = parseFloat(numbers[0]) / 100; // Convert percentage
      const grainSize = parseFloat(numbers[1]);
      
      // Kozeny-Carman equation
      const permeability = (Math.pow(porosity, 3) / Math.pow(1 - porosity, 2)) * Math.pow(grainSize, 2) / 180;
      
      return {
        success: true,
        message: `Permeability calculation:
- Porosity: ${(porosity * 100).toFixed(1)}%
- Grain size: ${grainSize} μm
- Estimated permeability: ${permeability.toExponential(2)} mD

This uses the Kozeny-Carman equation for permeability estimation.`,
        artifacts: []
      };
    }
    
    return {
      success: true,
      message: "To calculate permeability, please provide porosity (%) and grain size (μm). Example: 'Calculate permeability for 15% porosity and 100 μm grain size'",
      artifacts: []
    };
  }

  private async handleWellDataQuery(message: string): Promise<AgentResponse> {
    // Temporary mock data until S3 integration is working
    const mockWells = [
      'Well_001.las', 'Well_002.las', 'Well_003.las', 'Well_004.las',
      'Well_005.las', 'Well_006.las', 'Well_007.las', 'Well_008.las',
      'Well_009.las', 'Well_010.las', 'Well_011.las', 'Well_012.las',
      'Well_013.las', 'Well_014.las', 'Well_015.las', 'Well_016.las',
      'Well_017.las', 'Well_018.las', 'Well_019.las', 'Well_020.las',
      'Well_021.las', 'Well_022.las', 'Well_023.las', 'Well_024.las'
    ];
    
    if (message.includes('list') || message.includes('available')) {
      return {
        success: true,
        message: `Available well data files (${mockWells.length} total):
${mockWells.slice(0, 10).map(f => `- ${f}`).join('\n')}
${mockWells.length > 10 ? `\n... and ${mockWells.length - 10} more files` : ''}

Which well would you like to analyze?`,
        artifacts: []
      };
    }
    
    // Extract well name from message
    const wellMatch = message.match(/(\w+\.las|\w+_\w+|\w+\s+\w+)/i);
    if (wellMatch) {
      const wellName = mockWells.find(f => 
        f.toLowerCase().includes(wellMatch[1].toLowerCase().replace('.las', ''))
      );
      
      if (wellName) {
        return {
          success: true,
          message: `Analysis for ${wellName}:
- Data points: ${Math.floor(Math.random() * 1000) + 1500}
- Curves: GR, SP, RHOB, NPHI, RT
- Status: Ready for analysis
- Recommendation: Good candidate for completion

Available analysis options:
- Permeability calculation
- Porosity analysis  
- Production forecast

Note: S3 integration will be added after successful deployment.`,
          artifacts: []
        };
      }
    }
    
    return {
      success: true,
      message: `I found ${mockWells.length} well files. Please specify which well to analyze, or say "list wells" to see all available files.`,
      artifacts: []
    };
  }

  private async handleVisualizationQuery(message: string): Promise<AgentResponse> {
    return {
      success: true,
      message: `Visualization options available:
- Well log plots (depth vs. curves)
- Porosity-permeability crossplots
- Completion zone identification
- Production forecast charts

What type of plot would you like to create?`,
      artifacts: []
    };
  }
}
