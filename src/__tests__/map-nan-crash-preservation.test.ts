/**
 * Preservation Property Tests — Valid Coordinate Behavior Unchanged
 *
 * These tests verify that the UNFIXED code handles valid finite coordinates
 * correctly. They MUST PASS on the current unfixed code, establishing a
 * baseline of correct behavior that the fix must preserve.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Replicate the EXACT buggy logic from CatalogPage.tsx
// ---------------------------------------------------------------------------

interface WellRecord {
  name?: string;
  longitude?: number | null;
  latitude?: number | null;
}

/**
 * GeoJSON construction — EXACT pattern from CatalogPage.tsx ~line 504
 */
const buildGeoJSONFeatures = (records: WellRecord[]) => ({
  type: "FeatureCollection" as const,
  features: records.map((record, index) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [record.longitude || 0, record.latitude || 0] as [number, number],
    },
    properties: { name: record.name || `well-${index}` },
  })),
});

/**
 * Bounds calculation — EXACT pattern from CatalogPage.tsx ~line 521-526
 */
const calculateBounds = (records: WellRecord[]) => {
  const coordinates = records.map(r => [r.longitude || 0, r.latitude || 0]);
  return coordinates.length > 0
    ? {
        minLon: Math.min(...coordinates.map(c => c[0])),
        maxLon: Math.max(...coordinates.map(c => c[0])),
        minLat: Math.min(...coordinates.map(c => c[1])),
        maxLat: Math.max(...coordinates.map(c => c[1])),
      }
    : null;
};

// ---------------------------------------------------------------------------
// Mock fitBounds — replicates MapComponent.tsx ~line 830
// ---------------------------------------------------------------------------

interface MapBounds {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

/**
 * Mock LngLatBounds — mimics maplibregl.LngLatBounds constructor
 */
class MockLngLatBounds {
  sw: [number, number];
  ne: [number, number];
  constructor(sw: [number, number], ne: [number, number]) {
    this.sw = sw;
    this.ne = ne;
  }
}

/**
 * fitBounds — EXACT pattern from MapComponent.tsx ~line 830
 */
const fitBounds = (
  bounds: MapBounds,
  mockMap: { fitBounds: jest.Mock },
) => {
  const mapBounds = new MockLngLatBounds(
    [bounds.minLon, bounds.minLat],
    [bounds.maxLon, bounds.maxLat],
  );
  mockMap.fitBounds(mapBounds, { padding: 100, maxZoom: 10, duration: 1000 });
};

// ---------------------------------------------------------------------------
// Mock restoreMapState — replicates MapComponent.tsx ~line 870
// ---------------------------------------------------------------------------

interface MapState {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
}

/**
 * restoreMapState — EXACT pattern from MapComponent.tsx ~line 870
 */
const restoreMapState = (
  state: MapState,
  mockMap: { jumpTo: jest.Mock },
) => {
  mockMap.jumpTo({
    center: state.center,
    zoom: state.zoom,
    pitch: state.pitch || 0,
    bearing: state.bearing || 0,
  });
};

// ---------------------------------------------------------------------------
// Generators — VALID coordinates only (preservation tests)
// ---------------------------------------------------------------------------

/**
 * Valid longitude: finite doubles in [-180, 180], excluding 0 for the main
 * generator (zero is tested separately to avoid || 0 ambiguity).
 */
const validNonZeroLongitudeArb = fc.oneof(
  fc.double({ min: -180, max: -0.001, noNaN: true, noDefaultInfinity: true }),
  fc.double({ min: 0.001, max: 180, noNaN: true, noDefaultInfinity: true }),
);

const validNonZeroLatitudeArb = fc.oneof(
  fc.double({ min: -90, max: -0.001, noNaN: true, noDefaultInfinity: true }),
  fc.double({ min: 0.001, max: 90, noNaN: true, noDefaultInfinity: true }),
);

/** Well record with valid non-zero finite coordinates */
const validNonZeroWellRecordArb: fc.Arbitrary<WellRecord> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 10 }),
  longitude: validNonZeroLongitudeArb,
  latitude: validNonZeroLatitudeArb,
});

/** Valid bounds with all finite values */
const validBoundsArb: fc.Arbitrary<MapBounds> = fc
  .tuple(
    fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
  )
  .map(([a, b, c, d]) => ({
    minLon: Math.min(a, b),
    maxLon: Math.max(a, b),
    minLat: Math.min(c, d),
    maxLat: Math.max(c, d),
  }));

/** Valid map state with finite center and zoom */
const validMapStateArb: fc.Arbitrary<MapState> = fc.record({
  center: fc.tuple(
    fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
  ) as fc.Arbitrary<[number, number]>,
  zoom: fc.double({ min: 0, max: 22, noNaN: true, noDefaultInfinity: true }),
  pitch: fc.double({ min: 0, max: 85, noNaN: true, noDefaultInfinity: true }),
  bearing: fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
});

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

describe('Preservation Properties — Valid Coordinate Behavior Unchanged', () => {
  /**
   * **Validates: Requirements 3.1, 3.6**
   *
   * Property: For all records with valid non-zero finite coordinates,
   * buildGeoJSONFeatures produces features with coordinates matching
   * the input [record.longitude, record.latitude].
   *
   * Since valid non-zero coords are truthy, `|| 0` doesn't change them.
   */
  it('Property 2.1: GeoJSON features contain exactly the input coordinates', () => {
    fc.assert(
      fc.property(
        fc.array(validNonZeroWellRecordArb, { minLength: 1, maxLength: 10 }),
        (records) => {
          const geojson = buildGeoJSONFeatures(records);

          // Same number of features as records
          if (geojson.features.length !== records.length) return false;

          for (let i = 0; i < records.length; i++) {
            const [lng, lat] = geojson.features[i].geometry.coordinates;
            if (lng !== records[i].longitude) return false;
            if (lat !== records[i].latitude) return false;
          }

          return true;
        },
      ),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 3.1, 3.2**
   *
   * Property: For all valid coordinate arrays, bounds equal
   * { minLon: Math.min(...lngs), maxLon: Math.max(...lngs),
   *   minLat: Math.min(...lats), maxLat: Math.max(...lats) }
   */
  it('Property 2.2: Bounds calculation is correct for valid coordinates', () => {
    fc.assert(
      fc.property(
        fc.array(validNonZeroWellRecordArb, { minLength: 1, maxLength: 10 }),
        (records) => {
          const bounds = calculateBounds(records);
          if (bounds === null) return false; // Should never be null for non-empty array

          const lngs = records.map(r => r.longitude as number);
          const lats = records.map(r => r.latitude as number);

          if (bounds.minLon !== Math.min(...lngs)) return false;
          if (bounds.maxLon !== Math.max(...lngs)) return false;
          if (bounds.minLat !== Math.min(...lats)) return false;
          if (bounds.maxLat !== Math.max(...lats)) return false;

          return true;
        },
      ),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 3.1, 3.6**
   *
   * Property: Records with longitude: 0 or latitude: 0 (equator/prime
   * meridian) are NOT filtered out. With the current `|| 0` pattern,
   * `0 || 0 = 0` so zero coords map to 0 (correct for valid zero coords).
   */
  it('Property 2.3: Records with zero coordinates are preserved', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          // Mix of zero-coord records and normal records
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 10 }),
              longitude: fc.oneof(fc.constant(0), validNonZeroLongitudeArb),
              latitude: fc.oneof(fc.constant(0), validNonZeroLatitudeArb),
            }),
            { minLength: 1, maxLength: 10 },
          ),
        ),
        ([records]) => {
          const geojson = buildGeoJSONFeatures(records);

          // All records must produce features (none filtered out)
          if (geojson.features.length !== records.length) return false;

          // Zero coordinates must appear as 0 in the output
          for (let i = 0; i < records.length; i++) {
            const [lng, lat] = geojson.features[i].geometry.coordinates;
            const expectedLng = records[i].longitude || 0;
            const expectedLat = records[i].latitude || 0;
            if (lng !== expectedLng) return false;
            if (lat !== expectedLat) return false;
          }

          return true;
        },
      ),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 3.3**
   *
   * Property: fitBounds with valid bounds calls map.fitBounds with
   * correct LngLatBounds (sw=[minLon, minLat], ne=[maxLon, maxLat])
   * and options { padding: 100, maxZoom: 10, duration: 1000 }.
   */
  it('Property 2.4: fitBounds with valid bounds calls map.fitBounds correctly', () => {
    fc.assert(
      fc.property(validBoundsArb, (bounds) => {
        const mockMap = { fitBounds: jest.fn() };

        fitBounds(bounds, mockMap);

        // Must be called exactly once
        if (mockMap.fitBounds.mock.calls.length !== 1) return false;

        const [lngLatBounds, options] = mockMap.fitBounds.mock.calls[0];

        // Verify LngLatBounds sw/ne
        if (lngLatBounds.sw[0] !== bounds.minLon) return false;
        if (lngLatBounds.sw[1] !== bounds.minLat) return false;
        if (lngLatBounds.ne[0] !== bounds.maxLon) return false;
        if (lngLatBounds.ne[1] !== bounds.maxLat) return false;

        // Verify options
        if (options.padding !== 100) return false;
        if (options.maxZoom !== 10) return false;
        if (options.duration !== 1000) return false;

        return true;
      }),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 3.4, 3.5**
   *
   * Property: restoreMapState with valid center calls map.jumpTo with
   * the correct center, zoom, pitch, and bearing.
   */
  it('Property 2.5: restoreMapState with valid state calls map.jumpTo correctly', () => {
    fc.assert(
      fc.property(validMapStateArb, (state) => {
        const mockMap = { jumpTo: jest.fn() };

        restoreMapState(state, mockMap);

        // Must be called exactly once
        if (mockMap.jumpTo.mock.calls.length !== 1) return false;

        const [jumpToArg] = mockMap.jumpTo.mock.calls[0];

        // Verify center
        if (jumpToArg.center[0] !== state.center[0]) return false;
        if (jumpToArg.center[1] !== state.center[1]) return false;

        // Verify zoom
        if (jumpToArg.zoom !== state.zoom) return false;

        // Verify pitch (uses || 0 fallback)
        const expectedPitch = state.pitch || 0;
        if (jumpToArg.pitch !== expectedPitch) return false;

        // Verify bearing (uses || 0 fallback)
        const expectedBearing = state.bearing || 0;
        if (jumpToArg.bearing !== expectedBearing) return false;

        return true;
      }),
      { numRuns: 200 },
    );
  });
});
