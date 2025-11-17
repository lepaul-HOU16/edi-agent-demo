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

// lambda-functions/api-s3-proxy/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);

// lambda-functions/api-s3-proxy/handler.ts
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var s3Client = new import_client_s3.S3Client({ region: process.env.AWS_REGION || "us-east-1" });
function parseMultipartFormData(body, contentType) {
  const boundary = contentType.split("boundary=")[1];
  if (!boundary) {
    throw new Error("No boundary found in Content-Type");
  }
  const parts = body.split(`--${boundary}`);
  const formData = /* @__PURE__ */ new Map();
  for (const part of parts) {
    if (part.includes("Content-Disposition")) {
      const nameMatch = part.match(/name="([^"]+)"/);
      if (nameMatch) {
        const name = nameMatch[1];
        const contentStart = part.indexOf("\r\n\r\n") + 4;
        const contentEnd = part.lastIndexOf("\r\n");
        const value = part.substring(contentStart, contentEnd);
        if (name === "file") {
          formData.set(name, value);
        } else {
          formData.set(name, value);
        }
      }
    }
  }
  return formData;
}
var handler = async (event) => {
  console.log(`[S3 Proxy API] ${event.requestContext.http.method} ${event.requestContext.http.path}`);
  const bucketName = process.env.STORAGE_BUCKET_NAME;
  if (!bucketName) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "S3 bucket not configured"
      })
    };
  }
  try {
    const method = event.requestContext.http.method;
    if (method === "GET") {
      const queryParams = event.queryStringParameters || {};
      const key = queryParams.key;
      const action = queryParams.action;
      if (!key) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({
            error: "Missing required parameter: key"
          })
        };
      }
      if (action === "list") {
        const subpathStrategy = queryParams.subpathStrategy || "include";
        const command2 = new import_client_s3.ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: key,
          Delimiter: subpathStrategy === "exclude" ? "/" : void 0
        });
        const response = await s3Client.send(command2);
        const items = (response.Contents || []).map((item) => ({
          path: item.Key || "",
          eTag: item.ETag,
          lastModified: item.LastModified,
          size: item.Size
        }));
        const excludedSubpaths = subpathStrategy === "exclude" ? (response.CommonPrefixes || []).map((prefix) => prefix.Prefix || "") : [];
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({
            items,
            excludedSubpaths
          })
        };
      }
      const command = new import_client_s3.GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      const signedUrl = await (0, import_s3_request_presigner.getSignedUrl)(s3Client, command, { expiresIn: 3600 });
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          url: signedUrl,
          key,
          bucket: bucketName
        })
      };
    }
    if (method === "POST") {
      const contentType = event.headers["content-type"] || "";
      if (!contentType.includes("multipart/form-data")) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({
            error: "Content-Type must be multipart/form-data"
          })
        };
      }
      const body = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf-8") : event.body || "";
      const formData = parseMultipartFormData(body, contentType);
      const key = formData.get("key");
      const fileData = formData.get("file");
      const fileContentType = formData.get("contentType") || "application/octet-stream";
      if (!key || !fileData) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({
            error: "Missing required fields: key and file"
          })
        };
      }
      const command = new import_client_s3.PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: Buffer.from(fileData, "utf-8"),
        ContentType: fileContentType
      });
      await s3Client.send(command);
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          success: true,
          key,
          bucket: bucketName
        })
      };
    }
    if (method === "DELETE") {
      const queryParams = event.queryStringParameters || {};
      const key = queryParams.key;
      if (!key) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({
            error: "Missing required parameter: key"
          })
        };
      }
      const command = new import_client_s3.DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      await s3Client.send(command);
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          success: true,
          key,
          bucket: bucketName
        })
      };
    }
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Method not allowed"
      })
    };
  } catch (error) {
    console.error("[S3 Proxy API] Error:", error);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=index.js.map
