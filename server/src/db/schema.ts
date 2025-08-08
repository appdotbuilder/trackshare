import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

// Define enum for supported GPS track file types
export const fileTypeEnum = pgEnum('file_type', ['gpx', 'kml']);

export const tracksTable = pgTable('tracks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default, matches Zod schema
  file_name: text('file_name').notNull(),
  file_type: fileTypeEnum('file_type').notNull(),
  file_size: integer('file_size').notNull(), // File size in bytes
  track_data: text('track_data').notNull(), // Raw GPS track data (GPX/KML content)
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript type for the table schema
export type Track = typeof tracksTable.$inferSelect; // For SELECT operations
export type NewTrack = typeof tracksTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { tracks: tracksTable };