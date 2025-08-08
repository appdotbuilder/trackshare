import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types and handlers
import { 
  createTrackInputSchema, 
  updateTrackInputSchema, 
  getTrackInputSchema, 
  deleteTrackInputSchema 
} from './schema';
import { createTrack } from './handlers/create_track';
import { getTracks } from './handlers/get_tracks';
import { getTrack } from './handlers/get_track';
import { updateTrack } from './handlers/update_track';
import { deleteTrack } from './handlers/delete_track';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new GPS track
  createTrack: publicProcedure
    .input(createTrackInputSchema)
    .mutation(({ input }) => createTrack(input)),
  
  // Get all GPS tracks
  getTracks: publicProcedure
    .query(() => getTracks()),
  
  // Get a single GPS track by ID
  getTrack: publicProcedure
    .input(getTrackInputSchema)
    .query(({ input }) => getTrack(input)),
  
  // Update track metadata (title, description)
  updateTrack: publicProcedure
    .input(updateTrackInputSchema)
    .mutation(({ input }) => updateTrack(input)),
  
  // Delete a GPS track
  deleteTrack: publicProcedure
    .input(deleteTrackInputSchema)
    .mutation(({ input }) => deleteTrack(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();