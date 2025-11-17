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

// lambda-functions/authorizer/handler.ts
var handler_exports = {};
__export(handler_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(handler_exports);

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/error.js
var JwtBaseError = class extends Error {
};
var FailedAssertionError = class extends JwtBaseError {
  constructor(msg, actual, expected) {
    super(msg);
    this.failedAssertion = {
      actual,
      expected
    };
  }
};
var JwtParseError = class extends JwtBaseError {
  constructor(msg, error) {
    const message = error != null ? `${msg}: ${error}` : msg;
    super(message);
  }
};
var ParameterValidationError = class extends JwtBaseError {
};
var JwtInvalidSignatureError = class extends JwtBaseError {
};
var JwtInvalidSignatureAlgorithmError = class extends FailedAssertionError {
};
var JwtInvalidClaimError = class extends FailedAssertionError {
  withRawJwt({ header, payload }) {
    this.rawJwt = {
      header,
      payload
    };
    return this;
  }
};
var JwtInvalidIssuerError = class extends JwtInvalidClaimError {
};
var JwtInvalidAudienceError = class extends JwtInvalidClaimError {
};
var JwtInvalidScopeError = class extends JwtInvalidClaimError {
};
var JwtExpiredError = class extends JwtInvalidClaimError {
};
var JwtNotBeforeError = class extends JwtInvalidClaimError {
};
var CognitoJwtInvalidGroupError = class extends JwtInvalidClaimError {
};
var CognitoJwtInvalidTokenUseError = class extends JwtInvalidClaimError {
};
var CognitoJwtInvalidClientIdError = class extends JwtInvalidClaimError {
};
var JwksValidationError = class extends JwtBaseError {
};
var JwkValidationError = class extends JwtBaseError {
};
var JwtWithoutValidKidError = class extends JwtBaseError {
};
var KidNotFoundInJwksError = class extends JwtBaseError {
};
var WaitPeriodNotYetEndedJwkError = class extends JwtBaseError {
};
var JwksNotAvailableInCacheError = class extends JwtBaseError {
};
var JwkInvalidUseError = class extends FailedAssertionError {
};
var JwkInvalidKtyError = class extends FailedAssertionError {
};
var FetchError = class extends JwtBaseError {
  constructor(uri, msg) {
    super(`Failed to fetch ${uri}: ${msg}`);
  }
};
var NonRetryableFetchError = class extends FetchError {
};

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/node-web-compat-node.js
var import_crypto = require("crypto");

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/asn1.js
var Asn1Class;
(function(Asn1Class2) {
  Asn1Class2[Asn1Class2["Universal"] = 0] = "Universal";
})(Asn1Class || (Asn1Class = {}));
var Asn1Encoding;
(function(Asn1Encoding2) {
  Asn1Encoding2[Asn1Encoding2["Primitive"] = 0] = "Primitive";
  Asn1Encoding2[Asn1Encoding2["Constructed"] = 1] = "Constructed";
})(Asn1Encoding || (Asn1Encoding = {}));
var Asn1Tag;
(function(Asn1Tag2) {
  Asn1Tag2[Asn1Tag2["BitString"] = 3] = "BitString";
  Asn1Tag2[Asn1Tag2["ObjectIdentifier"] = 6] = "ObjectIdentifier";
  Asn1Tag2[Asn1Tag2["Sequence"] = 16] = "Sequence";
  Asn1Tag2[Asn1Tag2["Null"] = 5] = "Null";
  Asn1Tag2[Asn1Tag2["Integer"] = 2] = "Integer";
})(Asn1Tag || (Asn1Tag = {}));
function encodeIdentifier(identifier) {
  const identifierAsNumber = identifier.class << 7 | identifier.primitiveOrConstructed << 5 | identifier.tag;
  return Buffer.from([identifierAsNumber]);
}
function encodeLength(length) {
  if (length < 128) {
    return Buffer.from([length]);
  }
  const integers = [];
  while (length > 0) {
    integers.push(length % 256);
    length = length >> 8;
  }
  integers.reverse();
  return Buffer.from([128 | integers.length, ...integers]);
}
function encodeBufferAsPositiveInteger(buffer) {
  if (buffer[0] >> 7) {
    buffer = Buffer.concat([Buffer.from([0]), buffer]);
  }
  return Buffer.concat([
    encodeIdentifier({
      class: Asn1Class.Universal,
      primitiveOrConstructed: Asn1Encoding.Primitive,
      tag: Asn1Tag.Integer
    }),
    encodeLength(buffer.length),
    buffer
  ]);
}
function encodeObjectIdentifier(oid) {
  const oidComponents = oid.split(".").map((i) => parseInt(i));
  const firstSubidentifier = oidComponents[0] * 40 + oidComponents[1];
  const subsequentSubidentifiers = oidComponents.slice(2).reduce((expanded, component) => {
    const bytes = [];
    do {
      bytes.push(component % 128);
      component = component >> 7;
    } while (component);
    return expanded.concat(bytes.map((b, index) => index ? b + 128 : b).reverse());
  }, []);
  const oidBuffer = Buffer.from([
    firstSubidentifier,
    ...subsequentSubidentifiers
  ]);
  return Buffer.concat([
    encodeIdentifier({
      class: Asn1Class.Universal,
      primitiveOrConstructed: Asn1Encoding.Primitive,
      tag: Asn1Tag.ObjectIdentifier
    }),
    encodeLength(oidBuffer.length),
    oidBuffer
  ]);
}
function encodeBufferAsBitString(buffer) {
  const bitString = Buffer.concat([Buffer.from([0]), buffer]);
  return Buffer.concat([
    encodeIdentifier({
      class: Asn1Class.Universal,
      primitiveOrConstructed: Asn1Encoding.Primitive,
      tag: Asn1Tag.BitString
    }),
    encodeLength(bitString.length),
    bitString
  ]);
}
function encodeSequence(sequenceItems) {
  const concatenated = Buffer.concat(sequenceItems);
  return Buffer.concat([
    encodeIdentifier({
      class: Asn1Class.Universal,
      primitiveOrConstructed: Asn1Encoding.Constructed,
      tag: Asn1Tag.Sequence
    }),
    encodeLength(concatenated.length),
    concatenated
  ]);
}
function encodeNull() {
  return Buffer.concat([
    encodeIdentifier({
      class: Asn1Class.Universal,
      primitiveOrConstructed: Asn1Encoding.Primitive,
      tag: Asn1Tag.Null
    }),
    encodeLength(0)
  ]);
}
var ALGORITHM_RSA_ENCRYPTION = encodeSequence([
  encodeObjectIdentifier("1.2.840.113549.1.1.1"),
  encodeNull()
  // parameters
]);
function constructPublicKeyInDerFormat(n, e) {
  return encodeSequence([
    ALGORITHM_RSA_ENCRYPTION,
    encodeBufferAsBitString(encodeSequence([
      encodeBufferAsPositiveInteger(n),
      encodeBufferAsPositiveInteger(e)
    ]))
  ]);
}

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/https-node.js
var import_https = require("https");

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/https-common.js
function validateHttpsJsonResponse(uri, statusCode, contentType) {
  if (statusCode === 429) {
    throw new FetchError(uri, "Too many requests");
  } else if (statusCode !== 200) {
    throw new NonRetryableFetchError(uri, `Status code is ${statusCode}, expected 200`);
  }
  if (!contentType || !contentType.toLowerCase().startsWith("application/json")) {
    throw new NonRetryableFetchError(uri, `Content-type is "${contentType}", expected "application/json"`);
  }
}

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/https-node.js
var import_stream = require("stream");
var import_util = require("util");

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/safe-json-parse.js
function isJsonObject(j) {
  return typeof j === "object" && !Array.isArray(j) && j !== null;
}
function safeJsonParse(s) {
  return JSON.parse(s, (_, value) => {
    if (typeof value === "object" && !Array.isArray(value) && value !== null) {
      delete value.__proto__;
      delete value.constructor;
    }
    return value;
  });
}

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/https-node.js
async function fetchJson(uri, requestOptions, data) {
  let responseTimeout;
  return new Promise((resolve, reject) => {
    const req = (0, import_https.request)(uri, {
      method: "GET",
      ...requestOptions
    }, (response) => {
      (0, import_stream.pipeline)([
        response,
        getJsonDestination(uri, response.statusCode, response.headers)
      ], done);
    });
    if (requestOptions?.responseTimeout) {
      responseTimeout = setTimeout(() => done(new FetchError(uri, `Response time-out (after ${requestOptions.responseTimeout} ms.)`)), requestOptions.responseTimeout);
      responseTimeout.unref();
    }
    function done(...args) {
      if (responseTimeout)
        clearTimeout(responseTimeout);
      if (args[0] == null) {
        resolve(args[1]);
        return;
      }
      req.socket?.emit("agentRemove");
      let error = args[0];
      if (!(error instanceof FetchError)) {
        error = new FetchError(uri, error.message);
      }
      req.destroy();
      reject(error);
    }
    req.on("error", done);
    req.end(data);
  });
}
function getJsonDestination(uri, statusCode, headers) {
  return async (responseIterable) => {
    validateHttpsJsonResponse(uri, statusCode, headers["content-type"]);
    const collected = [];
    for await (const chunk of responseIterable) {
      collected.push(chunk);
    }
    try {
      return safeJsonParse(new import_util.TextDecoder("utf8", { fatal: true, ignoreBOM: true }).decode(Buffer.concat(collected)));
    } catch (err) {
      throw new NonRetryableFetchError(uri, err);
    }
  };
}

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/node-web-compat-node.js
var JwtSignatureAlgorithms;
(function(JwtSignatureAlgorithms2) {
  JwtSignatureAlgorithms2["RS256"] = "RSA-SHA256";
  JwtSignatureAlgorithms2["RS384"] = "RSA-SHA384";
  JwtSignatureAlgorithms2["RS512"] = "RSA-SHA512";
})(JwtSignatureAlgorithms || (JwtSignatureAlgorithms = {}));
var nodeWebCompat = {
  fetchJson,
  transformJwkToKeyObjectSync: (jwk) => (0, import_crypto.createPublicKey)({
    key: constructPublicKeyInDerFormat(Buffer.from(jwk.n, "base64"), Buffer.from(jwk.e, "base64")),
    format: "der",
    type: "spki"
  }),
  transformJwkToKeyObjectAsync: async (jwk) => (0, import_crypto.createPublicKey)({
    key: constructPublicKeyInDerFormat(Buffer.from(jwk.n, "base64"), Buffer.from(jwk.e, "base64")),
    format: "der",
    type: "spki"
  }),
  parseB64UrlString: (b64) => Buffer.from(b64, "base64").toString("utf8"),
  verifySignatureSync: ({ alg, keyObject, jwsSigningInput, signature }) => (
    // eslint-disable-next-line security/detect-object-injection
    (0, import_crypto.createVerify)(JwtSignatureAlgorithms[alg]).update(jwsSigningInput).verify(keyObject, signature, "base64")
  ),
  verifySignatureAsync: async ({ alg, keyObject, jwsSigningInput, signature }) => (
    // eslint-disable-next-line security/detect-object-injection
    (0, import_crypto.createVerify)(JwtSignatureAlgorithms[alg]).update(jwsSigningInput).verify(keyObject, signature, "base64")
  ),
  defaultFetchTimeouts: {
    socketIdle: 500,
    response: 1500
  },
  setTimeoutUnref: (...args) => setTimeout(...args).unref()
};

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/https.js
var fetchJson2 = nodeWebCompat.fetchJson;
var SimpleJsonFetcher = class {
  constructor(props) {
    this.defaultRequestOptions = {
      timeout: nodeWebCompat.defaultFetchTimeouts.socketIdle,
      responseTimeout: nodeWebCompat.defaultFetchTimeouts.response,
      ...props?.defaultRequestOptions
    };
  }
  /**
   * Execute a HTTPS request (with 1 immediate retry in case of errors)
   * @param uri - The URI
   * @param requestOptions - The RequestOptions to use
   * @param data - Data to send to the URI (e.g. POST data)
   * @returns - The response as parsed JSON
   */
  async fetch(uri, requestOptions, data) {
    requestOptions = { ...this.defaultRequestOptions, ...requestOptions };
    try {
      return await fetchJson2(uri, requestOptions, data);
    } catch (err) {
      if (err instanceof NonRetryableFetchError) {
        throw err;
      }
      return fetchJson2(uri, requestOptions, data);
    }
  }
};

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/assert.js
function assertStringEquals(name, actual, expected, errorConstructor = FailedAssertionError) {
  if (!actual) {
    throw new errorConstructor(`Missing ${name}. Expected: ${expected}`, actual, expected);
  }
  if (typeof actual !== "string") {
    throw new errorConstructor(`${name} is not of type string`, actual, expected);
  }
  if (expected !== actual) {
    throw new errorConstructor(`${name} not allowed: ${actual}. Expected: ${expected}`, actual, expected);
  }
}
function assertStringArrayContainsString(name, actual, expected, errorConstructor = FailedAssertionError) {
  if (!actual) {
    throw new errorConstructor(`Missing ${name}. ${expectationMessage(expected)}`, actual, expected);
  }
  if (typeof actual !== "string") {
    throw new errorConstructor(`${name} is not of type string`, actual, expected);
  }
  return assertStringArraysOverlap(name, actual, expected, errorConstructor);
}
function assertStringArraysOverlap(name, actual, expected, errorConstructor = FailedAssertionError) {
  if (!actual) {
    throw new errorConstructor(`Missing ${name}. ${expectationMessage(expected)}`, actual, expected);
  }
  const expectedAsSet = new Set(Array.isArray(expected) ? expected : [expected]);
  if (typeof actual === "string") {
    actual = [actual];
  }
  if (!Array.isArray(actual)) {
    throw new errorConstructor(`${name} is not an array`, actual, expected);
  }
  const overlaps = actual.some((actualItem) => {
    if (typeof actualItem !== "string") {
      throw new errorConstructor(`${name} includes elements that are not of type string`, actual, expected);
    }
    return expectedAsSet.has(actualItem);
  });
  if (!overlaps) {
    throw new errorConstructor(`${name} not allowed: ${actual.join(", ")}. ${expectationMessage(expected)}`, actual, expected);
  }
}
function expectationMessage(expected) {
  if (Array.isArray(expected)) {
    if (expected.length > 1) {
      return `Expected one of: ${expected.join(", ")}`;
    }
    return `Expected: ${expected[0]}`;
  }
  return `Expected: ${expected}`;
}
function assertIsNotPromise(actual, errorFactory) {
  if (actual && typeof actual.then === "function") {
    throw errorFactory();
  }
}

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/jwk.js
var optionalJwkFieldNames = [
  "use",
  "alg",
  "kid",
  "n",
  "e"
  // https://datatracker.ietf.org/doc/html/rfc7518#section-6.3.1.2
];
var mandatoryJwkFieldNames = [
  "kty"
  // https://datatracker.ietf.org/doc/html/rfc7517#section-4.1
];
function findJwkInJwks(jwks, kid) {
  return jwks.keys.find((jwk) => jwk.kid != null && jwk.kid === kid);
}
async function fetchJwks(jwksUri) {
  const jwks = await fetchJson2(jwksUri);
  assertIsJwks(jwks);
  return jwks;
}
async function fetchJwk(jwksUri, decomposedJwt) {
  if (!decomposedJwt.header.kid) {
    throw new JwtWithoutValidKidError("JWT header does not have valid kid claim");
  }
  const jwks = await fetchJwks(jwksUri);
  const jwk = findJwkInJwks(jwks, decomposedJwt.header.kid);
  if (!jwk) {
    throw new KidNotFoundInJwksError(`JWK for kid "${decomposedJwt.header.kid}" not found in the JWKS`);
  }
  return jwk;
}
function assertIsJwks(jwks) {
  if (!jwks) {
    throw new JwksValidationError("JWKS empty");
  }
  if (!isJsonObject(jwks)) {
    throw new JwksValidationError("JWKS should be an object");
  }
  if (!Object.keys(jwks).includes("keys")) {
    throw new JwksValidationError("JWKS does not include keys");
  }
  if (!Array.isArray(jwks.keys)) {
    throw new JwksValidationError("JWKS keys should be an array");
  }
  for (const jwk of jwks.keys) {
    assertIsJwk(jwk);
  }
}
function assertIsRsaSignatureJwk(jwk) {
  assertStringEquals("JWK use", jwk.use, "sig", JwkInvalidUseError);
  assertStringEquals("JWK kty", jwk.kty, "RSA", JwkInvalidKtyError);
  if (!jwk.n)
    throw new JwkValidationError("Missing modulus (n)");
  if (!jwk.e)
    throw new JwkValidationError("Missing exponent (e)");
}
function assertIsJwk(jwk) {
  if (!jwk) {
    throw new JwkValidationError("JWK empty");
  }
  if (!isJsonObject(jwk)) {
    throw new JwkValidationError("JWK should be an object");
  }
  for (const field of mandatoryJwkFieldNames) {
    if (typeof jwk[field] !== "string") {
      throw new JwkValidationError(`JWK ${field} should be a string`);
    }
  }
  for (const field of optionalJwkFieldNames) {
    if (field in jwk && typeof jwk[field] !== "string") {
      throw new JwkValidationError(`JWK ${field} should be a string`);
    }
  }
}
function isJwks(jwks) {
  try {
    assertIsJwks(jwks);
    return true;
  } catch {
    return false;
  }
}
function isJwk(jwk) {
  try {
    assertIsJwk(jwk);
    return true;
  } catch {
    return false;
  }
}
var SimplePenaltyBox = class {
  constructor(props) {
    this.waitingUris = /* @__PURE__ */ new Map();
    this.waitSeconds = props?.waitSeconds ?? 10;
  }
  async wait(jwksUri) {
    if (this.waitingUris.has(jwksUri)) {
      throw new WaitPeriodNotYetEndedJwkError("Not allowed to fetch JWKS yet, still waiting for back off period to end");
    }
  }
  release(jwksUri) {
    const i = this.waitingUris.get(jwksUri);
    if (i) {
      clearTimeout(i);
      this.waitingUris.delete(jwksUri);
    }
  }
  registerFailedAttempt(jwksUri) {
    const i = nodeWebCompat.setTimeoutUnref(() => {
      this.waitingUris.delete(jwksUri);
    }, this.waitSeconds * 1e3);
    this.waitingUris.set(jwksUri, i);
  }
  registerSuccessfulAttempt(jwksUri) {
    this.release(jwksUri);
  }
};
var SimpleJwksCache = class {
  constructor(props) {
    this.jwksCache = /* @__PURE__ */ new Map();
    this.fetchingJwks = /* @__PURE__ */ new Map();
    this.penaltyBox = props?.penaltyBox ?? new SimplePenaltyBox();
    this.fetcher = props?.fetcher ?? new SimpleJsonFetcher();
  }
  addJwks(jwksUri, jwks) {
    this.jwksCache.set(jwksUri, jwks);
  }
  async getJwks(jwksUri) {
    const existingFetch = this.fetchingJwks.get(jwksUri);
    if (existingFetch) {
      return existingFetch;
    }
    const jwksPromise = this.fetcher.fetch(jwksUri).then((res) => {
      assertIsJwks(res);
      return res;
    });
    this.fetchingJwks.set(jwksUri, jwksPromise);
    let jwks;
    try {
      jwks = await jwksPromise;
    } finally {
      this.fetchingJwks.delete(jwksUri);
    }
    this.jwksCache.set(jwksUri, jwks);
    return jwks;
  }
  getCachedJwk(jwksUri, decomposedJwt) {
    if (typeof decomposedJwt.header.kid !== "string") {
      throw new JwtWithoutValidKidError("JWT header does not have valid kid claim");
    }
    if (!this.jwksCache.has(jwksUri)) {
      throw new JwksNotAvailableInCacheError(`JWKS for uri ${jwksUri} not yet available in cache`);
    }
    const jwk = findJwkInJwks(this.jwksCache.get(jwksUri), decomposedJwt.header.kid);
    if (!jwk) {
      throw new KidNotFoundInJwksError(`JWK for kid ${decomposedJwt.header.kid} not found in the JWKS`);
    }
    return jwk;
  }
  async getJwk(jwksUri, decomposedJwt) {
    if (typeof decomposedJwt.header.kid !== "string") {
      throw new JwtWithoutValidKidError("JWT header does not have valid kid claim");
    }
    const cachedJwks = this.jwksCache.get(jwksUri);
    if (cachedJwks) {
      const cachedJwk = findJwkInJwks(cachedJwks, decomposedJwt.header.kid);
      if (cachedJwk) {
        return cachedJwk;
      }
    }
    await this.penaltyBox.wait(jwksUri, decomposedJwt.header.kid);
    const jwks = await this.getJwks(jwksUri);
    const jwk = findJwkInJwks(jwks, decomposedJwt.header.kid);
    if (!jwk) {
      this.penaltyBox.registerFailedAttempt(jwksUri, decomposedJwt.header.kid);
      throw new KidNotFoundInJwksError(`JWK for kid "${decomposedJwt.header.kid}" not found in the JWKS`);
    } else {
      this.penaltyBox.registerSuccessfulAttempt(jwksUri, decomposedJwt.header.kid);
    }
    return jwk;
  }
};

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/jwt-model.js
var supportedSignatureAlgorithms = [
  "RS256",
  "RS384",
  "RS512"
];

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/jwt.js
function assertJwtHeader(header) {
  if (!isJsonObject(header)) {
    throw new JwtParseError("JWT header is not an object");
  }
  if (header.alg !== void 0 && typeof header.alg !== "string") {
    throw new JwtParseError("JWT header alg claim is not a string");
  }
  if (header.kid !== void 0 && typeof header.kid !== "string") {
    throw new JwtParseError("JWT header kid claim is not a string");
  }
}
function assertJwtPayload(payload) {
  if (!isJsonObject(payload)) {
    throw new JwtParseError("JWT payload is not an object");
  }
  if (payload.exp !== void 0 && !Number.isFinite(payload.exp)) {
    throw new JwtParseError("JWT payload exp claim is not a number");
  }
  if (payload.iss !== void 0 && typeof payload.iss !== "string") {
    throw new JwtParseError("JWT payload iss claim is not a string");
  }
  if (payload.sub !== void 0 && typeof payload.sub !== "string") {
    throw new JwtParseError("JWT payload sub claim is not a string");
  }
  if (payload.aud !== void 0 && typeof payload.aud !== "string" && (!Array.isArray(payload.aud) || payload.aud.some((aud) => typeof aud !== "string"))) {
    throw new JwtParseError("JWT payload aud claim is not a string or array of strings");
  }
  if (payload.nbf !== void 0 && !Number.isFinite(payload.nbf)) {
    throw new JwtParseError("JWT payload nbf claim is not a number");
  }
  if (payload.iat !== void 0 && !Number.isFinite(payload.iat)) {
    throw new JwtParseError("JWT payload iat claim is not a number");
  }
  if (payload.scope !== void 0 && typeof payload.scope !== "string") {
    throw new JwtParseError("JWT payload scope claim is not a string");
  }
  if (payload.jti !== void 0 && typeof payload.jti !== "string") {
    throw new JwtParseError("JWT payload jti claim is not a string");
  }
}
function decomposeUnverifiedJwt(jwt) {
  if (!jwt) {
    throw new JwtParseError("Empty JWT");
  }
  if (typeof jwt !== "string") {
    throw new JwtParseError("JWT is not a string");
  }
  if (!jwt.match(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)) {
    throw new JwtParseError("JWT string does not consist of exactly 3 parts (header, payload, signature)");
  }
  const [headerB64, payloadB64, signatureB64] = jwt.split(".");
  const [headerString, payloadString] = [headerB64, payloadB64].map(nodeWebCompat.parseB64UrlString);
  let header;
  try {
    header = safeJsonParse(headerString);
  } catch (err) {
    throw new JwtParseError("Invalid JWT. Header is not a valid JSON object", err);
  }
  assertJwtHeader(header);
  let payload;
  try {
    payload = safeJsonParse(payloadString);
  } catch (err) {
    throw new JwtParseError("Invalid JWT. Payload is not a valid JSON object", err);
  }
  assertJwtPayload(payload);
  return {
    header,
    headerB64,
    payload,
    payloadB64,
    signatureB64
  };
}
function validateJwtFields(payload, options) {
  if (payload.exp !== void 0) {
    if (payload.exp + (options.graceSeconds ?? 0) < Date.now() / 1e3) {
      throw new JwtExpiredError(`Token expired at ${new Date(payload.exp * 1e3).toISOString()}`, payload.exp);
    }
  }
  if (payload.nbf !== void 0) {
    if (payload.nbf - (options.graceSeconds ?? 0) > Date.now() / 1e3) {
      throw new JwtNotBeforeError(`Token can't be used before ${new Date(payload.nbf * 1e3).toISOString()}`, payload.nbf);
    }
  }
  if (options.issuer !== null) {
    if (options.issuer === void 0) {
      throw new ParameterValidationError("issuer must be provided or set to null explicitly");
    }
    assertStringArrayContainsString("Issuer", payload.iss, options.issuer, JwtInvalidIssuerError);
  }
  if (options.audience !== null) {
    if (options.audience === void 0) {
      throw new ParameterValidationError("audience must be provided or set to null explicitly");
    }
    assertStringArraysOverlap("Audience", payload.aud, options.audience, JwtInvalidAudienceError);
  }
  if (options.scope != null) {
    assertStringArraysOverlap("Scope", payload.scope?.split(" "), options.scope, JwtInvalidScopeError);
  }
}

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/jwt-rsa.js
function validateJwtHeaderAndJwk(header, jwk) {
  assertIsRsaSignatureJwk(jwk);
  if (jwk.alg) {
    assertStringEquals("JWT signature algorithm", header.alg, jwk.alg, JwtInvalidSignatureAlgorithmError);
  }
  assertStringArrayContainsString("JWT signature algorithm", header.alg, supportedSignatureAlgorithms, JwtInvalidSignatureAlgorithmError);
}
async function verifyDecomposedJwt(decomposedJwt, jwksUri, options, jwkFetcher = fetchJwk, transformJwkToKeyObjectFn = nodeWebCompat.transformJwkToKeyObjectAsync) {
  const { header, headerB64, payload, payloadB64, signatureB64 } = decomposedJwt;
  const jwk = await jwkFetcher(jwksUri, decomposedJwt);
  validateJwtHeaderAndJwk(decomposedJwt.header, jwk);
  const keyObject = await transformJwkToKeyObjectFn(jwk, header.alg, payload.iss);
  const valid = await nodeWebCompat.verifySignatureAsync({
    jwsSigningInput: `${headerB64}.${payloadB64}`,
    signature: signatureB64,
    alg: header.alg,
    keyObject
  });
  if (!valid) {
    throw new JwtInvalidSignatureError("Invalid signature");
  }
  try {
    validateJwtFields(payload, options);
    if (options.customJwtCheck) {
      await options.customJwtCheck({ header, payload, jwk });
    }
  } catch (err) {
    if (options.includeRawJwtInErrors && err instanceof JwtInvalidClaimError) {
      throw err.withRawJwt(decomposedJwt);
    }
    throw err;
  }
  return payload;
}
function verifyDecomposedJwtSync(decomposedJwt, jwkOrJwks, options, transformJwkToKeyObjectFn) {
  const { header, headerB64, payload, payloadB64, signatureB64 } = decomposedJwt;
  let jwk;
  if (isJwk(jwkOrJwks)) {
    jwk = jwkOrJwks;
  } else if (isJwks(jwkOrJwks)) {
    const locatedJwk = header.kid ? findJwkInJwks(jwkOrJwks, header.kid) : void 0;
    if (!locatedJwk) {
      throw new KidNotFoundInJwksError(`JWK for kid ${header.kid} not found in the JWKS`);
    }
    jwk = locatedJwk;
  } else {
    throw new ParameterValidationError([
      `Expected a valid JWK or JWKS (parsed as JavaScript object), but received: ${jwkOrJwks}.`,
      "If you're passing a JWKS URI, use the async verify() method instead, it will download and parse the JWKS for you"
    ].join());
  }
  validateJwtHeaderAndJwk(decomposedJwt.header, jwk);
  const keyObject = transformJwkToKeyObjectFn(jwk, header.alg, payload.iss);
  const valid = nodeWebCompat.verifySignatureSync({
    jwsSigningInput: `${headerB64}.${payloadB64}`,
    signature: signatureB64,
    alg: header.alg,
    keyObject
  });
  if (!valid) {
    throw new JwtInvalidSignatureError("Invalid signature");
  }
  try {
    validateJwtFields(payload, options);
    if (options.customJwtCheck) {
      const res = options.customJwtCheck({ header, payload, jwk });
      assertIsNotPromise(res, () => new ParameterValidationError("Custom JWT checks must be synchronous but a promise was returned"));
    }
  } catch (err) {
    if (options.includeRawJwtInErrors && err instanceof JwtInvalidClaimError) {
      throw err.withRawJwt(decomposedJwt);
    }
    throw err;
  }
  return payload;
}
var JwtRsaVerifierBase = class {
  constructor(verifyProperties, jwksCache = new SimpleJwksCache()) {
    this.jwksCache = jwksCache;
    this.issuersConfig = /* @__PURE__ */ new Map();
    this.publicKeyCache = new KeyObjectCache();
    if (Array.isArray(verifyProperties)) {
      if (!verifyProperties.length) {
        throw new ParameterValidationError("Provide at least one issuer configuration");
      }
      for (const prop of verifyProperties) {
        if (this.issuersConfig.has(prop.issuer)) {
          throw new ParameterValidationError(`issuer ${prop.issuer} supplied multiple times`);
        }
        this.issuersConfig.set(prop.issuer, this.withJwksUri(prop));
      }
    } else {
      this.issuersConfig.set(verifyProperties.issuer, this.withJwksUri(verifyProperties));
    }
  }
  get expectedIssuers() {
    return Array.from(this.issuersConfig.keys());
  }
  getIssuerConfig(issuer) {
    if (!issuer) {
      if (this.issuersConfig.size !== 1) {
        throw new ParameterValidationError("issuer must be provided");
      }
      issuer = this.issuersConfig.keys().next().value;
    }
    const config = this.issuersConfig.get(issuer);
    if (!config) {
      throw new ParameterValidationError(`issuer not configured: ${issuer}`);
    }
    return config;
  }
  /**
   * This method loads a JWKS that you provide, into the JWKS cache, so that it is
   * available for JWT verification. Use this method to speed up the first JWT verification
   * (when the JWKS would otherwise have to be downloaded from the JWKS uri), or to provide the JWKS
   * in case the JwtVerifier does not have internet access to download the JWKS
   *
   * @param jwksThe JWKS
   * @param issuer The issuer for which you want to cache the JWKS
   *  Supply this field, if you instantiated the JwtVerifier with multiple issuers
   * @returns void
   */
  cacheJwks(...[jwks, issuer]) {
    const issuerConfig = this.getIssuerConfig(issuer);
    this.jwksCache.addJwks(issuerConfig.jwksUri, jwks);
    this.publicKeyCache.clearCache(issuerConfig.issuer);
  }
  /**
   * Hydrate the JWKS cache for (all of) the configured issuer(s).
   * This will fetch and cache the latest and greatest JWKS for concerned issuer(s).
   *
   * @param issuer The issuer to fetch the JWKS for
   * @returns void
   */
  async hydrate() {
    const jwksFetches = this.expectedIssuers.map((issuer) => this.getIssuerConfig(issuer).jwksUri).map((jwksUri) => this.jwksCache.getJwks(jwksUri));
    await Promise.all(jwksFetches);
  }
  /**
   * Verify (synchronously) a JWT that is signed using RS256 / RS384 / RS512.
   *
   * @param jwt The JWT, as string
   * @param props Verification properties
   * @returns The payload of the JWT––if the JWT is valid, otherwise an error is thrown
   */
  verifySync(...[jwt, properties]) {
    const { decomposedJwt, jwksUri, verifyProperties } = this.getVerifyParameters(jwt, properties);
    return this.verifyDecomposedJwtSync(decomposedJwt, jwksUri, verifyProperties);
  }
  /**
   * Verify (synchronously) an already decomposed JWT, that is signed using RS256 / RS384 / RS512.
   *
   * @param decomposedJwt The decomposed Jwt
   * @param jwk The JWK to verify the JWTs signature with
   * @param verifyProperties The properties to use for verification
   * @returns The payload of the JWT––if the JWT is valid, otherwise an error is thrown
   */
  verifyDecomposedJwtSync(decomposedJwt, jwksUri, verifyProperties) {
    const jwk = this.jwksCache.getCachedJwk(jwksUri, decomposedJwt);
    return verifyDecomposedJwtSync(decomposedJwt, jwk, verifyProperties, this.publicKeyCache.transformJwkToKeyObjectSync.bind(this.publicKeyCache));
  }
  /**
   * Verify (asynchronously) a JWT that is signed using RS256 / RS384 / RS512.
   * This call is asynchronous, and the JWKS will be fetched from the JWKS uri,
   * in case it is not yet available in the cache.
   *
   * @param jwt The JWT, as string
   * @param props Verification properties
   * @returns Promise that resolves to the payload of the JWT––if the JWT is valid, otherwise the promise rejects
   */
  async verify(...[jwt, properties]) {
    const { decomposedJwt, jwksUri, verifyProperties } = this.getVerifyParameters(jwt, properties);
    return this.verifyDecomposedJwt(decomposedJwt, jwksUri, verifyProperties);
  }
  /**
   * Verify (asynchronously) an already decomposed JWT, that is signed using RS256 / RS384 / RS512.
   *
   * @param decomposedJwt The decomposed Jwt
   * @param jwk The JWK to verify the JWTs signature with
   * @param verifyProperties The properties to use for verification
   * @returns The payload of the JWT––if the JWT is valid, otherwise an error is thrown
   */
  verifyDecomposedJwt(decomposedJwt, jwksUri, verifyProperties) {
    return verifyDecomposedJwt(decomposedJwt, jwksUri, verifyProperties, this.jwksCache.getJwk.bind(this.jwksCache), this.publicKeyCache.transformJwkToKeyObjectAsync.bind(this.publicKeyCache));
  }
  /**
   * Get the verification parameters to use, by merging the issuer configuration,
   * with the overriding properties that are now provided
   *
   * @param jwt: the JWT that is going to be verified
   * @param verifyProperties: the overriding properties, that override the issuer configuration
   * @returns The merged verification parameters
   */
  getVerifyParameters(jwt, verifyProperties) {
    const decomposedJwt = decomposeUnverifiedJwt(jwt);
    assertStringArrayContainsString("Issuer", decomposedJwt.payload.iss, this.expectedIssuers, JwtInvalidIssuerError);
    const issuerConfig = this.getIssuerConfig(decomposedJwt.payload.iss);
    return {
      decomposedJwt,
      jwksUri: issuerConfig.jwksUri,
      verifyProperties: {
        ...issuerConfig,
        ...verifyProperties
      }
    };
  }
  /**
   * Get issuer config with JWKS URI, by adding a default JWKS URI if needed
   *
   * @param config: the issuer config.
   * @returns The config with JWKS URI
   */
  withJwksUri(config) {
    if (config.jwksUri) {
      return config;
    }
    const issuerUri = new URL(config.issuer).pathname.replace(/\/$/, "");
    return {
      jwksUri: new URL(`${issuerUri}/.well-known/jwks.json`, config.issuer).href,
      ...config
    };
  }
};
var KeyObjectCache = class {
  constructor(transformJwkToKeyObjectSyncFn = nodeWebCompat.transformJwkToKeyObjectSync, transformJwkToKeyObjectAsyncFn = nodeWebCompat.transformJwkToKeyObjectAsync) {
    this.transformJwkToKeyObjectSyncFn = transformJwkToKeyObjectSyncFn;
    this.transformJwkToKeyObjectAsyncFn = transformJwkToKeyObjectAsyncFn;
    this.publicKeys = /* @__PURE__ */ new Map();
  }
  /**
   * Transform the JWK into an RSA public key in native key object format.
   * If the transformed JWK is already in the cache, it is returned from the cache instead.
   *
   * @param jwk: the JWK
   * @param jwtHeaderAlg: the alg from the JWT header (used if absent on JWK)
   * @param issuer: the issuer that uses the JWK for signing JWTs (used for caching the transformation)
   * @returns the RSA public key in native key object format
   */
  transformJwkToKeyObjectSync(jwk, jwtHeaderAlg, issuer) {
    const alg = jwk.alg ?? jwtHeaderAlg;
    if (!issuer || !jwk.kid || !alg) {
      return this.transformJwkToKeyObjectSyncFn(jwk, alg, issuer);
    }
    const fromCache = this.publicKeys.get(issuer)?.get(jwk.kid)?.get(alg);
    if (fromCache)
      return fromCache;
    const publicKey = this.transformJwkToKeyObjectSyncFn(jwk, alg, issuer);
    this.putKeyObjectInCache(issuer, jwk.kid, alg, publicKey);
    return publicKey;
  }
  /**
   * Transform the JWK into an RSA public key in native key object format (async).
   * If the transformed JWK is already in the cache, it is returned from the cache instead.
   *
   * @param jwk: the JWK
   * @param jwtHeaderAlg: the alg from the JWT header (used if absent on JWK)
   * @param issuer: the issuer that uses the JWK for signing JWTs (used for caching the transformation)
   * @returns the RSA public key in native key object format
   */
  async transformJwkToKeyObjectAsync(jwk, jwtHeaderAlg, issuer) {
    const alg = jwk.alg ?? jwtHeaderAlg;
    if (!issuer || !jwk.kid || !alg) {
      return this.transformJwkToKeyObjectAsyncFn(jwk, alg, issuer);
    }
    const fromCache = this.publicKeys.get(issuer)?.get(jwk.kid)?.get(alg);
    if (fromCache)
      return fromCache;
    const publicKey = await this.transformJwkToKeyObjectAsyncFn(jwk, alg, issuer);
    this.putKeyObjectInCache(issuer, jwk.kid, alg, publicKey);
    return publicKey;
  }
  putKeyObjectInCache(issuer, kid, alg, publicKey) {
    const cachedIssuer = this.publicKeys.get(issuer);
    const cachedIssuerKid = cachedIssuer?.get(kid);
    if (cachedIssuerKid) {
      cachedIssuerKid.set(alg, publicKey);
    } else if (cachedIssuer) {
      cachedIssuer.set(kid, /* @__PURE__ */ new Map([[alg, publicKey]]));
    } else {
      this.publicKeys.set(issuer, /* @__PURE__ */ new Map([[kid, /* @__PURE__ */ new Map([[alg, publicKey]])]]));
    }
  }
  clearCache(issuer) {
    this.publicKeys.delete(issuer);
  }
};

// lambda-functions/authorizer/node_modules/aws-jwt-verify/dist/esm/cognito-verifier.js
function validateCognitoJwtFields(payload, options) {
  if (options.groups != null) {
    assertStringArraysOverlap("Cognito group", payload["cognito:groups"], options.groups, CognitoJwtInvalidGroupError);
  }
  assertStringArrayContainsString("Token use", payload.token_use, ["id", "access"], CognitoJwtInvalidTokenUseError);
  if (options.tokenUse !== null) {
    if (options.tokenUse === void 0) {
      throw new ParameterValidationError("tokenUse must be provided or set to null explicitly");
    }
    assertStringEquals("Token use", payload.token_use, options.tokenUse, CognitoJwtInvalidTokenUseError);
  }
  if (options.clientId !== null) {
    if (options.clientId === void 0) {
      throw new ParameterValidationError("clientId must be provided or set to null explicitly");
    }
    if (payload.token_use === "id") {
      assertStringArrayContainsString('Client ID ("audience")', payload.aud, options.clientId, CognitoJwtInvalidClientIdError);
    } else {
      assertStringArrayContainsString("Client ID", payload.client_id, options.clientId, CognitoJwtInvalidClientIdError);
    }
  }
}
var CognitoJwtVerifier = class _CognitoJwtVerifier extends JwtRsaVerifierBase {
  constructor(props, jwksCache) {
    const issuerConfig = Array.isArray(props) ? props.map((p) => ({
      ...p,
      ..._CognitoJwtVerifier.parseUserPoolId(p.userPoolId),
      audience: null
      // checked instead by validateCognitoJwtFields
    })) : {
      ...props,
      ..._CognitoJwtVerifier.parseUserPoolId(props.userPoolId),
      audience: null
      // checked instead by validateCognitoJwtFields
    };
    super(issuerConfig, jwksCache);
  }
  /**
   * Parse a User Pool ID, to extract the issuer and JWKS URI
   *
   * @param userPoolId The User Pool ID
   * @returns The issuer and JWKS URI for the User Pool
   */
  static parseUserPoolId(userPoolId) {
    const match = userPoolId.match(/^(?<region>(\w+-)?\w+-\w+-\d)+_\w+$/);
    if (!match) {
      throw new ParameterValidationError(`Invalid Cognito User Pool ID: ${userPoolId}`);
    }
    const region = match.groups.region;
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    return {
      issuer,
      jwksUri: `${issuer}/.well-known/jwks.json`
    };
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static create(verifyProperties, additionalProperties) {
    return new this(verifyProperties, additionalProperties?.jwksCache);
  }
  /**
   * Verify (synchronously) a JWT that is signed by Amazon Cognito.
   *
   * @param jwt The JWT, as string
   * @param props Verification properties
   * @returns The payload of the JWT––if the JWT is valid, otherwise an error is thrown
   */
  verifySync(...[jwt, properties]) {
    const { decomposedJwt, jwksUri, verifyProperties } = this.getVerifyParameters(jwt, properties);
    this.verifyDecomposedJwtSync(decomposedJwt, jwksUri, verifyProperties);
    try {
      validateCognitoJwtFields(decomposedJwt.payload, verifyProperties);
    } catch (err) {
      if (verifyProperties.includeRawJwtInErrors && err instanceof JwtInvalidClaimError) {
        throw err.withRawJwt(decomposedJwt);
      }
      throw err;
    }
    return decomposedJwt.payload;
  }
  /**
   * Verify (asynchronously) a JWT that is signed by Amazon Cognito.
   * This call is asynchronous, and the JWKS will be fetched from the JWKS uri,
   * in case it is not yet available in the cache.
   *
   * @param jwt The JWT, as string
   * @param props Verification properties
   * @returns Promise that resolves to the payload of the JWT––if the JWT is valid, otherwise the promise rejects
   */
  async verify(...[jwt, properties]) {
    const { decomposedJwt, jwksUri, verifyProperties } = this.getVerifyParameters(jwt, properties);
    await this.verifyDecomposedJwt(decomposedJwt, jwksUri, verifyProperties);
    try {
      validateCognitoJwtFields(decomposedJwt.payload, verifyProperties);
    } catch (err) {
      if (verifyProperties.includeRawJwtInErrors && err instanceof JwtInvalidClaimError) {
        throw err.withRawJwt(decomposedJwt);
      }
      throw err;
    }
    return decomposedJwt.payload;
  }
  /**
   * This method loads a JWKS that you provide, into the JWKS cache, so that it is
   * available for JWT verification. Use this method to speed up the first JWT verification
   * (when the JWKS would otherwise have to be downloaded from the JWKS uri), or to provide the JWKS
   * in case the JwtVerifier does not have internet access to download the JWKS
   *
   * @param jwks The JWKS
   * @param userPoolId The userPoolId for which you want to cache the JWKS
   *  Supply this field, if you instantiated the CognitoJwtVerifier with multiple userPoolIds
   * @returns void
   */
  cacheJwks(...[jwks, userPoolId]) {
    let issuer;
    if (userPoolId !== void 0) {
      issuer = _CognitoJwtVerifier.parseUserPoolId(userPoolId).issuer;
    } else if (this.expectedIssuers.length > 1) {
      throw new ParameterValidationError("userPoolId must be provided");
    }
    const issuerConfig = this.getIssuerConfig(issuer);
    super.cacheJwks(jwks, issuerConfig.issuer);
  }
};

// lambda-functions/authorizer/handler.ts
var verifier = null;
function getVerifier() {
  if (!verifier) {
    const USER_POOL_ID = process.env.USER_POOL_ID || "";
    const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || "";
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      throw new Error("USER_POOL_ID and USER_POOL_CLIENT_ID must be set");
    }
    verifier = CognitoJwtVerifier.create({
      userPoolId: USER_POOL_ID,
      tokenUse: "id",
      // Changed from 'access' to 'id' to match frontend
      clientId: USER_POOL_CLIENT_ID
    });
  }
  return verifier;
}
async function handler(event) {
  const ENABLE_MOCK_AUTH = process.env.ENABLE_MOCK_AUTH === "true";
  console.log("Authorizer invoked:", {
    eventType: event.type || event.version,
    headers: event.headers ? Object.keys(event.headers) : "none",
    identitySource: event.identitySource,
    mockAuthEnabled: ENABLE_MOCK_AUTH
  });
  try {
    let token;
    let methodArn;
    if (event.identitySource && Array.isArray(event.identitySource)) {
      token = event.identitySource[0];
      methodArn = event.routeArn;
    } else if (event.authorizationToken) {
      token = event.authorizationToken;
      methodArn = event.methodArn;
    } else if (event.headers && event.headers.authorization) {
      token = event.headers.authorization;
      methodArn = event.requestContext?.routeArn || event.methodArn || "*";
    } else {
      console.error("No authorization token found in event");
      throw new Error("Unauthorized");
    }
    if (!token) {
      console.error("No authorization token provided");
      throw new Error("Unauthorized");
    }
    console.log("Token found:", token.substring(0, 30) + "...");
    const cleanToken = token.replace(/^Bearer\s+/i, "");
    if (ENABLE_MOCK_AUTH && cleanToken.startsWith("mock-dev-token-")) {
      console.log("Mock development token detected - allowing access");
      return generatePolicy("mock-user", "Allow", methodArn, {
        userId: "mock-user",
        email: "dev@example.com",
        authType: "mock"
      });
    }
    try {
      const cognitoVerifier = getVerifier();
      const payload = await cognitoVerifier.verify(cleanToken);
      console.log("Cognito JWT verified successfully:", {
        sub: payload.sub,
        username: payload.username
      });
      return generatePolicy(payload.sub, "Allow", methodArn, {
        userId: payload.sub,
        username: payload.username || payload["cognito:username"],
        email: payload.email,
        authType: "cognito"
      });
    } catch (verifyError) {
      console.error("Cognito JWT verification failed:", verifyError.message);
      if (ENABLE_MOCK_AUTH) {
        console.log("Cognito verification failed but mock auth is enabled. Use mock-dev-token-* for development.");
      }
      throw new Error("Unauthorized");
    }
  } catch (error) {
    console.error("Authorization error:", error.message);
    throw new Error("Unauthorized");
  }
}
function generatePolicy(principalId, effect, resource, context) {
  const response = {
    isAuthorized: effect === "Allow",
    context: context || {}
  };
  return response;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=index.js.map
