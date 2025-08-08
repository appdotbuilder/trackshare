import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrackUpload } from '@/components/TrackUpload';
import { TrackList } from '@/components/TrackList';
import { MapView } from '@/components/MapView';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Mountain, Navigation, Upload, Map, Info } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { Track } from '../../server/src/schema';

function App() {
  // Explicit typing with Track interface
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [backendError, setBackendError] = useState<boolean>(false);

  // useCallback to memoize function used in useEffect
  const loadTracks = useCallback(async () => {
    try {
      const result = await trpc.getTracks.query();
      setTracks(result);
      setBackendError(false); // Reset error state on success
    } catch (error) {
      console.error('Failed to load tracks:', error);
      // Gracefully handle backend stub errors - set empty array as fallback
      setTracks([]);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('JSON') || errorMessage.includes('pattern') || errorMessage.includes('500')) {
        setBackendError(true);
      }
    }
  }, []); // Empty deps since trpc is stable

  // useEffect with proper dependencies
  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const handleTrackCreated = (newTrack: Track) => {
    setTracks((prev: Track[]) => [newTrack, ...prev]);
    setSelectedTrack(newTrack);
    setActiveTab('map');
  };

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
    setActiveTab('map');
  };

  const handleTrackDeleted = (trackId: number) => {
    setTracks((prev: Track[]) => prev.filter(track => track.id !== trackId));
    if (selectedTrack?.id === trackId) {
      setSelectedTrack(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Mountain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TrailShare</h1>
                <p className="text-sm text-gray-600">Share your outdoor adventures</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Navigation className="h-3 w-3 mr-1" />
                {tracks.length} tracks shared
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Discover Amazing Trails 🏔️
            </h2>
            <p className="text-gray-600 text-lg">
              Share your hiking and cycling adventures with GPS tracks that others can explore and follow.
            </p>
          </div>

          {/* Backend Status Alert */}
          {backendError && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Demo Mode:</strong> The backend is currently using stub implementations. 
                Track uploads and data management work locally for demonstration purposes. 
                Full database functionality will be available once backend handlers are implemented.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="browse" className="flex items-center space-x-2">
                <Navigation className="h-4 w-4" />
                <span>Browse Tracks</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload Track</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center space-x-2">
                <Map className="h-4 w-4" />
                <span>Map View</span>
              </TabsTrigger>
            </TabsList>

            {/* Browse Tracks Tab */}
            <TabsContent value="browse" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Navigation className="h-5 w-5" />
                    <span>Available Tracks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TrackList 
                    tracks={tracks}
                    onTrackSelect={handleTrackSelect}
                    onTrackDeleted={handleTrackDeleted}
                    selectedTrack={selectedTrack}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upload Track Tab */}
            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Share Your Adventure</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TrackUpload 
                    onTrackCreated={handleTrackCreated}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Map View Tab */}
            <TabsContent value="map" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Map className="h-5 w-5" />
                    <span>Interactive Map</span>
                    {selectedTrack && (
                      <Badge variant="outline" className="ml-2">
                        {selectedTrack.title}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MapView 
                    selectedTrack={selectedTrack}
                    allTracks={tracks}
                    onTrackSelect={handleTrackSelect}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer Info */}
          <div className="mt-12 text-center">
            <Separator className="mb-6" />
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                🌲 Support for GPX and KML file formats • 🗺️ Interactive map visualization • 🚀 Easy sharing
              </p>
              <p className="text-xs text-gray-400">
                {/* Note: Backend handlers are currently stubs - full functionality available once database is connected */}
                Built for outdoor enthusiasts who love to share their adventures
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;