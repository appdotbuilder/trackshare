import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tracksTable } from '../db/schema';
import { type DeleteTrackInput, type CreateTrackInput } from '../schema';
import { deleteTrack } from '../handlers/delete_track';
import { eq } from 'drizzle-orm';

// Test input for creating a track to delete
const testTrackInput: CreateTrackInput = {
  title: 'Test Track for Deletion',
  description: 'A track that will be deleted in tests',
  file_name: 'test_track.gpx',
  file_type: 'gpx',
  file_size: 1024,
  track_data: '<gpx version="1.1">...</gpx>'
};

describe('deleteTrack', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing track', async () => {
    // First create a track to delete
    const createdTrack = await db.insert(tracksTable)
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

    const trackId = createdTrack[0].id;

    // Delete the track
    const deleteInput: DeleteTrackInput = { id: trackId };
    const result = await deleteTrack(deleteInput);

    // Verify successful deletion response
    expect(result.success).toBe(true);
    expect(result.message).toContain(`Track with ID ${trackId} has been deleted successfully`);

    // Verify the track no longer exists in database
    const deletedTrack = await db.select()
      .from(tracksTable)
      .where(eq(tracksTable.id, trackId))
      .execute();

    expect(deletedTrack).toHaveLength(0);
  });

  it('should throw error when track does not exist', async () => {
    const nonExistentId = 999;
    const deleteInput: DeleteTrackInput = { id: nonExistentId };

    await expect(deleteTrack(deleteInput)).rejects.toThrow(/Track with ID 999 not found/i);
  });

  it('should delete track with null description', async () => {
    // Create a track with null description
    const trackWithNullDescription = await db.insert(tracksTable)
      .values({
        title: 'Track with null description',
        description: null,
        file_name: 'null_desc_track.kml',
        file_type: 'kml',
        file_size: 2048,
        track_data: '<kml>...</kml>'
      })
      .returning()
      .execute();

    const trackId = trackWithNullDescription[0].id;

    // Delete the track
    const deleteInput: DeleteTrackInput = { id: trackId };
    const result = await deleteTrack(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);
    expect(result.message).toContain(`Track with ID ${trackId} has been deleted successfully`);

    // Verify track is removed from database
    const deletedTrack = await db.select()
      .from(tracksTable)
      .where(eq(tracksTable.id, trackId))
      .execute();

    expect(deletedTrack).toHaveLength(0);
  });

  it('should delete track with KML file type', async () => {
    // Create a KML track
    const kmlTrack = await db.insert(tracksTable)
      .values({
        title: 'KML Track',
        description: 'A KML format GPS track',
        file_name: 'sample.kml',
        file_type: 'kml',
        file_size: 3072,
        track_data: '<kml xmlns="http://www.opengis.net/kml/2.2">...</kml>'
      })
      .returning()
      .execute();

    const trackId = kmlTrack[0].id;

    // Delete the KML track
    const deleteInput: DeleteTrackInput = { id: trackId };
    const result = await deleteTrack(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);
    expect(result.message).toContain(`Track with ID ${trackId} has been deleted successfully`);

    // Verify track is removed
    const deletedTrack = await db.select()
      .from(tracksTable)
      .where(eq(tracksTable.id, trackId))
      .execute();

    expect(deletedTrack).toHaveLength(0);
  });

  it('should handle deletion of track with large file size', async () => {
    // Create a track with large file size
    const largeTrack = await db.insert(tracksTable)
      .values({
        title: 'Large GPS Track',
        description: 'A very large GPS track file',
        file_name: 'large_track.gpx',
        file_type: 'gpx',
        file_size: 5242880, // 5MB
        track_data: '<gpx version="1.1">' + 'x'.repeat(1000) + '</gpx>'
      })
      .returning()
      .execute();

    const trackId = largeTrack[0].id;

    // Delete the large track
    const deleteInput: DeleteTrackInput = { id: trackId };
    const result = await deleteTrack(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);
    expect(result.message).toContain(`Track with ID ${trackId} has been deleted successfully`);

    // Verify track is removed
    const deletedTrack = await db.select()
      .from(tracksTable)
      .where(eq(tracksTable.id, trackId))
      .execute();

    expect(deletedTrack).toHaveLength(0);
  });

  it('should handle consecutive deletions correctly', async () => {
    // Create multiple tracks
    const tracks = await Promise.all([
      db.insert(tracksTable).values({
        title: 'Track 1',
        description: 'First track',
        file_name: 'track1.gpx',
        file_type: 'gpx',
        file_size: 1024,
        track_data: '<gpx>track1</gpx>'
      }).returning().execute(),
      db.insert(tracksTable).values({
        title: 'Track 2',
        description: 'Second track',
        file_name: 'track2.kml',
        file_type: 'kml',
        file_size: 2048,
        track_data: '<kml>track2</kml>'
      }).returning().execute()
    ]);

    const trackId1 = tracks[0][0].id;
    const trackId2 = tracks[1][0].id;

    // Delete first track
    const deleteInput1: DeleteTrackInput = { id: trackId1 };
    const result1 = await deleteTrack(deleteInput1);
    expect(result1.success).toBe(true);

    // Delete second track
    const deleteInput2: DeleteTrackInput = { id: trackId2 };
    const result2 = await deleteTrack(deleteInput2);
    expect(result2.success).toBe(true);

    // Verify both tracks are deleted
    const remainingTracks = await db.select().from(tracksTable).execute();
    expect(remainingTracks).toHaveLength(0);
  });
});