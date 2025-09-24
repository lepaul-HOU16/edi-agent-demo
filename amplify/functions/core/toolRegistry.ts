// Lazy-loaded tool registry to reduce memory usage
import { StructuredToolInterface, ToolSchemaBase } from "@langchain/core/tools";

type ToolLoader = () => Promise<StructuredToolInterface<ToolSchemaBase, any, any>>;

const toolLoaders: Record<string, ToolLoader> = {
  s3Tools: () => import('../tools/s3ToolBox').then(m => m.s3FileManagementTools),
  pysparkTool: () => import('../tools/athenaPySparkTool').then(m => m.pysparkTool),
  renderAssetTool: () => import('../tools/renderAssetTool').then(m => m.renderAssetTool),
  plotDataTool: () => import('../tools/plotDataTool').then(m => m.plotDataTool),
  userInputTool: () => import('../tools/userInputTool').then(m => m.userInputTool),
};

export async function loadTools(toolNames: string[]): Promise<StructuredToolInterface<ToolSchemaBase, any, any>[]> {
  const tools = await Promise.all(
    toolNames.map(async (name) => {
      const loader = toolLoaders[name];
      if (!loader) {
        console.warn(`Tool ${name} not found in registry`);
        return null;
      }
      try {
        return await loader();
      } catch (error) {
        console.error(`Failed to load tool ${name}:`, error);
        return null;
      }
    })
  );
  
  return tools.filter(Boolean) as StructuredToolInterface<ToolSchemaBase, any, any>[];
}
