import { Construct } from 'constructs';
import * as location from 'aws-cdk-lib/aws-location';
import { RemovalPolicy } from 'aws-cdk-lib';

export interface LocationServiceConstructProps {
  placeIndexName?: string;
}

/**
 * Custom CDK construct for AWS Location Service Place Index
 * Used for reverse geocoding coordinates to location names
 */
export class LocationServiceConstruct extends Construct {
  public readonly placeIndex: location.CfnPlaceIndex;
  public readonly placeIndexName: string;

  constructor(scope: Construct, id: string, props: LocationServiceConstructProps = {}) {
    super(scope, id);

    this.placeIndexName = props.placeIndexName || 'RenewableProjectPlaceIndex';

    // Create Place Index for reverse geocoding
    this.placeIndex = new location.CfnPlaceIndex(this, 'PlaceIndex', {
      indexName: this.placeIndexName,
      dataSource: 'Esri', // Using Esri as the data provider
      description: 'Place index for renewable energy project location names',
      pricingPlan: 'RequestBasedUsage'
    });

    // Apply removal policy
    this.placeIndex.applyRemovalPolicy(RemovalPolicy.DESTROY);

    console.log(`✅ Created AWS Location Service Place Index: ${this.placeIndexName}`);
  }
}
