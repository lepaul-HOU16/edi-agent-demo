import { BaseEnhancedAgent } from '../../cdk/lambda-functions/chat/agents/BaseEnhancedAgent';

interface CalculatorAgentResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: any[];
}

/**
 * Calculator Agent - Example implementation
 * 
 * Demonstrates:
 * - Pure TypeScript agent (no external tool Lambda)
 * - Step-by-step reasoning
 * - Mathematical computations
 * - Detailed thought steps
 */
export class CalculatorAgent extends BaseEnhancedAgent {
  constructor() {
    super(true); // Enable verbose logging
  }

  /**
   * Process calculation queries
   */
  async processMessage(message: string): Promise<CalculatorAgentResponse> {
    const thoughtSteps = [];

    try {
      // Step 1: Parse calculation request
      thoughtSteps.push(this.createThoughtStep(
        'intent_detection',
        'Analyzing Calculation Request',
        'Identifying calculation type and extracting parameters'
      ));

      const calculation = this.parseCalculation(message);
      
      if (!calculation) {
        return {
          success: false,
          message: 'Could not understand the calculation. Please provide a clear mathematical expression or financial calculation.',
          thoughtSteps,
        };
      }

      thoughtSteps[0].status = 'complete';
      thoughtSteps[0].summary = `Calculation type: ${calculation.type}`;

      // Step 2: Perform calculation with reasoning
      thoughtSteps.push(this.createThoughtStep(
        'execution',
        'Performing Calculation',
        `Computing ${calculation.type} with provided parameters`
      ));

      const result = await this.performCalculation(calculation, thoughtSteps);

      thoughtSteps[thoughtSteps.length - 1].status = 'complete';

      // Step 3: Format response
      thoughtSteps.push(this.createThoughtStep(
        'completion',
        'Formatting Result',
        'Preparing detailed calculation breakdown'
      ));

      const response = this.formatCalculationResponse(calculation, result);
      const artifacts = this.createCalculationArtifacts(calculation, result);

      thoughtSteps[thoughtSteps.length - 1].status = 'complete';

      return {
        success: true,
        message: response,
        artifacts,
        thoughtSteps,
      };

    } catch (error: any) {
      console.error('Calculator agent error:', error);
      
      return {
        success: false,
        message: `Calculation failed: ${error.message}`,
        thoughtSteps,
      };
    }
  }

  /**
   * Parse calculation from user query
   */
  private parseCalculation(message: string): any | null {
    // Compound interest
    if (/compound interest/i.test(message)) {
      const principal = this.extractNumber(message, ['principal', 'amount', '\\$']);
      const rate = this.extractNumber(message, ['rate', 'interest', '%']);
      const years = this.extractNumber(message, ['years', 'year']);
      
      if (principal && rate && years) {
        return {
          type: 'compound_interest',
          principal,
          rate: rate / 100,
          years,
          compoundingFrequency: 12, // Monthly
        };
      }
    }

    // Simple arithmetic
    const arithmeticMatch = message.match(/(\d+\.?\d*)\s*([\+\-\*\/])\s*(\d+\.?\d*)/);
    if (arithmeticMatch) {
      return {
        type: 'arithmetic',
        operand1: parseFloat(arithmeticMatch[1]),
        operator: arithmeticMatch[2],
        operand2: parseFloat(arithmeticMatch[3]),
      };
    }

    // Percentage calculation
    const percentMatch = message.match(/(\d+\.?\d*)%\s*of\s*(\d+\.?\d*)/i);
    if (percentMatch) {
      return {
        type: 'percentage',
        percentage: parseFloat(percentMatch[1]),
        value: parseFloat(percentMatch[2]),
      };
    }

    return null;
  }

  /**
   * Extract number from text with various patterns
   */
  private extractNumber(text: string, patterns: string[]): number | null {
    for (const pattern of patterns) {
      const regex = new RegExp(`${pattern}[:\\s]*([\\d,]+\\.?\\d*)`, 'i');
      const match = text.match(regex);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    return null;
  }

  /**
   * Perform calculation with step-by-step reasoning
   */
  private async performCalculation(calculation: any, thoughtSteps: any[]): Promise<any> {
    switch (calculation.type) {
      case 'compound_interest':
        return this.calculateCompoundInterest(calculation, thoughtSteps);
      
      case 'arithmetic':
        return this.calculateArithmetic(calculation, thoughtSteps);
      
      case 'percentage':
        return this.calculatePercentage(calculation, thoughtSteps);
      
      default:
        throw new Error('Unknown calculation type');
    }
  }

  /**
   * Calculate compound interest with detailed steps
   */
  private calculateCompoundInterest(calc: any, thoughtSteps: any[]): any {
    const { principal, rate, years, compoundingFrequency } = calc;
    
    // Add reasoning steps
    thoughtSteps.push(this.createThoughtStep(
      'execution',
      'Step 1: Identify Formula',
      `Using compound interest formula: A = P(1 + r/n)^(nt)`
    ));
    thoughtSteps[thoughtSteps.length - 1].status = 'complete';

    thoughtSteps.push(this.createThoughtStep(
      'execution',
      'Step 2: Substitute Values',
      `P = $${principal.toLocaleString()}, r = ${(rate * 100).toFixed(2)}%, n = ${compoundingFrequency}, t = ${years} years`
    ));
    thoughtSteps[thoughtSteps.length - 1].status = 'complete';

    // Calculate
    const n = compoundingFrequency;
    const t = years;
    const amount = principal * Math.pow(1 + rate / n, n * t);
    const interest = amount - principal;

    thoughtSteps.push(this.createThoughtStep(
      'execution',
      'Step 3: Calculate Result',
      `Final amount: $${amount.toFixed(2)}, Interest earned: $${interest.toFixed(2)}`
    ));
    thoughtSteps[thoughtSteps.length - 1].status = 'complete';

    // Year-by-year breakdown
    const yearlyBreakdown = [];
    for (let year = 1; year <= years; year++) {
      const yearAmount = principal * Math.pow(1 + rate / n, n * year);
      yearlyBreakdown.push({
        year,
        amount: yearAmount,
        interest: yearAmount - principal,
      });
    }

    return {
      principal,
      rate,
      years,
      compoundingFrequency,
      finalAmount: amount,
      totalInterest: interest,
      yearlyBreakdown,
    };
  }

  /**
   * Calculate simple arithmetic
   */
  private calculateArithmetic(calc: any, thoughtSteps: any[]): any {
    const { operand1, operator, operand2 } = calc;
    
    let result: number;
    let operation: string;

    switch (operator) {
      case '+':
        result = operand1 + operand2;
        operation = 'addition';
        break;
      case '-':
        result = operand1 - operand2;
        operation = 'subtraction';
        break;
      case '*':
        result = operand1 * operand2;
        operation = 'multiplication';
        break;
      case '/':
        result = operand1 / operand2;
        operation = 'division';
        break;
      default:
        throw new Error('Unknown operator');
    }

    thoughtSteps.push(this.createThoughtStep(
      'execution',
      'Calculation Step',
      `Performing ${operation}: ${operand1} ${operator} ${operand2} = ${result}`
    ));
    thoughtSteps[thoughtSteps.length - 1].status = 'complete';

    return { operand1, operator, operand2, result, operation };
  }

  /**
   * Calculate percentage
   */
  private calculatePercentage(calc: any, thoughtSteps: any[]): any {
    const { percentage, value } = calc;
    const result = (percentage / 100) * value;

    thoughtSteps.push(this.createThoughtStep(
      'execution',
      'Percentage Calculation',
      `${percentage}% of ${value} = ${result}`
    ));
    thoughtSteps[thoughtSteps.length - 1].status = 'complete';

    return { percentage, value, result };
  }

  /**
   * Format calculation response
   */
  private formatCalculationResponse(calculation: any, result: any): string {
    switch (calculation.type) {
      case 'compound_interest':
        return `
## Compound Interest Calculation

**Initial Investment:** $${result.principal.toLocaleString()}
**Annual Interest Rate:** ${(result.rate * 100).toFixed(2)}%
**Time Period:** ${result.years} years
**Compounding:** ${result.compoundingFrequency}x per year

### Results

**Final Amount:** $${result.finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
**Total Interest Earned:** $${result.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

### Year-by-Year Breakdown

${result.yearlyBreakdown.map((year: any) => 
  `**Year ${year.year}:** $${year.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Interest: $${year.interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
).join('\n')}
        `.trim();

      case 'arithmetic':
        return `
## Arithmetic Calculation

**Operation:** ${result.operation.charAt(0).toUpperCase() + result.operation.slice(1)}

${result.operand1} ${result.operator} ${result.operand2} = **${result.result}**
        `.trim();

      case 'percentage':
        return `
## Percentage Calculation

${result.percentage}% of ${result.value} = **${result.result}**
        `.trim();

      default:
        return 'Calculation complete';
    }
  }

  /**
   * Create calculation artifacts
   */
  private createCalculationArtifacts(calculation: any, result: any): any[] {
    if (calculation.type === 'compound_interest') {
      return [
        {
          type: 'compound_interest_chart',
          data: {
            messageContentType: 'compound_interest_chart',
            principal: result.principal,
            yearlyBreakdown: result.yearlyBreakdown,
          },
        },
      ];
    }

    return [];
  }

  /**
   * Create thought step helper
   */
  private createThoughtStep(type: string, title: string, summary: string): any {
    return {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      title,
      summary,
      status: 'in_progress',
    };
  }
}

/**
 * Intent detection patterns for calculator queries
 */
export const calculatorPatterns = [
  /calculate/i,
  /compound interest/i,
  /\d+\s*[\+\-\*\/]\s*\d+/,
  /\d+%\s*of/i,
  /percentage/i,
];

/**
 * Example usage:
 * 
 * const agent = new CalculatorAgent();
 * const result = await agent.processMessage("Calculate compound interest on $10,000 at 5% for 10 years");
 * console.log(result.message);
 */
