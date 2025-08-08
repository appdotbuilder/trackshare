import { db } from '../db';
import { tracksTable } from '../db/schema';
import { type Track } from '../schema';

export const getTracks = async (): Promise<Track[]> => {
  try {
    // Fetch all tracks from the database
    const results = await db.select()
      .from(tracksTable)
      .execute();

    // Return the tracks as-is since all fields are already in the correct format
    // No numeric conversions needed for this table
    return results;
  } catch (error) {
    console.error('Failed to fetch tracks:', error);
    throw error;
  }
};