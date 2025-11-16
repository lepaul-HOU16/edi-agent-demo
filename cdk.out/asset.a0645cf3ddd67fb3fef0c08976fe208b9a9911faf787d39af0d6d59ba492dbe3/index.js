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

// cdk/lambda-functions/api-utility/handler.ts
var handler_exports = {};
__export(handler_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(handler_exports);
var handler = async (event) => {
  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;
  console.log(`[Utility API] ${method} ${path}`);
  try {
    if (path === "/api/global-directory-scan" && method === "POST") {
      return await handleDirectoryScan(event);
    }
    if (path === "/api/test-renewable-config") {
      return await handleTestConfig(event);
    }
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Not found", path, method })
    };
  } catch (error) {
    console.error("[Utility API] Error:", error);
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
async function handleDirectoryScan(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        status: "scanned",
        files: [],
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
        error: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
}
async function handleTestConfig(event) {
  try {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        status: "ok",
        config: {
          environment: process.env.AWS_REGION
        },
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
        error: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=index.js.map
