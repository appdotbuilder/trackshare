import { db } from '../db';
import { tracksTable } from '../db/schema';
import { type DeleteTrackInput, type SuccessResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTrack = async (input: DeleteTrackInput): Promise<SuccessResponse> => {
  try {
    // First verify the track exists
    const existingTrack = await db.select()
      .from(tracksTable)
      .where(eq(tracksTable.id, input.id))
      .execute();

    if (existingTrack.length === 0) {
      throw new Error(`Track with ID ${input.id} not found`);
    }

    // Delete the track
    const result = await db.delete(tracksTable)
      .where(eq(tracksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Failed to delete track with ID ${input.id}`);
    }

    return {
      success: true,
      message: `Track with ID ${input.id} has been deleted successfully`
    };
  } catch (error) {
    console.error('Track deletion failed:', error);
    throw error;
  }
};