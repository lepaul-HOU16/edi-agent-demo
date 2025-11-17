"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambda-functions/catalog-map-data/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler2
});
module.exports = __toCommonJS(index_exports);

// lambda-functions/catalog-map-data/handler.ts
var import_client_s3 = require("@aws-sdk/client-s3");
var S3_BUCKET = process.env.STORAGE_BUCKET_NAME || "amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m";
var S3_PREFIX = "global/well-data/";
var s3Client = new import_client_s3.S3Client({ region: process.env.AWS_REGION || "us-east-1" });
var OSDU_TOOLS_API_URL = process.env.OSDU_TOOLS_API_URL || "https://f1qn9bdfye.execute-api.us-east-1.amazonaws.com/development/tools";
var OSDU_TOOLS_API_KEY = process.env.OSDU_TOOLS_API_KEY || "sF1oCz1FfjOo9YY7OBmCaZM8TxpqzzS46JYbIvEb";
async function fetchOSDUWells(maxResults = 100) {
  try {
    console.log(`Fetching wells from OSDU Tools API (maxResults: ${maxResults})`);
    const response = await fetch(OSDU_TOOLS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": OSDU_TOOLS_API_KEY
      },
      body: JSON.stringify({
        toolName: "searchWells",
        input: {
          maxResults
        }
      })
    });
    if (!response.ok) {
      console.warn(`OSDU Tools API returned ${response.status}: ${response.statusText}`);
      return generateMockWellsData();
    }
    const result = await response.json();
    console.log("OSDU Tools API Response:", JSON.stringify({
      statusCode: result.statusCode,
      metadata: result.body?.metadata,
      recordCount: result.body?.records?.length
    }, null, 2));
    if (result.statusCode !== 200 || !result.body?.records) {
      console.warn("Invalid response from OSDU Tools API");
      return generateMockWellsData();
    }
    return transformWellsToGeoJSON(result.body.records, result.body.metadata);
  } catch (error) {
    console.error("Error fetching wells from OSDU Tools API:", error);
    return generateMockWellsData();
  }
}
function transformWellsToGeoJSON(osduRecords, metadata) {
  const features = osduRecords.map((record, index) => {
    const wellData = record.data;
    const coordinates = wellData.GeoLocation?.Wgs84Coordinates ? [wellData.GeoLocation.Wgs84Coordinates.Longitude, wellData.GeoLocation.Wgs84Coordinates.Latitude] : [107.2 + index * 0.02, 10.2 + index * 0.02];
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates
      },
      properties: {
        name: wellData.FacilityName || wellData.WellboreID || `Well-${index + 1}`,
        type: wellData.WellType || "Unknown",
        depth: wellData.VerticalMeasurement?.Depth ? `${wellData.VerticalMeasurement.Depth.Value} ${wellData.VerticalMeasurement.Depth.UOM}` : "Unknown",
        location: wellData.FacilityState || "Unknown",
        osduId: record.id,
        status: "Active",
        company: wellData.OperatorName || "Unknown"
      }
    };
  });
  return {
    type: "FeatureCollection",
    features,
    metadata: metadata ? {
      totalFound: metadata.totalFound,
      filtered: metadata.filtered,
      authorized: metadata.authorized,
      returned: metadata.returned
    } : void 0
  };
}
async function fetchWellCoordinatesFromCSV() {
  try {
    console.log("Fetching well coordinates from converted_coordinates.csv");
    const csvCommand = new import_client_s3.GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: `${S3_PREFIX}converted_coordinates.csv`
    });
    const csvResponse = await s3Client.send(csvCommand);
    const csvContent = await csvResponse.Body?.transformToString();
    if (!csvContent) {
      console.warn("No CSV content found, using fallback coordinates");
      return /* @__PURE__ */ new Map();
    }
    const coordinatesMap = /* @__PURE__ */ new Map();
    const lines = csvContent.trim().split("\n");
    for (let i = 1; i < lines.length; i++) {
      const [wellName, x, y, latitude, longitude] = lines[i].split(",");
      if (wellName && latitude && longitude) {
        coordinatesMap.set(wellName.trim(), {
          lat: parseFloat(latitude.trim()),
          lon: parseFloat(longitude.trim())
        });
      }
    }
    console.log(`Loaded coordinates for ${coordinatesMap.size} wells from CSV`);
    return coordinatesMap;
  } catch (error) {
    console.error("Error loading coordinates from CSV:", error);
    return /* @__PURE__ */ new Map();
  }
}
async function fetchMyWells() {
  try {
    console.log(`Fetching LAS files from S3 bucket: ${S3_BUCKET}, prefix: ${S3_PREFIX}`);
    const coordinatesMap = await fetchWellCoordinatesFromCSV();
    const listCommand = new import_client_s3.ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: S3_PREFIX,
      MaxKeys: 50
    });
    const response = await s3Client.send(listCommand);
    const lasFiles = response.Contents?.filter((obj) => obj.Key?.endsWith(".las")) || [];
    console.log(`Found ${lasFiles.length} LAS files in S3`);
    const fallbackCoordinates = [
      [114.45, 10.47],
      [114.49, 10.55],
      [114.49, 10.53],
      [114.49, 10.3],
      [114.56, 10.48],
      [114.55, 10.35],
      [114.49, 10.39],
      [114.46, 10.36],
      [114.52, 10.41],
      [114.64, 10.45],
      [114.62, 10.39],
      [114.46, 10.6],
      [114.5, 10.21],
      [114.5, 10.19],
      [114.63, 10.21],
      [114.56, 10.12],
      [114.58, 10.15],
      [114.56, 10.15],
      [114.58, 10.16],
      [114.62, 10.2],
      [114.57, 10.12],
      [114.56, 10.12],
      [114.49, 10.53],
      [114.55, 10.35],
      [114.52, 10.41]
    ];
    const myWellsFeatures = lasFiles.map((file, index) => {
      const fileName = file.Key?.replace(S3_PREFIX, "") || `Well-${index + 1}`;
      const wellName = fileName.replace(".las", "").replace(/_/g, " ").toUpperCase();
      let coordinates;
      const realCoords = coordinatesMap.get(wellName);
      if (realCoords) {
        coordinates = [realCoords.lon, realCoords.lat];
      } else {
        coordinates = fallbackCoordinates[index] || [114.5 + index * 0.02, 10.3 + index * 0.02];
      }
      const fileSizeMB = (file.Size || 0) / (1024 * 1024);
      const estimatedDepth = Math.floor(2e3 + fileSizeMB * 500);
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates
        },
        properties: {
          name: wellName,
          type: "My Wells",
          depth: `${estimatedDepth}m (est.)`,
          location: "Offshore Brunei/Malaysia",
          operator: "My Company",
          category: "personal",
          fileName,
          fileSize: `${fileSizeMB.toFixed(2)} MB`,
          s3Key: file.Key,
          lastModified: file.LastModified?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
          dataSource: "Personal LAS Files (Real Coordinates)"
        }
      };
    });
    return {
      type: "FeatureCollection",
      features: myWellsFeatures
    };
  } catch (error) {
    console.error("Error fetching LAS files from S3:", error);
    return {
      type: "FeatureCollection",
      features: []
    };
  }
}
function generateMockWellsData() {
  return {
    type: "FeatureCollection",
    features: []
  };
}
var handler = async (event) => {
  try {
    const { type, maxResults = 100 } = event.arguments;
    console.log("Catalog Map Data Request:", { type, maxResults });
    const [wellsData, myWellsData] = await Promise.all([
      fetchOSDUWells(maxResults),
      fetchMyWells()
    ]);
    const combinedWells = {
      type: "FeatureCollection",
      features: [
        ...wellsData?.features || [],
        ...myWellsData?.features || []
      ],
      metadata: wellsData?.metadata
    };
    const response = {
      wells: combinedWells,
      seismic: { type: "FeatureCollection", features: [] },
      // Empty for now
      myWells: myWellsData,
      // Also provide separately for filtering
      metadata: wellsData?.metadata
    };
    console.log("Map Data Response:", {
      osduWellsCount: wellsData?.features?.length || 0,
      myWellsCount: myWellsData?.features?.length || 0,
      totalWellsCount: combinedWells.features.length,
      seismicCount: seismicData?.features?.length || 0
    });
    return JSON.stringify(response);
  } catch (error) {
    console.error("Error in catalogMapData:", error);
    throw new Error(`Map data fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// lambda-functions/catalog-map-data/index.ts
var handler2 = async (event) => {
  try {
    console.log("[Catalog Map Data Wrapper] Received API Gateway event");
    const type = event.queryStringParameters?.type || "all";
    const maxResults = parseInt(event.queryStringParameters?.maxResults || "100", 10);
    console.log(`[Catalog Map Data Wrapper] Type: ${type}, MaxResults: ${maxResults}`);
    const result = await handler({
      arguments: { type, maxResults },
      identity: {
        sub: event.requestContext.authorizer?.jwt?.claims?.sub || event.requestContext.authorizer?.lambda?.userId || event.requestContext.authorizer?.userId || "unknown-user"
      }
    }, {});
    console.log("[Catalog Map Data Wrapper] Catalog handler completed successfully");
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error("[Catalog Map Data Wrapper] Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: error.message || "Internal server error",
        message: "Failed to fetch catalog map data"
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=index.js.map
