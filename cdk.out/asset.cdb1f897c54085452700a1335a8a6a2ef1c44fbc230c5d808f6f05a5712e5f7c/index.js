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

// cdk/lambda-functions/collections/handler.ts
var handler_exports = {};
__export(handler_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(handler_exports);
function getCollections() {
  if (!global.persistentCollections) {
    console.log("\u{1F504} Initializing persistent collections storage");
    const numberedWells = Array.from({ length: 24 }, (_, i) => {
      const wellNum = String(i + 1).padStart(3, "0");
      return {
        id: `well_${wellNum}`,
        name: `WELL-${wellNum}`,
        type: "wellbore",
        dataSource: "S3",
        s3Key: `global/well-data/WELL-${wellNum}.las`,
        location: "South China Sea",
        operator: "Production Operator",
        depth: "2000-3500m",
        curves: ["GR", "RHOB", "NPHI", "DTC", "CALI", "Resistivity"]
      };
    });
    global.persistentCollections = [
      {
        id: "demo_collection_1",
        name: "South China Sea Production Wells (24 Wells)",
        description: "24 numbered production wells (WELL-001 through WELL-024) with complete LAS files from the South China Sea",
        dataSourceType: "S3",
        previewMetadata: {
          wellCount: 24,
          dataPointCount: 24,
          dataSources: ["S3"],
          operators: ["Production Operator"],
          createdFrom: "demo",
          location: "South China Sea",
          wellRange: "WELL-001 to WELL-024"
        },
        dataItems: numberedWells,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString(),
        lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
        owner: "current-user"
      },
      {
        id: "demo_collection_osdu",
        name: "Cuu Long Basin Wells (OSDU)",
        description: "Production wells from the Cuu Long Basin area via OSDU",
        dataSourceType: "Mixed",
        previewMetadata: {
          wellCount: 5,
          dataPointCount: 5,
          dataSources: ["OSDU", "S3"],
          operators: ["PetroVietnam", "Total"],
          createdFrom: "demo"
        },
        dataItems: [
          {
            id: "well_osdu_001",
            name: "AKM-12",
            type: "wellbore",
            dataSource: "OSDU",
            s3Key: "wells/akm-12/trajectory.csv",
            osduId: "osdu:work-product-component--WellboreTrajectory:6ec4485cfed716a909ccabf93cbc658fe7ba2a1bd971d33041ba505d43b949d5"
          },
          {
            id: "well_osdu_002",
            name: "ANN-04-S1",
            type: "trajectory",
            dataSource: "OSDU",
            s3Key: "wells/ann-04-s1/trajectory.csv",
            osduId: "osdu:work-product-component--WellboreTrajectory:4f1c114b29ff8baee976b0ec2c54927e2519bf67b5a3a021aad7b926edeecfa2"
          },
          {
            id: "well_osdu_003",
            name: "KDZ-02-S1",
            type: "wellbore",
            dataSource: "OSDU",
            s3Key: "wells/kdz-02-s1/trajectory.csv",
            osduId: "osdu:work-product-component--WellboreTrajectory:9ca70981081a141c8abf442b27c72ff8df17dda8f9f8a5d29557a7cc650036b9"
          },
          {
            id: "well_osdu_004",
            name: "VRS-401",
            type: "trajectory",
            dataSource: "OSDU",
            s3Key: "wells/vrs-401/trajectory.csv",
            osduId: "osdu:work-product-component--WellboreTrajectory:7dc159bda77d41c8aa99cd08b13acb3178236f824c913c83d3844bf603fc1dee"
          },
          {
            id: "well_osdu_005",
            name: "LIR-31",
            type: "wellbore",
            dataSource: "OSDU",
            s3Key: "wells/lir-31/trajectory.csv",
            osduId: "osdu:work-product-component--WellboreTrajectory:4fdcc38ba9036b76fc499723bd8164f412762985490"
          }
        ],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString(),
        lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
        owner: "current-user"
      }
    ];
  }
  return global.persistentCollections;
}
var handler = async (event) => {
  console.log("\u{1F5C2}\uFE0F Collections API Handler:", JSON.stringify(event, null, 2));
  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;
  try {
    if (path === "/api/collections/create" && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { name, description, dataSourceType, previewMetadata, dataItems } = body;
      console.log("\u{1F4C1} Creating collection:", { name, dataSourceType, itemCount: dataItems?.length });
      const newCollection = {
        id: `collection_${Date.now()}`,
        name,
        description: description || "",
        dataSourceType,
        previewMetadata: previewMetadata || {},
        dataItems: dataItems || [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastAccessedAt: (/* @__PURE__ */ new Date()).toISOString(),
        owner: "current-user"
      };
      const collections = getCollections();
      collections.push(newCollection);
      console.log("\u2705 Collection created:", newCollection.id);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          collection: newCollection,
          collectionId: newCollection.id,
          message: "Collection created successfully"
        })
      };
    }
    if (path === "/api/collections/list" && method === "GET") {
      const collections = getCollections();
      console.log("\u{1F4CB} Listing collections, count:", collections.length);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collections,
          count: collections.length
        })
      };
    }
    if (path.startsWith("/api/collections/") && method === "GET" && path !== "/api/collections/list") {
      const collectionId = path.split("/").pop();
      console.log("\u{1F50D} Getting collection:", collectionId);
      const collections = getCollections();
      const collection = collections.find((c) => c.id === collectionId);
      if (!collection) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            success: false,
            error: `Collection not found: ${collectionId}`
          })
        };
      }
      collection.lastAccessedAt = (/* @__PURE__ */ new Date()).toISOString();
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          collection
        })
      };
    }
    if (path.startsWith("/api/collections/") && method === "PUT") {
      const collectionId = path.split("/").pop();
      const body = JSON.parse(event.body || "{}");
      console.log("\u270F\uFE0F Updating collection:", collectionId);
      const collections = getCollections();
      const collection = collections.find((c) => c.id === collectionId);
      if (!collection) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            success: false,
            error: `Collection not found: ${collectionId}`
          })
        };
      }
      if (body.name) collection.name = body.name;
      if (body.description !== void 0) collection.description = body.description;
      if (body.dataSourceType) collection.dataSourceType = body.dataSourceType;
      if (body.previewMetadata) collection.previewMetadata = body.previewMetadata;
      if (body.dataItems) collection.dataItems = body.dataItems;
      collection.lastAccessedAt = (/* @__PURE__ */ new Date()).toISOString();
      console.log("\u2705 Collection updated:", collectionId);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          collection,
          message: "Collection updated successfully"
        })
      };
    }
    if (path.startsWith("/api/collections/") && method === "DELETE") {
      const collectionId = path.split("/").pop();
      console.log("\u{1F5D1}\uFE0F Deleting collection:", collectionId);
      const collections = getCollections();
      const index = collections.findIndex((c) => c.id === collectionId);
      if (index === -1) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            success: false,
            error: `Collection not found: ${collectionId}`
          })
        };
      }
      collections.splice(index, 1);
      console.log("\u2705 Collection deleted, remaining:", collections.length);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          message: "Collection deleted successfully"
        })
      };
    }
    if (path.includes("/query") && method === "POST") {
      const collectionId = path.split("/")[3];
      const body = JSON.parse(event.body || "{}");
      console.log("\u{1F50D} Querying collection:", collectionId, body);
      const collections = getCollections();
      const collection = collections.find((c) => c.id === collectionId);
      if (!collection) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            success: false,
            error: `Collection not found: ${collectionId}`
          })
        };
      }
      collection.lastAccessedAt = (/* @__PURE__ */ new Date()).toISOString();
      const wells = collection.dataItems.filter((item) => item.type === "wellbore" || item.type === "trajectory").map((item) => ({
        id: item.id,
        name: item.name,
        s3Key: item.s3Key,
        osduId: item.osduId,
        type: item.type
      }));
      console.log(`\u2705 Found ${wells.length} wells in collection`);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          wells,
          count: wells.length
        })
      };
    }
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Not found" })
    };
  } catch (error) {
    console.error("\u274C Collections API error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=index.js.map
