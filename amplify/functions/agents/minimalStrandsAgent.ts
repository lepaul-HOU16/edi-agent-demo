// Legacy minimal agent - replaced by FullStrandsAgent
export class MinimalStrandsAgent {
  constructor(modelId?: string, s3Bucket?: string) {
    console.log('MinimalStrandsAgent is deprecated. Use FullStrandsAgent instead.');
  }

  async processMessage(message: string): Promise<any> {
    return {
      success: false,
      message: 'MinimalStrandsAgent is deprecated. Please use FullStrandsAgent.'
    };
  }
}
