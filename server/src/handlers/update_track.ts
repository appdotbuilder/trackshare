import { db } from '../db';
import { tracksTable } from '../db/schema';
import { type UpdateTrackInput, type Track } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTrack = async (input: UpdateTrackInput): Promise<Track | null> => {
  try {
    // First, check if the track exists
    const existingTrack = await db.select()
      .from(tracksTable)
      .where(eq(tracksTable.id, input.id))
      .execute();

    if (existingTrack.length === 0) {
      return null; // Track not found
    }

    // Build update object with only the fields that are provided
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update the track record
    const result = await db.update(tracksTable)
      .set(updateData)
      .where(eq(tracksTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Track update failed:', error);
    throw error;
  }
};