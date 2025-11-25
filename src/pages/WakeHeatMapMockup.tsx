/**
 * Wake Heat Map Mockup Page
 * 
 * Demonstrates wake effect visualization using Leaflet.heat
 * Shows turbine wake interference patterns across the wind farm
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  Badge,
  Button,
  Slider,
  Select,
  Alert
} from '@cloudscape-design/components';

// Extend Leaflet types for heat layer
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: { [key: number]: string };
    }
  ): L.Layer;
}

interface Turbine {
  id: number;
  lat: number;
  lng: number;
  capacity: number;
}

const WakeHeatMapMockup: React.FC = () => {
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const turbineLayerRef = useRef<L.LayerGroup | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [windDirection, setWindDirection] = useState(180); // South
  const [wakeIntensity, setWakeIntensity] = useState(0.8);
  const [radius, setRadius] = useState(25);
  const [blur, setBlur] = useState(15);
  const [selectedGradient, setSelectedGradient] = useState<string>('default');

  // Sample turbine layout (10 turbines in 2 rows)
  const turbines: Turbine[] = [
    { id: 1, lat: 35.070, lng: -101.400, capacity: 3.0 },
    { id: 2, lat: 35.070, lng: -101.395, capacity: 3.0 },
    { id: 3, lat: 35.070, lng: -101.390, capacity: 3.0 },
    { id: 4, lat: 35.070, lng: -101.385, capacity: 3.0 },
    { id: 5, lat: 35.070, lng: -101.380, capacity: 3.0 },
    { id: 6, lat: 35.065, lng: -101.400, capacity: 3.0 },
    { id: 7, lat: 35.065, lng: -101.395, capacity: 3.0 },
    { id: 8, lat: 35.065, lng: -101.390, capacity: 3.0 },
    { id: 9, lat: 35.065, lng: -101.385, capacity: 3.0 },
    { id: 10, lat: 35.065, lng: -101.380, capacity: 3.0 },
  ];

  const gradientOptions = [
    { label: 'Default (Blue-Green-Yellow-Red)', value: 'default' },
    { label: 'Cool (Blue-Cyan-White)', value: 'cool' },
    { label: 'Warm (Yellow-Orange-Red)', value: 'warm' },
    { label: 'Monochrome (Gray-Black)', value: 'mono' },
  ];

  const gradients: { [key: string]: { [key: number]: string } } = {
    default: { 0.0: 'blue', 0.4: 'lime', 0.6: 'yellow', 0.8: 'orange', 1.0: 'red' },
    cool: { 0.0: 'blue', 0.5: 'cyan', 1.0: 'white' },
    warm: { 0.0: 'yellow', 0.5: 'orange', 1.0: 'red' },
    mono: { 0.0: 'lightgray', 0.5: 'gray', 1.0: 'black' },
  };

  // Generate wake heat map data based on turbine positions and wind direction
  const generateWakeData = (): Array<[number, number, number]> => {
    const wakeData: Array<[number, number, number]> = [];
    const windRadians = (windDirection * Math.PI) / 180;

    turbines.forEach((turbine) => {
      // Add turbine location with high intensity
      wakeData.push([turbine.lat, turbine.lng, 1.0]);

      // Generate wake trail downwind
      const wakeLength = 0.02; // ~2km wake effect
      const wakeWidth = 0.005; // ~500m wake width
      const numPoints = 50;

      for (let i = 1; i <= numPoints; i++) {
        const distance = (i / numPoints) * wakeLength;
        
        // Calculate wake center point
        const wakeLat = turbine.lat + distance * Math.cos(windRadians);
        const wakeLng = turbine.lng + distance * Math.sin(windRadians);

        // Wake intensity decreases with distance
        const distanceDecay = 1 - (i / numPoints);
        const baseIntensity = wakeIntensity * distanceDecay;

        // Add center wake point
        wakeData.push([wakeLat, wakeLng, baseIntensity]);

        // Add wake spread (lateral dispersion)
        const spreadPoints = 3;
        for (let j = 1; j <= spreadPoints; j++) {
          const spreadDistance = (j / spreadPoints) * wakeWidth;
          const spreadIntensity = baseIntensity * (1 - j / spreadPoints) * 0.6;

          // Left side of wake
          const leftLat = wakeLat + spreadDistance * Math.cos(windRadians + Math.PI / 2);
          const leftLng = wakeLng + spreadDistance * Math.sin(windRadians + Math.PI / 2);
          wakeData.push([leftLat, leftLng, spreadIntensity]);

          // Right side of wake
          const rightLat = wakeLat + spreadDistance * Math.cos(windRadians - Math.PI / 2);
          const rightLng = wakeLng + spreadDistance * Math.sin(windRadians - Math.PI / 2);
          wakeData.push([rightLat, rightLng, spreadIntensity]);
        }
      }
    });

    return wakeData;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: [35.0675, -101.390],
      zoom: 13,
      zoomControl: true,
    });

    // Add base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Create turbine layer
    const turbineLayer = L.layerGroup();
    turbineLayerRef.current = turbineLayer;
    turbineLayer.addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update turbine markers
  useEffect(() => {
    if (!turbineLayerRef.current) return;

    turbineLayerRef.current.clearLayers();

    turbines.forEach((turbine) => {
      const icon = L.divIcon({
        className: 'turbine-marker',
        html: `<div style="
          width: 20px;
          height: 20px;
          background: white;
          border: 3px solid #0972d3;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          color: #0972d3;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${turbine.id}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([turbine.lat, turbine.lng], { icon });
      marker.bindPopup(`
        <strong>Turbine ${turbine.id}</strong><br/>
        Capacity: ${turbine.capacity} MW<br/>
        Lat: ${turbine.lat.toFixed(6)}<br/>
        Lng: ${turbine.lng.toFixed(6)}
      `);
      marker.addTo(turbineLayerRef.current!);
    });
  }, []);

  // Update heat layer
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing heat layer
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }

    // Generate wake data
    const wakeData = generateWakeData();

    // Create heat layer
    const heatLayer = L.heatLayer(wakeData, {
      radius: radius,
      blur: blur,
      maxZoom: 17,
      max: 1.0,
      gradient: gradients[selectedGradient],
    });

    heatLayer.addTo(mapRef.current);
    heatLayerRef.current = heatLayer;
  }, [windDirection, wakeIntensity, radius, blur, selectedGradient]);

  // Calculate wake statistics
  const wakeStats = {
    totalTurbines: turbines.length,
    totalCapacity: turbines.reduce((sum, t) => sum + t.capacity, 0),
    estimatedWakeLoss: (wakeIntensity * 15).toFixed(1), // Simplified calculation
    affectedTurbines: Math.floor(turbines.length * wakeIntensity),
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <SpaceBetween size="l">
        <Container
          header={
            <Header
              variant="h1"
              description="Interactive visualization of turbine wake effects using Leaflet.heat"
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Badge color="blue">10 Turbines</Badge>
                  <Badge color="green">30 MW Total</Badge>
                  <Badge color="red">~{wakeStats.estimatedWakeLoss}% Wake Loss</Badge>
                </SpaceBetween>
              }
            >
              Wake Heat Map Mockup
            </Header>
          }
        >
          <Alert type="info" header="About This Mockup">
            This page demonstrates wake effect visualization using <strong>Leaflet.heat</strong>, 
            a lightweight heat map plugin for Leaflet. The heat map shows turbine wake interference 
            patterns based on wind direction, with intensity representing energy loss due to wake effects.
          </Alert>
        </Container>

        <ColumnLayout columns={2} variant="default">
          {/* Map Container */}
          <Container
            header={<Header variant="h2">Wake Heat Map</Header>}
          >
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: '600px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e9ebed',
              }}
            />
            <Box margin={{ top: 's' }} variant="small" color="text-body-secondary">
              <strong>Legend:</strong> Blue markers = turbines, Heat map = wake intensity 
              (red = high wake loss, blue = low wake loss)
            </Box>
          </Container>

          {/* Controls */}
          <SpaceBetween size="l">
            <Container header={<Header variant="h2">Wake Parameters</Header>}>
              <SpaceBetween size="m">
                {/* Wind Direction */}
                <div>
                  <Box variant="awsui-key-label">Wind Direction: {windDirection}°</Box>
                  <Slider
                    value={windDirection}
                    onChange={({ detail }) => setWindDirection(detail.value)}
                    min={0}
                    max={360}
                    step={15}
                    valueFormatter={(value) => `${value}° (${getDirectionLabel(value)})`}
                  />
                  <Box variant="small" color="text-body-secondary">
                    Adjust wind direction to see wake patterns change
                  </Box>
                </div>

                {/* Wake Intensity */}
                <div>
                  <Box variant="awsui-key-label">Wake Intensity: {(wakeIntensity * 100).toFixed(0)}%</Box>
                  <Slider
                    value={wakeIntensity}
                    onChange={({ detail }) => setWakeIntensity(detail.value)}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    valueFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <Box variant="small" color="text-body-secondary">
                    Higher intensity = stronger wake effects
                  </Box>
                </div>
              </SpaceBetween>
            </Container>

            <Container header={<Header variant="h2">Visualization Settings</Header>}>
              <SpaceBetween size="m">
                {/* Heat Map Radius */}
                <div>
                  <Box variant="awsui-key-label">Heat Radius: {radius}px</Box>
                  <Slider
                    value={radius}
                    onChange={({ detail }) => setRadius(detail.value)}
                    min={10}
                    max={50}
                    step={5}
                  />
                </div>

                {/* Heat Map Blur */}
                <div>
                  <Box variant="awsui-key-label">Blur Amount: {blur}px</Box>
                  <Slider
                    value={blur}
                    onChange={({ detail }) => setBlur(detail.value)}
                    min={5}
                    max={30}
                    step={5}
                  />
                </div>

                {/* Color Gradient */}
                <div>
                  <Box variant="awsui-key-label">Color Gradient</Box>
                  <Select
                    selectedOption={gradientOptions.find(opt => opt.value === selectedGradient) || gradientOptions[0]}
                    onChange={({ detail }) => setSelectedGradient(detail.selectedOption.value!)}
                    options={gradientOptions}
                  />
                </div>
              </SpaceBetween>
            </Container>

            <Container header={<Header variant="h2">Wake Statistics</Header>}>
              <ColumnLayout columns={2} variant="text-grid">
                <div>
                  <Box variant="awsui-key-label">Total Turbines</Box>
                  <Box variant="p">{wakeStats.totalTurbines}</Box>
                </div>
                <div>
                  <Box variant="awsui-key-label">Total Capacity</Box>
                  <Box variant="p">{wakeStats.totalCapacity} MW</Box>
                </div>
                <div>
                  <Box variant="awsui-key-label">Estimated Wake Loss</Box>
                  <Box variant="p" color="text-status-error">
                    {wakeStats.estimatedWakeLoss}%
                  </Box>
                </div>
                <div>
                  <Box variant="awsui-key-label">Affected Turbines</Box>
                  <Box variant="p">{wakeStats.affectedTurbines}</Box>
                </div>
              </ColumnLayout>
            </Container>

            <Container header={<Header variant="h3">Implementation Notes</Header>}>
              <SpaceBetween size="s">
                <Box variant="p">
                  <strong>Library:</strong> leaflet.heat (0.2.0)
                </Box>
                <Box variant="p">
                  <strong>Installation:</strong> <code>npm install leaflet.heat @types/leaflet.heat</code>
                </Box>
                <Box variant="p">
                  <strong>Performance:</strong> Handles 10,000+ points efficiently
                </Box>
                <Box variant="p">
                  <strong>Integration:</strong> Works seamlessly with existing Leaflet maps
                </Box>
                <Button
                  variant="primary"
                  iconName="external"
                  onClick={() => window.open('https://github.com/Leaflet/Leaflet.heat', '_blank')}
                >
                  View Documentation
                </Button>
              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </ColumnLayout>
      </SpaceBetween>
    </div>
  );
};

// Helper function to get direction label
function getDirectionLabel(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export default WakeHeatMapMockup;
