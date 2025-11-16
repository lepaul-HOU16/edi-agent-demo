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

// cdk/lambda-functions/api-health/handler.ts
var handler_exports = {};
__export(handler_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(handler_exports);
var handler = async (event) => {
  const path = event.requestContext.http.path;
  console.log(`[Health API] ${event.requestContext.http.method} ${path}`);
  try {
    if (path === "/api/health/s3") {
      return await handleS3Health(event);
    }
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Not found", path })
    };
  } catch (error) {
    console.error("[Health API] Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
};
async function handleS3Health(event) {
  try {
    const bucketName = process.env.STORAGE_BUCKET_NAME;
    if (!bucketName) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          status: "unhealthy",
          error: "S3 bucket not configured",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        })
      };
    }
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify({
        status: "healthy",
        bucket: bucketName,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=index.js.map
