/**
 * Stub WebBrowserTool - Temporary replacement to avoid ES module issues
 * This is a minimal implementation that doesn't use axios or cheerio
 */

export interface WebBrowserResult {
  content: string;
  status: number;
  error?: string;
}

export class WebBrowserTool {
  async func(params: { url: string }): Promise<WebBrowserResult> {
    console.log('⚠️  WebBrowserTool stub called - web browsing temporarily disabled');
    return {
      content: '',
      status: 503,
      error: 'Web browsing temporarily disabled due to dependency issues'
    };
  }

  get name(): string {
    return "webBrowserTool";
  }

  get description(): string {
    return "Temporarily disabled";
  }
}

// Export singleton instance
export const webBrowserTool = new WebBrowserTool();
