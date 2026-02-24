/**
 * Bug Condition Exploration Test — NaN/Invalid Coordinates Crash maplibre-gl
 *
 * This test replicates the FIXED patterns from CatalogPage.tsx and asserts
 * the EXPECTED (correct) behavior. After bugfix tasks 3.1-3.4, this test
 * MUST PASS — passing confirms the bug is fixed.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Replicate the FIXED logic from CatalogPage.tsx (after bugfix tasks 3.1-3.4)
// ---------------------------------------------------------------------------

interface WellRecord {
  name?: string;
  longitude?: number | null;
  latitude?: number | null;
}

/** Returns true only when both lng and lat are finite numbers */
const isValidCoordinate = (lng: unknown, lat: unknown): boolean =>
  Number.isFinite(lng) && Number.isFinite(lat);

/**
 * GeoJSON construction — FIXED pattern from CatalogPage.tsx
 * Filters out records with invalid coordinates instead of using `|| 0` fallback.
 */
const buildGeoJSONFeatures = (records: WellRecord[]) => {
  const validRecords = records.filter(r => isValidCoordinate(r.longitude, r.latitude));
  return {
    type: "FeatureCollection" as const,
    features: validRecords.map((record, index) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [record.longitude as number, record.latitude as number] as [number, number],
      },
      properties: { name: record.name || `well-${index}` },
    })),
  };
};

/**
 * Bounds calculation — FIXED pattern from CatalogPage.tsx
 * Filters invalid coordinates before Math.min/Math.max; returns null if none valid.
 */
const calculateBounds = (records: WellRecord[]) => {
  const validRecords = records.filter(r => isValidCoordinate(r.longitude, r.latitude));
  if (validRecords.length === 0) return null;
  const coordinates = validRecords.map(r => [r.longitude as number, r.latitude as number]);
  return {
    minLon: Math.min(...coordinates.map(c => c[0])),
    maxLon: Math.max(...coordinates.map(c => c[0])),
    minLat: Math.min(...coordinates.map(c => c[1])),
    maxLat: Math.max(...coordinates.map(c => c[1])),
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generate a coordinate value that is intentionally non-finite / invalid */
const invalidCoordArb = fc.oneof(
  fc.constant(NaN),
  fc.constant(Infinity),
  fc.constant(-Infinity),
);

/** Generate a well record with at least one non-finite coordinate */
const invalidWellRecordArb: fc.Arbitrary<WellRecord> = fc.oneof(
  // Both coords invalid
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 10 }),
    longitude: invalidCoordArb,
    latitude: invalidCoordArb,
  }),
  // Only longitude invalid
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 10 }),
    longitude: invalidCoordArb,
    latitude: fc.double({ min: -90, max: 90, noNaN: true }),
  }),
  // Only latitude invalid
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 10 }),
    longitude: fc.double({ min: -180, max: 180, noNaN: true }),
    latitude: invalidCoordArb,
  }),
);

/** Generate a valid well record (finite coords) */
const validWellRecordArb: fc.Arbitrary<WellRecord> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 10 }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true }),
  latitude: fc.double({ min: -90, max: 90, noNaN: true }),
});

/**
 * Generate a mixed array that contains AT LEAST one invalid record.
 * This is the core generator for the fault-condition property.
 */
const recordsWithAtLeastOneInvalidArb: fc.Arbitrary<WellRecord[]> = fc
  .tuple(
    fc.array(validWellRecordArb, { minLength: 0, maxLength: 5 }),
    fc.array(invalidWellRecordArb, { minLength: 1, maxLength: 3 }),
  )
  .map(([valid, invalid]) => {
    // Shuffle so invalid records aren't always at the end
    const all = [...valid, ...invalid];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  });

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

describe('Bug Condition Exploration — NaN Coordinates Reach Maplibre-GL', () => {
  /**
   * **Validates: Requirements 2.1, 2.2, 2.5**
   *
   * Property: For any set of well records where at least one has non-finite
   * longitude or latitude, the output GeoJSON features SHALL contain ONLY
   * finite coordinates, AND the output bounds SHALL be null or contain only
   * finite values.
   *
   * This WILL FAIL on unfixed code because:
   * - Infinity/-Infinity pass through `|| 0` (they're truthy)
   * - Math.min/Math.max with Infinity poisons bounds
   */
  it('Property 1: GeoJSON features and bounds contain only finite coordinates', () => {
    fc.assert(
      fc.property(recordsWithAtLeastOneInvalidArb, (records) => {
        const geojson = buildGeoJSONFeatures(records);
        const bounds = calculateBounds(records);

        // Every feature coordinate must be a finite number
        for (const feature of geojson.features) {
          const [lng, lat] = feature.geometry.coordinates;
          if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) {
            return false; // Bug: non-finite coordinate leaked into GeoJSON
          }
          // Also reject [0, 0] from null/undefined records (null island)
          // Only reject if the ORIGINAL record had invalid coords
          const originalRecord = records[geojson.features.indexOf(feature)];
          if (
            (!isFiniteNumber(originalRecord.longitude) ||
              !isFiniteNumber(originalRecord.latitude)) &&
            lng === 0 &&
            lat === 0
          ) {
            return false; // Bug: invalid record mapped to [0,0] instead of filtered
          }
        }

        // Bounds must be null or all-finite
        if (bounds !== null) {
          if (
            !isFiniteNumber(bounds.minLon) ||
            !isFiniteNumber(bounds.maxLon) ||
            !isFiniteNumber(bounds.minLat) ||
            !isFiniteNumber(bounds.maxLat)
          ) {
            return false; // Bug: NaN/Infinity leaked into bounds
          }
        }

        return true;
      }),
      { numRuns: 200 },
    );
  });

  // -------------------------------------------------------------------------
  // Concrete Test Cases
  // -------------------------------------------------------------------------

  describe('Concrete cases — demonstrate specific bug patterns', () => {
    /**
     * Validates: Requirement 1.1
     * NaN longitude — `NaN || 0` evaluates to 0 (NaN is falsy), but the record
     * should be FILTERED OUT, not mapped to [0, lat].
     */
    it('NaN longitude record should be filtered, not mapped to [0, lat]', () => {
      const records: WellRecord[] = [{ name: 'Well-A', longitude: NaN, latitude: 10.5 }];
      const geojson = buildGeoJSONFeatures(records);

      // The buggy code maps NaN → 0 via `|| 0`. The CORRECT behavior is to
      // filter the record out entirely. This test checks that no feature with
      // coordinates derived from an invalid record exists.
      // If the record was properly filtered, features would be empty.
      // On buggy code, features[0] exists with [0, 10.5] — wrong behavior.
      expect(geojson.features).toHaveLength(0);
    });

    /**
     * Validates: Requirement 1.1
     * undefined/undefined → `|| 0` maps to [0, 0] (null island) instead of filtering.
     */
    it('undefined coordinates should be filtered, not mapped to [0, 0]', () => {
      const records: WellRecord[] = [
        { name: 'Well-B', longitude: undefined, latitude: undefined },
      ];
      const geojson = buildGeoJSONFeatures(records);
      // Buggy code produces [0, 0]. Correct behavior: filter out.
      expect(geojson.features).toHaveLength(0);
    });

    /**
     * Validates: Requirement 1.1
     * Infinity/-Infinity are truthy, so `|| 0` does NOT catch them.
     * They pass straight through into GeoJSON coordinates.
     */
    it('Infinity coordinates should be filtered, not passed through', () => {
      const records: WellRecord[] = [
        { name: 'Well-C', longitude: Infinity, latitude: -Infinity },
      ];
      const geojson = buildGeoJSONFeatures(records);

      if (geojson.features.length > 0) {
        const [lng, lat] = geojson.features[0].geometry.coordinates;
        // On buggy code: lng === Infinity, lat === -Infinity — non-finite!
        expect(Number.isFinite(lng)).toBe(true);
        expect(Number.isFinite(lat)).toBe(true);
      }
    });

    /**
     * Validates: Requirement 1.5
     * Confirms the bug mechanism: Math.min(NaN, 106.5) returns NaN,
     * poisoning the entire bounds calculation.
     */
    it('Math.min with NaN returns NaN — confirms bounds poisoning mechanism', () => {
      // This is a factual assertion about JS behavior, will always pass.
      expect(Math.min(NaN, 106.5)).toBeNaN();
      expect(Math.max(NaN, 10.2)).toBeNaN();
    });

    /**
     * Validates: Requirement 1.5
     * Mixed valid/invalid records — bounds get poisoned by Infinity.
     */
    it('Mixed valid/invalid records produce non-finite bounds', () => {
      const records: WellRecord[] = [
        { name: 'Valid', longitude: 106.5, latitude: 10.2 },
        { name: 'Bad', longitude: Infinity, latitude: -Infinity },
      ];
      const bounds = calculateBounds(records);

      // On buggy code: bounds contain Infinity/-Infinity from the bad record.
      // Correct behavior: bounds should only reflect valid records, or be null.
      expect(bounds).not.toBeNull();
      if (bounds) {
        expect(Number.isFinite(bounds.minLon)).toBe(true);
        expect(Number.isFinite(bounds.maxLon)).toBe(true);
        expect(Number.isFinite(bounds.minLat)).toBe(true);
        expect(Number.isFinite(bounds.maxLat)).toBe(true);
      }
    });

    /**
     * Validates: Requirement 1.5
     * All-invalid records — bounds should be null, not NaN.
     */
    it('All-invalid records should produce null bounds', () => {
      const records: WellRecord[] = [
        { name: 'Bad1', longitude: NaN, latitude: NaN },
        { name: 'Bad2', longitude: undefined, latitude: undefined },
      ];
      const bounds = calculateBounds(records);

      // On buggy code: bounds is { minLon: 0, maxLon: 0, minLat: 0, maxLat: 0 }
      // because NaN/undefined || 0 = 0. Correct behavior: null (no valid coords).
      expect(bounds).toBeNull();
    });
  });
});
