import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tracksTable } from '../db/schema';
import { type UpdateTrackInput, type CreateTrackInput } from '../schema';
import { updateTrack } from '../handlers/update_track';
import { eq } from 'drizzle-orm';

// Test input for creating a track
const testCreateInput: CreateTrackInput = {
  title: 'Original Track',
  description: 'Original description',
  file_name: 'original.gpx',
  file_type: 'gpx',
  file_size: 2048,
  track_data: '<gpx version="1.1">...</gpx>'
};

describe('updateTrack', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update track title only', async () => {
    // Create a track first
    const createResult = await db.insert(tracksTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description,
        file_name: testCreateInput.file_name,
        file_type: testCreateInput.file_type,
        file_size: testCreateInput.file_size,
        track_data: testCreateInput.track_data
      })
      .returning()
      .execute();

    const createdTrack = createResult[0];
    const originalUpdatedAt = createdTrack.updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTrackInput = {
      id: createdTrack.id,
      title: 'Updated Track Title'
    };

    const result = await updateTrack(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTrack.id);
    expect(result!.title).toEqual('Updated Track Title');
    expect(result!.description).toEqual(testCreateInput.description); // Should remain unchanged
    expect(result!.file_name).toEqual(testCreateInput.file_name); // Should remain unchanged
    expect(result!.file_type).toEqual(testCreateInput.file_type); // Should remain unchanged
    expect(result!.file_size).toEqual(testCreateInput.file_size); // Should remain unchanged
    expect(result!.track_data).toEqual(testCreateInput.track_data); // Should remain unchanged
    expect(result!.created_at).toEqual(createdTrack.created_at); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should update track description only', async () => {
    // Create a track first
    const createResult = await db.insert(tracksTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description,
        file_name: testCreateInput.file_name,
        file_type: testCreateInput.file_type,
        file_size: testCreateInput.file_size,
        track_data: testCreateInput.track_data
      })
      .returning()
      .execute();

    const createdTrack = createResult[0];

    const updateInput: UpdateTrackInput = {
      id: createdTrack.id,
      description: 'Updated description'
    };

    const result = await updateTrack(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTrack.id);
    expect(result!.title).toEqual(testCreateInput.title); // Should remain unchanged
    expect(result!.description).toEqual('Updated description');
    expect(result!.file_name).toEqual(testCreateInput.file_name); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update both title and description', async () => {
    // Create a track first
    const createResult = await db.insert(tracksTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description,
        file_name: testCreateInput.file_name,
        file_type: testCreateInput.file_type,
        file_size: testCreateInput.file_size,
        track_data: testCreateInput.track_data
      })
      .returning()
      .execute();

    const createdTrack = createResult[0];

    const updateInput: UpdateTrackInput = {
      id: createdTrack.id,
      title: 'New Track Title',
      description: 'New description'
    };

    const result = await updateTrack(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTrack.id);
    expect(result!.title).toEqual('New Track Title');
    expect(result!.description).toEqual('New description');
    expect(result!.file_name).toEqual(testCreateInput.file_name); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null when explicitly passed', async () => {
    // Create a track first
    const createResult = await db.insert(tracksTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description,
        file_name: testCreateInput.file_name,
        file_type: testCreateInput.file_type,
        file_size: testCreateInput.file_size,
        track_data: testCreateInput.track_data
      })
      .returning()
      .execute();

    const createdTrack = createResult[0];

    const updateInput: UpdateTrackInput = {
      id: createdTrack.id,
      description: null
    };

    const result = await updateTrack(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTrack.id);
    expect(result!.title).toEqual(testCreateInput.title); // Should remain unchanged
    expect(result!.description).toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when track does not exist', async () => {
    const updateInput: UpdateTrackInput = {
      id: 999999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateTrack(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes to database', async () => {
    // Create a track first
    const createResult = await db.insert(tracksTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description,
        file_name: testCreateInput.file_name,
        file_type: testCreateInput.file_type,
        file_size: testCreateInput.file_size,
        track_data: testCreateInput.track_data
      })
      .returning()
      .execute();

    const createdTrack = createResult[0];

    const updateInput: UpdateTrackInput = {
      id: createdTrack.id,
      title: 'Persisted Title',
      description: 'Persisted description'
    };

    await updateTrack(updateInput);

    // Query the database directly to verify changes were persisted
    const tracks = await db.select()
      .from(tracksTable)
      .where(eq(tracksTable.id, createdTrack.id))
      .execute();

    expect(tracks).toHaveLength(1);
    expect(tracks[0].title).toEqual('Persisted Title');
    expect(tracks[0].description).toEqual('Persisted description');
    expect(tracks[0].file_name).toEqual(testCreateInput.file_name); // Should remain unchanged
    expect(tracks[0].track_data).toEqual(testCreateInput.track_data); // Should remain unchanged
    expect(tracks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should only update timestamp when no fields are provided', async () => {
    // Create a track first
    const createResult = await db.insert(tracksTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description,
        file_name: testCreateInput.file_name,
        file_type: testCreateInput.file_type,
        file_size: testCreateInput.file_size,
        track_data: testCreateInput.track_data
      })
      .returning()
      .execute();

    const createdTrack = createResult[0];
    const originalUpdatedAt = createdTrack.updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTrackInput = {
      id: createdTrack.id
      // No title or description provided
    };

    const result = await updateTrack(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTrack.id);
    expect(result!.title).toEqual(testCreateInput.title); // Should remain unchanged
    expect(result!.description).toEqual(testCreateInput.description); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});