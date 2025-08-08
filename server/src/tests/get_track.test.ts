import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tracksTable } from '../db/schema';
import { type GetTrackInput, type CreateTrackInput } from '../schema';
import { getTrack } from '../handlers/get_track';
import { eq } from 'drizzle-orm';

// Test track data
const testTrackInput: CreateTrackInput = {
  title: 'Morning Hike',
  description: 'A beautiful morning hike through the mountains',
  file_name: 'morning_hike.gpx',
  file_type: 'gpx',
  file_size: 2048,
  track_data: '<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1"><trk><name>Morning Hike</name><trkseg><trkpt lat="37.7749" lon="-122.4194"><ele>100</ele></trkpt></trkseg></trk></gpx>'
};

const testTrackInputKML: CreateTrackInput = {
  title: 'Evening Walk',
  description: null, // Test nullable description
  file_name: 'evening_walk.kml',
  file_type: 'kml',
  file_size: 1536,
  track_data: '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>Evening Walk</name><LineString><coordinates>-122.4194,37.7749,0</coordinates></LineString></Placemark></Document></kml>'
};

describe('getTrack', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve a track by ID', async () => {
    // Create a test track first
    const insertResult = await db.insert(tracksTable)
      .values({
        title: testTrackInput.title,
        description: testTrackInput.description,
        file_name: testTrackInput.file_name,
        file_type: testTrackInput.file_type,
        file_size: testTrackInput.file_size,
        track_data: testTrackInput.track_data
      })
      .returning()
      .execute();

    const createdTrack = insertResult[0];
    const input: GetTrackInput = { id: createdTrack.id };

    // Retrieve the track
    const result = await getTrack(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTrack.id);
    expect(result!.title).toEqual('Morning Hike');
    expect(result!.description).toEqual('A beautiful morning hike through the mountains');
    expect(result!.file_name).toEqual('morning_hike.gpx');
    expect(result!.file_type).toEqual('gpx');
    expect(result!.file_size).toEqual(2048);
    expect(result!.track_data).toContain('Morning Hike');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should retrieve a track with null description', async () => {
    // Create a track with null description
    const insertResult = await db.insert(tracksTable)
      .values({
        title: testTrackInputKML.title,
        description: testTrackInputKML.description, // null
        file_name: testTrackInputKML.file_name,
        file_type: testTrackInputKML.file_type,
        file_size: testTrackInputKML.file_size,
        track_data: testTrackInputKML.track_data
      })
      .returning()
      .execute();

    const createdTrack = insertResult[0];
    const input: GetTrackInput = { id: createdTrack.id };

    // Retrieve the track
    const result = await getTrack(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTrack.id);
    expect(result!.title).toEqual('Evening Walk');
    expect(result!.description).toBeNull();
    expect(result!.file_type).toEqual('kml');
    expect(result!.track_data).toContain('Evening Walk');
  });

  it('should return null for non-existent track ID', async () => {
    const input: GetTrackInput = { id: 999999 };

    // Try to retrieve a non-existent track
    const result = await getTrack(input);

    // Should return null
    expect(result).toBeNull();
  });

  it('should verify track exists in database after retrieval', async () => {
    // Create a test track
    const insertResult = await db.insert(tracksTable)
      .values({
        title: testTrackInput.title,
        description: testTrackInput.description,
        file_name: testTrackInput.file_name,
        file_type: testTrackInput.file_type,
        file_size: testTrackInput.file_size,
        track_data: testTrackInput.track_data
      })
      .returning()
      .execute();

    const createdTrack = insertResult[0];
    
    // Retrieve using handler
    const handlerResult = await getTrack({ id: createdTrack.id });

    // Verify directly in database
    const dbResults = await db.select()
      .from(tracksTable)
      .where(eq(tracksTable.id, createdTrack.id))
      .execute();

    expect(dbResults).toHaveLength(1);
    expect(handlerResult).not.toBeNull();
    expect(handlerResult!.id).toEqual(dbResults[0].id);
    expect(handlerResult!.title).toEqual(dbResults[0].title);
    expect(handlerResult!.file_name).toEqual(dbResults[0].file_name);
    expect(handlerResult!.track_data).toEqual(dbResults[0].track_data);
  });

  it('should handle different GPS file formats correctly', async () => {
    // Create GPX track
    const gpxResult = await db.insert(tracksTable)
      .values({
        title: 'GPX Track',
        description: 'Test GPX format',
        file_name: 'test.gpx',
        file_type: 'gpx',
        file_size: 1024,
        track_data: '<gpx version="1.1"><trk><name>GPX Track</name></trk></gpx>'
      })
      .returning()
      .execute();

    // Create KML track
    const kmlResult = await db.insert(tracksTable)
      .values({
        title: 'KML Track',
        description: 'Test KML format',
        file_name: 'test.kml',
        file_type: 'kml',
        file_size: 1536,
        track_data: '<kml><Document><Placemark><name>KML Track</name></Placemark></Document></kml>'
      })
      .returning()
      .execute();

    // Retrieve GPX track
    const gpxTrack = await getTrack({ id: gpxResult[0].id });
    expect(gpxTrack).not.toBeNull();
    expect(gpxTrack!.file_type).toEqual('gpx');
    expect(gpxTrack!.track_data).toContain('GPX Track');

    // Retrieve KML track
    const kmlTrack = await getTrack({ id: kmlResult[0].id });
    expect(kmlTrack).not.toBeNull();
    expect(kmlTrack!.file_type).toEqual('kml');
    expect(kmlTrack!.track_data).toContain('KML Track');
  });
});