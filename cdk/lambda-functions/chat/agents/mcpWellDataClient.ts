import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

export class MCPWellDataClient {
  private s3Client: S3Client;
  private bucketName: string;
  private prefix: string = 'global/well-data/';

  constructor(bucketName: string) {
    this.s3Client = new S3Client({ region: 'us-east-1' });
    this.bucketName = bucketName;
  }

  async listWellFiles(): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: this.prefix,
      MaxKeys: 50
    });

    const response = await this.s3Client.send(command);
    return response.Contents?.map(obj => obj.Key?.replace(this.prefix, '') || '') || [];
  }

  async getWellData(filename: string): Promise<any> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: `${this.prefix}${filename}`
    });

    const response = await this.s3Client.send(command);
    const content = await response.Body?.transformToString();
    
    if (!content) throw new Error(`No data found for ${filename}`);
    
    return this.parseLASFile(content, filename);
  }

  private parseLASFile(content: string, filename: string) {
    const lines = content.split('\n');
    const wellInfo: any = { filename, curves: [], dataPoints: 0 };
    
    let inDataSection = false;
    let curveNames: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('~C')) {
        const match = line.match(/(\w+)\s*\.\s*\w+\s*:\s*(.+)/);
        if (match) curveNames.push(match[1]);
      } else if (line.startsWith('~A')) {
        inDataSection = true;
        continue;
      } else if (inDataSection && line.trim() && !line.startsWith('~')) {
        wellInfo.dataPoints++;
      }
    }
    
    wellInfo.curves = curveNames;
    return wellInfo;
  }
}
