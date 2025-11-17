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

// lambda-functions/osdu/handler.ts
var handler_exports = {};
__export(handler_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(handler_exports);
var handler = async (event) => {
  console.log("\u{1F50D} OSDU REST API Handler:", JSON.stringify(event, null, 2));
  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;
  try {
    if (path === "/api/osdu/search" && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { query, dataPartition = "osdu", maxResults = 1e3 } = body;
      console.log("\u{1F50D} OSDU Search:", { query, dataPartition, maxResults });
      if (!query || query.trim().length === 0) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Query parameter is required",
            answer: "Please provide a search query.",
            recordCount: 0,
            records: []
          })
        };
      }
      if (maxResults < 1 || maxResults > 1e4) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "maxResults must be between 1 and 10000",
            answer: "Invalid search parameters.",
            recordCount: 0,
            records: []
          })
        };
      }
      const apiUrl = process.env.OSDU_API_URL;
      const apiKey = process.env.OSDU_API_KEY;
      if (!apiUrl || !apiKey) {
        console.error("\u274C OSDU API configuration missing");
        return {
          statusCode: 503,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "OSDU API is not configured",
            answer: "The OSDU search service is not currently available.",
            recordCount: 0,
            records: []
          })
        };
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5e4);
      let response;
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify({
            query,
            dataPartition,
            maxResults
          }),
          signal: controller.signal
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          return {
            statusCode: 504,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              error: "Request timeout",
              answer: "The OSDU search request timed out.",
              recordCount: 0,
              records: []
            })
          };
        }
        return {
          statusCode: 502,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Network error",
            answer: "Unable to reach OSDU service.",
            recordCount: 0,
            records: []
          })
        };
      }
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("\u274C OSDU API error:", response.status, errorText);
        return {
          statusCode: response.status,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: `OSDU API request failed: ${response.status}`,
            answer: "Unable to search OSDU data at this time.",
            recordCount: 0,
            records: []
          })
        };
      }
      let rawData;
      try {
        rawData = await response.json();
      } catch (parseError) {
        return {
          statusCode: 502,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Invalid response from OSDU API",
            answer: "Received invalid data from OSDU service.",
            recordCount: 0,
            records: []
          })
        };
      }
      let answer = rawData.response || rawData.answer || "Search completed";
      let recordCount = 0;
      let records = [];
      if (rawData.reasoningSteps && Array.isArray(rawData.reasoningSteps)) {
        for (const step of rawData.reasoningSteps) {
          if (step.type === "tool_result" && step.result?.body?.records) {
            records = step.result.body.records;
            recordCount = step.result.body.metadata?.totalFound || step.result.body.metadata?.returned || records.length;
            break;
          }
        }
      }
      if (records.length === 0 && rawData.records) {
        records = rawData.records;
        recordCount = rawData.recordCount || records.length;
      }
      const result = {
        answer,
        recordCount,
        records
      };
      console.log("\u2705 OSDU search successful:", { recordCount, recordsLength: records.length });
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
      };
    }
    if (path.startsWith("/api/osdu/wells/") && method === "GET") {
      const wellId = path.split("/").pop();
      console.log("\u{1F50D} Get OSDU well:", wellId);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: wellId,
          message: "Well detail endpoint - to be implemented"
        })
      };
    }
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Not found" })
    };
  } catch (error) {
    console.error("\u274C OSDU API error:", error);
    let sanitizedMessage = "An unexpected error occurred";
    if (error instanceof Error) {
      sanitizedMessage = error.message.replace(/[a-zA-Z0-9]{40,}/g, "[REDACTED]").replace(/https?:\/\/[^\s]+/g, "[URL]").replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[IP]");
    }
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: sanitizedMessage,
        answer: "An unexpected error occurred while searching OSDU data.",
        recordCount: 0,
        records: []
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=index.js.map
