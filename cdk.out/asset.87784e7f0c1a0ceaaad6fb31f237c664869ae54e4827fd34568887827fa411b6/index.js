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

// lambda-functions/catalog-map-data/handler.ts
var handler_exports = {};
__export(handler_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(handler_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var S3_BUCKET = process.env.STORAGE_BUCKET_NAME || "amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m";
var S3_PREFIX = "global/well-data/";
var s3Client = new import_client_s3.S3Client({ region: process.env.AWS_REGION || "us-east-1" });
var OSDU_BASE_URL = process.env.OSDU_BASE_URL || "https://community.opensubsurface.org";
var OSDU_API_VERSION = "v2";
var OSDU_PARTITION_ID = process.env.OSDU_PARTITION_ID || "opendes";
async function fetchOSDUWells() {
  try {
    const searchParams = {
      kind: "osdu:wks:master-data--Wellbore:*",
      limit: 50,
      returnedFields: ["data.WellboreID", "data.FacilityName", "data.FacilityState", "data.GeoLocation", "data.VerticalMeasurement", "data.WellType"]
    };
    console.log("Fetching wells from OSDU:", JSON.stringify(searchParams, null, 2));
    const response = await fetch(`${OSDU_BASE_URL}/api/search/${OSDU_API_VERSION}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "data-partition-id": OSDU_PARTITION_ID,
        "Accept": "application/json"
      },
      body: JSON.stringify(searchParams)
    });
    if (!response.ok) {
      console.warn(`OSDU API returned ${response.status}: ${response.statusText}`);
      return generateMockWellsData();
    }
    const osduResults = await response.json();
    console.log("OSDU Wells Results:", JSON.stringify(osduResults, null, 2));
    return transformWellsToGeoJSON(osduResults.results || []);
  } catch (error) {
    console.error("Error fetching wells from OSDU:", error);
    return generateMockWellsData();
  }
}
async function fetchOSDUSeismic() {
  try {
    const searchParams = {
      kind: "osdu:wks:work-product-component--SeismicTrace:*",
      limit: 20,
      returnedFields: ["data.Name", "data.SurveyType", "data.GeoLocation", "data.AcquisitionDate"]
    };
    console.log("Fetching seismic from OSDU:", JSON.stringify(searchParams, null, 2));
    const response = await fetch(`${OSDU_BASE_URL}/api/search/${OSDU_API_VERSION}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "data-partition-id": OSDU_PARTITION_ID,
        "Accept": "application/json"
      },
      body: JSON.stringify(searchParams)
    });
    if (!response.ok) {
      console.warn(`OSDU Seismic API returned ${response.status}: ${response.statusText}`);
      return generateMockSeismicData();
    }
    const osduResults = await response.json();
    console.log("OSDU Seismic Results:", JSON.stringify(osduResults, null, 2));
    return transformSeismicToGeoJSON(osduResults.results || []);
  } catch (error) {
    console.error("Error fetching seismic from OSDU:", error);
    return generateMockSeismicData();
  }
}
function transformWellsToGeoJSON(osduRecords) {
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
        status: "Active"
      }
    };
  });
  return {
    type: "FeatureCollection",
    features
  };
}
function transformSeismicToGeoJSON(osduRecords) {
  const features = osduRecords.map((record, index) => {
    const seismicData = record.data;
    const baseCoords = [107.3 + index * 0.1, 10.3 + index * 0.1];
    const coordinates = [
      baseCoords,
      [baseCoords[0] + 0.4, baseCoords[1] + 0.3]
    ];
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates
      },
      properties: {
        name: seismicData.Name || `Seismic Survey ${index + 1}`,
        type: seismicData.SurveyType || "2D Survey",
        date: seismicData.AcquisitionDate || "2023",
        osduId: record.id
      }
    };
  });
  return {
    type: "FeatureCollection",
    features
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
function generateMockSeismicData() {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [[107.1, 10.2], [107.6, 10.4]]
          // Vietnamese offshore petroleum blocks coordinates
        },
        properties: {
          name: "Seismic Survey Alpha",
          type: "3D Survey",
          date: "2023-Q4"
        }
      },
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [[107, 10], [107.5, 10.3]]
          // Vietnamese offshore petroleum blocks coordinates
        },
        properties: {
          name: "Seismic Survey Beta",
          type: "2D Survey",
          date: "2023-Q2"
        }
      }
    ]
  };
}
var handler = async (event) => {
  try {
    const { type } = event.arguments;
    console.log("Catalog Map Data Request:", { type });
    const [wellsData, seismicData, myWellsData] = await Promise.all([
      fetchOSDUWells(),
      fetchOSDUSeismic(),
      fetchMyWells()
    ]);
    const combinedWells = {
      type: "FeatureCollection",
      features: [
        ...wellsData?.features || [],
        ...myWellsData?.features || []
      ]
    };
    const response = {
      wells: combinedWells,
      seismic: seismicData,
      myWells: myWellsData
      // Also provide separately for filtering
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=index.js.map
