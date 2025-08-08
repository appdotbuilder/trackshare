import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tracksTable } from '../db/schema';
import { type CreateTrackInput } from '../schema';
import { createTrack } from '../handlers/create_track';
import { eq } from 'drizzle-orm';

// Sample GPX data for testing
const sampleGpxData = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
  <trk>
    <name>Test Track</name>
    <trkseg>
      <trkpt lat="37.7749" lon="-122.4194">
        <ele>10</ele>
        <time>2023-01-01T00:00:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

// Sample KML data for testing
const sampleKmlData = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Test Track</name>
      <LineString>
        <coordinates>-122.4194,37.7749,0</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

// Test input for GPX track
const testGpxInput: CreateTrackInput = {
  title: 'San Francisco Hike',
  description: 'A beautiful hiking trail in San Francisco',
  file_name: 'sf_hike.gpx',
  file_type: 'gpx',
  file_size: sampleGpxData.length,
  track_data: sampleGpxData
};

// Test input for KML track
const testKmlInput: CreateTrackInput = {
  title: 'Golden Gate Route',
  description: null,
  file_name: 'golden_gate.kml',
  file_type: 'kml',
  file_size: sampleKmlData.length,
  track_data: sampleKmlData
};

describe('createTrack', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a GPX track', async () => {
    const result = await createTrack(testGpxInput);

    // Basic field validation
    expect(result.title).toEqual('San Francisco Hike');
    expect(result.description).toEqual('A beautiful hiking trail in San Francisco');
    expect(result.file_name).toEqual('sf_hike.gpx');
    expect(result.file_type).toEqual('gpx');
    expect(result.file_size).toEqual(sampleGpxData.length);
    expect(result.track_data).toEqual(sampleGpxData);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a KML track with null description', async () => {
    const result = await createTrack(testKmlInput);

    // Basic field validation
    expect(result.title).toEqual('Golden Gate Route');
    expect(result.description).toBeNull();
    expect(result.file_name).toEqual('golden_gate.kml');
    expect(result.file_type).toEqual('kml');
    expect(result.file_size).toEqual(sampleKmlData.length);
    expect(result.track_data).toEqual(sampleKmlData);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save track to database', async () => {
    const result = await createTrack(testGpxInput);

    // Query using proper drizzle syntax
    const tracks = await db.select()
      .from(tracksTable)
      .where(eq(tracksTable.id, result.id))
      .execute();

    expect(tracks).toHaveLength(1);
    const savedTrack = tracks[0];
    expect(savedTrack.title).toEqual('San Francisco Hike');
    expect(savedTrack.description).toEqual('A beautiful hiking trail in San Francisco');
    expect(savedTrack.file_name).toEqual('sf_hike.gpx');
    expect(savedTrack.file_type).toEqual('gpx');
    expect(savedTrack.file_size).toEqual(sampleGpxData.length);
    expect(savedTrack.track_data).toEqual(sampleGpxData);
    expect(savedTrack.created_at).toBeInstanceOf(Date);
    expect(savedTrack.updated_at).toBeInstanceOf(Date);
  });

  it('should handle large track files', async () => {
    // Create a large GPX data string
    const largeGpxData = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
  <trk>
    <name>Large Test Track</name>
    <trkseg>
${Array.from({ length: 1000 }, (_, i) => 
  `      <trkpt lat="${37.7749 + (i * 0.001)}" lon="${-122.4194 + (i * 0.001)}">
        <ele>${10 + i}</ele>
        <time>2023-01-01T${String(i % 24).padStart(2, '0')}:00:00Z</time>
      </trkpt>`
).join('\n')}
    </trkseg>
  </trk>
</gpx>`;

    const largeTrackInput: CreateTrackInput = {
      title: 'Large GPS Track',
      description: 'A track with many waypoints',
      file_name: 'large_track.gpx',
      file_type: 'gpx',
      file_size: largeGpxData.length,
      track_data: largeGpxData
    };

    const result = await createTrack(largeTrackInput);

    expect(result.title).toEqual('Large GPS Track');
    expect(result.file_size).toEqual(largeGpxData.length);
    expect(result.track_data.length).toBeGreaterThan(10000); // Large data
    expect(result.id).toBeDefined();
  });

  it('should create multiple tracks successfully', async () => {
    // Create first track
    const firstResult = await createTrack(testGpxInput);
    
    // Create second track with different data
    const secondInput: CreateTrackInput = {
      title: 'Second Track',
      description: 'Another GPS track',
      file_name: 'second.kml',
      file_type: 'kml',
      file_size: sampleKmlData.length,
      track_data: sampleKmlData
    };
    
    const secondResult = await createTrack(secondInput);

    // Verify both tracks have different IDs
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.title).toEqual('San Francisco Hike');
    expect(secondResult.title).toEqual('Second Track');

    // Verify both are saved to database
    const allTracks = await db.select()
      .from(tracksTable)
      .execute();

    expect(allTracks).toHaveLength(2);
  });

  it('should handle tracks with minimal data', async () => {
    const minimalInput: CreateTrackInput = {
      title: 'Minimal Track',
      description: null,
      file_name: 'minimal.gpx',
      file_type: 'gpx',
      file_size: 1,
      track_data: 'x' // Minimal but valid track data
    };

    const result = await createTrack(minimalInput);

    expect(result.title).toEqual('Minimal Track');
    expect(result.description).toBeNull();
    expect(result.file_size).toEqual(1);
    expect(result.track_data).toEqual('x');
    expect(result.id).toBeDefined();
  });
});