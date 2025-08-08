import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import { Map, Navigation, MapPin, Info, Calendar, FileText, Download } from 'lucide-react';
import type { Track } from '../../../server/src/schema';

interface MapViewProps {
  selectedTrack: Track | null;
  allTracks: Track[];
  onTrackSelect: (track: Track) => void;
}

export function MapView({ selectedTrack, allTracks, onTrackSelect }: MapViewProps) {
  const [mapError, setMapError] = useState<string>('');

  // Parse GPX/KML data to extract basic info (placeholder implementation)
  const parseTrackInfo = (trackData: string, fileType: 'gpx' | 'kml') => {
    try {
      // This is a basic parser for demonstration
      // In a real implementation, you'd use proper GPX/KML parsing libraries
      if (!trackData || trackData.trim() === '') {
        return { trackPoints: 0, trackName: '', bounds: { north: 0, south: 0, east: 0, west: 0 } };
      }
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(trackData, 'application/xml');
      
      let trackPoints = 0;
      let trackName = '';
      let bounds = { north: 0, south: 0, east: 0, west: 0 };

      if (fileType === 'gpx') {
        const trkpts = doc.querySelectorAll('trkpt');
        trackPoints = trkpts.length;
        
        const nameElement = doc.querySelector('trk > name');
        trackName = nameElement?.textContent || '';

        // Calculate bounds
        let lats: number[] = [];
        let lons: number[] = [];
        trkpts.forEach(pt => {
          const lat = parseFloat(pt.getAttribute('lat') || '0');
          const lon = parseFloat(pt.getAttribute('lon') || '0');
          lats.push(lat);
          lons.push(lon);
        });

        if (lats.length > 0) {
          bounds = {
            north: Math.max(...lats),
            south: Math.min(...lats),
            east: Math.max(...lons),
            west: Math.min(...lons)
          };
        }
      } else if (fileType === 'kml') {
        const coordinates = doc.querySelectorAll('coordinates');
        let totalPoints = 0;
        coordinates.forEach(coord => {
          const coordText = coord.textContent || '';
          const points = coordText.trim().split(/\s+/);
          totalPoints += points.filter(p => p.includes(',')).length;
        });
        trackPoints = totalPoints;

        const nameElement = doc.querySelector('Document > name, Placemark > name');
        trackName = nameElement?.textContent || '';
      }

      return { trackPoints, trackName, bounds };
    } catch (error) {
      console.error('Error parsing track data:', error);
      return { trackPoints: 0, trackName: '', bounds: { north: 0, south: 0, east: 0, west: 0 } };
    }
  };

  const downloadTrack = (track: Track) => {
    const blob = new Blob([track.track_data], { 
      type: track.file_type === 'gpx' ? 'application/gpx+xml' : 'application/vnd.google-earth.kml+xml' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = track.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get track info for selected track
  const trackInfo = selectedTrack ? parseTrackInfo(selectedTrack.track_data, selectedTrack.file_type) : null;

  return (
    <div className="space-y-6">
      {/* Map Placeholder */}
      <div className="relative">
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                <Map className="h-12 w-12 text-blue-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Interactive Map View
                </h3>
                <p className="text-gray-600">
                  This is where the interactive map would display GPS tracks using libraries like Leaflet or Google Maps.
                </p>
              </div>

              {selectedTrack ? (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Navigation className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Track Ready for Display</span>
                  </div>
                  <p className="text-sm text-green-700">
                    <strong>{selectedTrack.title}</strong> - {trackInfo?.trackPoints || 0} GPS points loaded
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">
                  Select a track from the list to visualize it on the map 🗺️
                </p>
              )}

              <div className="text-xs text-gray-400 space-y-1">
                <p>📍 Would show GPS track routes with elevation profiles</p>
                <p>🎯 Interactive markers for waypoints and points of interest</p>
                <p>📏 Distance and elevation measurements</p>
                <p>🗂️ Layer controls for multiple track overlay</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Track Details Panel */}
      {selectedTrack && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedTrack.title}
                    </h3>
                    <Badge 
                      variant="secondary"
                      className={`
                        ${selectedTrack.file_type === 'gpx' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}
                      `}
                    >
                      {selectedTrack.file_type.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {selectedTrack.description && (
                    <p className="text-gray-600">
                      {selectedTrack.description}
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTrack(selectedTrack)}
                  className="ml-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              {/* Track Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {trackInfo?.trackPoints || 0}
                  </div>
                  <div className="text-sm text-gray-500">GPS Points</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(selectedTrack.file_size / 1024).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">KB</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedTrack.created_at.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">Created</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedTrack.file_name.length > 15 ? 
                      `${selectedTrack.file_name.substring(0, 12)}...` : 
                      selectedTrack.file_name
                    }
                  </div>
                  <div className="text-sm text-gray-500">Filename</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Uploaded on {selectedTrack.created_at.toLocaleDateString()} 
                    at {selectedTrack.created_at.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>
                    Original file: {selectedTrack.file_name} 
                    ({selectedTrack.file_type.toUpperCase()} format)
                  </span>
                </div>

                {trackInfo && trackInfo.trackPoints > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Contains {trackInfo.trackPoints} GPS coordinate points
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Track List for Quick Selection */}
      {allTracks.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Track Selection</h4>
            <div className="space-y-2">
              {allTracks.map((track: Track) => (
                <button
                  key={track.id}
                  onClick={() => onTrackSelect(track)}
                  className={`
                    w-full text-left p-3 rounded-lg transition-colors
                    ${selectedTrack?.id === track.id ? 
                      'bg-green-100 border-2 border-green-500' : 
                      'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`
                        w-3 h-3 rounded-full
                        ${selectedTrack?.id === track.id ? 'bg-green-500' : 'bg-gray-400'}
                      `} />
                      <div>
                        <div className="font-medium text-gray-900">{track.title}</div>
                        <div className="text-sm text-gray-500">
                          {track.file_type.toUpperCase()} • {(track.file_size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    {selectedTrack?.id === track.id && (
                      <Badge className="bg-green-100 text-green-800">
                        <Navigation className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Implementation Note */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Map Implementation:</strong> This view shows parsed track information. 
          To add interactive mapping, integrate libraries like Leaflet, Mapbox GL JS, or Google Maps API 
          to render the GPS coordinate data on an actual map with route visualization.
        </AlertDescription>
      </Alert>
    </div>
  );
}