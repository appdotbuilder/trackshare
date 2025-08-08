import { db } from '../db';
import { tracksTable } from '../db/schema';
import { type GetTrackInput, type Track } from '../schema';
import { eq } from 'drizzle-orm';

export const getTrack = async (input: GetTrackInput): Promise<Track | null> => {
  try {
    // Query the database for the track by ID
    const results = await db.select()
      .from(tracksTable)
      .where(eq(tracksTable.id, input.id))
      .execute();

    // Return null if track not found
    if (results.length === 0) {
      return null;
    }

    // Return the track data
    const track = results[0];
    return {
      ...track
    };
  } catch (error) {
    console.error('Track retrieval failed:', error);
    throw error;
  }
};