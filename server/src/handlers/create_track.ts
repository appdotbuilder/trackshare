import { db } from '../db';
import { tracksTable } from '../db/schema';
import { type CreateTrackInput, type Track } from '../schema';

export const createTrack = async (input: CreateTrackInput): Promise<Track> => {
  try {
    // Insert track record
    const result = await db.insert(tracksTable)
      .values({
        title: input.title,
        description: input.description,
        file_name: input.file_name,
        file_type: input.file_type,
        file_size: input.file_size,
        track_data: input.track_data
      })
      .returning()
      .execute();

    // Return the created track
    const track = result[0];
    return track;
  } catch (error) {
    console.error('Track creation failed:', error);
    throw error;
  }
};