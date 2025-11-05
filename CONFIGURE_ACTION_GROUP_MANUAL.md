# Configure Action Group - Manual Steps

The automated script is having issues with the OpenAPI schema. Let's configure it manually through the AWS Console - it's actually faster and easier!

## Quick Steps (5 minutes)

### Step 1: Open Bedrock Console

1. Go to: https://console.aws.amazon.com/bedrock/
2. Click "Agents" in the left sidebar
3. Click on "A4E-Petrophysics-agent-e9a"

### Step 2: Add Action Group

1. Scroll down to "Action groups" section
2. Click "Add" button
3. Fill in:
   - **Action group name**: `petrophysics-tools`
   - **Description**: `Petrophysical calculation tools`
   - **Action group type**: Select "Define with function details"
   - **Lambda function**: Select `amplify-digitalassistant--PetrophysicsCalculator54-SDDBGmxTtKXh`

### Step 3: Add Functions

Click "Add function" for each of these:

#### Function 1: calculate_porosity
- **Name**: `calculate_porosity`
- **Description**: `Calculate porosity for a well using density, neutron, or effective methods`
- **Parameters**:
  - `well_name` (string, required): "Name of the well"
  - `method` (string, required): "Calculation method: density, neutron, or effective"
  - `depth_start` (number, optional): "Start depth"
  - `depth_end` (number, optional): "End depth"

#### Function 2: calculate_shale_volume
- **Name**: `calculate_shale_volume`
- **Description**: `Calculate shale volume using various methods`
- **Parameters**:
  - `well_name` (string, required): "Name of the well"
  - `method` (string, required): "Method: larionov_tertiary, larionov_pre_tertiary, linear, or clavier"
  - `depth_start` (number, optional): "Start depth"
  - `depth_end` (number, optional): "End depth"

#### Function 3: calculate_saturation
- **Name**: `calculate_saturation`
- **Description**: `Calculate water saturation using Archie equation`
- **Parameters**:
  - `well_name` (string, required): "Name of the well"
  - `method` (string, required): "Method: archie"
  - `porosity_method` (string, optional): "Porosity method to use"
  - `depth_start` (number, optional): "Start depth"
  - `depth_end` (number, optional): "End depth"

#### Function 4: list_wells
- **Name**: `list_wells`
- **Description**: `List all available wells`
- **Parameters**: (none)

#### Function 5: get_well_info
- **Name**: `get_well_info`
- **Description**: `Get information about a specific well`
- **Parameters**:
  - `well_name` (string, required): "Name of the well"

### Step 4: Save and Prepare

1. Click "Add" to save the action group
2. Click "Prepare" button at the top of the page
3. Wait for status to change to "Prepared" (30-60 seconds)

### Step 5: Verify

Run this command to verify:
```bash
aws bedrock-agent list-agent-action-groups \
  --agent-id QUQKELPKM2 \
  --agent-version DRAFT \
  --output table
```

You should see `petrophysics-tools` listed.

### Step 6: Test!

Go back to your UI and try:
```
calculate porosity for well-001
```

## Expected Result

The agent should now:
1. ✅ Receive your request
2. ✅ Invoke the `calculate_porosity` function
3. ✅ Call the Lambda function
4. ✅ Return porosity calculation results
5. ✅ Display Cloudscape visualization

## Troubleshooting

### If agent still says "I don't have enough information"
- Verify action group is in "Enabled" state
- Verify agent is "Prepared"
- Try preparing the agent again

### If you get Lambda permission errors
```bash
LAMBDA_ARN="arn:aws:lambda:us-east-1:484907533441:function:amplify-digitalassistant--PetrophysicsCalculator54-SDDBGmxTtKXh"

aws lambda add-permission \
  --function-name "$LAMBDA_ARN" \
  --statement-id bedrock-agent-invoke-$(date +%s) \
  --action lambda:InvokeFunction \
  --principal bedrock.amazonaws.com \
  --source-arn "arn:aws:bedrock:us-east-1:484907533441:agent/QUQKELPKM2"
```

### Check CloudWatch Logs

Monitor Lambda execution:
```bash
aws logs tail /aws/lambda/amplify-digitalassistant--PetrophysicsCalculator54-SDDBGmxTtKXh --follow
```

## Why Manual is Better

- ✅ AWS Console validates the schema for you
- ✅ Visual interface is easier to understand
- ✅ Can see exactly what you're configuring
- ✅ Immediate feedback if something is wrong
- ✅ Takes only 5 minutes

## Ready!

Once you complete these steps, the AgentCore integration will be fully functional!
