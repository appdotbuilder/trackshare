import { z } from 'zod';

// Track schema with proper GPS data handling
export const trackSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // Nullable field for optional descriptions
  file_name: z.string(), // Original uploaded file name
  file_type: z.enum(['gpx', 'kml']), // Supported GPS track formats
  file_size: z.number().int().positive(), // File size in bytes
  track_data: z.string(), // Raw GPS track data (GPX/KML content)
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  updated_at: z.coerce.date()
});

export type Track = z.infer<typeof trackSchema>;

// Input schema for creating tracks
export const createTrackInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().nullable(), // Explicit null allowed, undefined not allowed
  file_name: z.string().min(1, 'File name is required'),
  file_type: z.enum(['gpx', 'kml']), // Validate against supported formats
  file_size: z.number().int().positive('File size must be positive'),
  track_data: z.string().min(1, 'Track data is required') // GPS track content
});

export type CreateTrackInput = z.infer<typeof createTrackInputSchema>;

// Input schema for updating tracks
export const updateTrackInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(), // Optional = field can be undefined (omitted)
  description: z.string().nullable().optional() // Can be null or undefined
});

export type UpdateTrackInput = z.infer<typeof updateTrackInputSchema>;

// Input schema for getting a single track by ID
export const getTrackInputSchema = z.object({
  id: z.number()
});

export type GetTrackInput = z.infer<typeof getTrackInputSchema>;

// Input schema for deleting a track
export const deleteTrackInputSchema = z.object({
  id: z.number()
});

export type DeleteTrackInput = z.infer<typeof deleteTrackInputSchema>;

// Response schema for successful operations
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional()
});

export type SuccessResponse = z.infer<typeof successResponseSchema>;