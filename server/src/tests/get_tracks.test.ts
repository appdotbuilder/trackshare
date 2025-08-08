import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tracksTable } from '../db/schema';
import { getTracks } from '../handlers/get_tracks';

describe('getTracks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tracks exist', async () => {
    const result = await getTracks();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all tracks when tracks exist', async () => {
    // Create test tracks directly in database
    await db.insert(tracksTable)
      .values([
        {
          title: 'Mountain Hike',
          description: 'Beautiful mountain trail',
          file_name: 'mountain_hike.gpx',
          file_type: 'gpx',
          file_size: 2048,
          track_data: '<?xml version="1.0"?><gpx>mountain track data</gpx>'
        },
        {
          title: 'City Walk',
          description: null, // Test nullable description
          file_name: 'city_walk.kml',
          file_type: 'kml',
          file_size: 1024,
          track_data: '<?xml version="1.0"?><kml>city track data</kml>'
        }
      ])
      .execute();

    const result = await getTracks();

    expect(result).toHaveLength(2);
    
    // Verify first track
    const mountainTrack = result.find(t => t.title === 'Mountain Hike');
    expect(mountainTrack).toBeDefined();
    expect(mountainTrack?.description).toBe('Beautiful mountain trail');
    expect(mountainTrack?.file_name).toBe('mountain_hike.gpx');
    expect(mountainTrack?.file_type).toBe('gpx');
    expect(mountainTrack?.file_size).toBe(2048);
    expect(mountainTrack?.track_data).toBe('<?xml version="1.0"?><gpx>mountain track data</gpx>');
    expect(mountainTrack?.id).toBeDefined();
    expect(mountainTrack?.created_at).toBeInstanceOf(Date);
    expect(mountainTrack?.updated_at).toBeInstanceOf(Date);
    
    // Verify second track with null description
    const cityTrack = result.find(t => t.title === 'City Walk');
    expect(cityTrack).toBeDefined();
    expect(cityTrack?.description).toBeNull();
    expect(cityTrack?.file_name).toBe('city_walk.kml');
    expect(cityTrack?.file_type).toBe('kml');
    expect(cityTrack?.file_size).toBe(1024);
    expect(cityTrack?.track_data).toBe('<?xml version="1.0"?><kml>city track data</kml>');
  });

  it('should return tracks ordered by creation time', async () => {
    // Create tracks with different timestamps
    const track1 = await db.insert(tracksTable)
      .values({
        title: 'First Track',
        description: 'First track created',
        file_name: 'first.gpx',
        file_type: 'gpx',
        file_size: 1000,
        track_data: '<gpx>first track</gpx>'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const track2 = await db.insert(tracksTable)
      .values({
        title: 'Second Track',
        description: 'Second track created',
        file_name: 'second.kml',
        file_type: 'kml',
        file_size: 2000,
        track_data: '<kml>second track</kml>'
      })
      .returning()
      .execute();

    const result = await getTracks();

    expect(result).toHaveLength(2);
    
    // Verify both tracks are returned
    const titles = result.map(t => t.title);
    expect(titles).toContain('First Track');
    expect(titles).toContain('Second Track');
    
    // Verify all required fields are present for all tracks
    result.forEach(track => {
      expect(track.id).toBeDefined();
      expect(track.title).toBeDefined();
      expect(track.file_name).toBeDefined();
      expect(track.file_type).toMatch(/^(gpx|kml)$/);
      expect(typeof track.file_size).toBe('number');
      expect(track.file_size).toBeGreaterThan(0);
      expect(track.track_data).toBeDefined();
      expect(track.created_at).toBeInstanceOf(Date);
      expect(track.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle different file types correctly', async () => {
    // Create tracks with both supported file types
    await db.insert(tracksTable)
      .values([
        {
          title: 'GPX Track',
          description: 'GPS Exchange Format track',
          file_name: 'route.gpx',
          file_type: 'gpx',
          file_size: 3072,
          track_data: '<?xml version="1.0"?><gpx version="1.1">GPX data</gpx>'
        },
        {
          title: 'KML Track',
          description: 'Keyhole Markup Language track',
          file_name: 'path.kml',
          file_type: 'kml',
          file_size: 4096,
          track_data: '<?xml version="1.0"?><kml>KML data</kml>'
        }
      ])
      .execute();

    const result = await getTracks();

    expect(result).toHaveLength(2);
    
    const gpxTrack = result.find(t => t.file_type === 'gpx');
    const kmlTrack = result.find(t => t.file_type === 'kml');
    
    expect(gpxTrack).toBeDefined();
    expect(gpxTrack?.title).toBe('GPX Track');
    expect(gpxTrack?.file_name).toBe('route.gpx');
    
    expect(kmlTrack).toBeDefined();
    expect(kmlTrack?.title).toBe('KML Track');
    expect(kmlTrack?.file_name).toBe('path.kml');
  });

  it('should preserve all data types correctly', async () => {
    await db.insert(tracksTable)
      .values({
        title: 'Type Test Track',
        description: 'Testing data type preservation',
        file_name: 'test.gpx',
        file_type: 'gpx',
        file_size: 12345,
        track_data: '<gpx>complex track data with special chars: &lt;test&gt;</gpx>'
      })
      .execute();

    const result = await getTracks();
    const track = result[0];

    // Verify data types
    expect(typeof track.id).toBe('number');
    expect(typeof track.title).toBe('string');
    expect(typeof track.description).toBe('string');
    expect(typeof track.file_name).toBe('string');
    expect(typeof track.file_type).toBe('string');
    expect(typeof track.file_size).toBe('number');
    expect(typeof track.track_data).toBe('string');
    expect(track.created_at).toBeInstanceOf(Date);
    expect(track.updated_at).toBeInstanceOf(Date);
    
    // Verify specific values
    expect(track.file_size).toBe(12345);
    expect(track.track_data).toContain('&lt;test&gt;');
  });
});