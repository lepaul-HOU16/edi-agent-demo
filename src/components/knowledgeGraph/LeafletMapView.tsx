import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { GraphNode } from '../../types/knowledgeGraph';

// Fix Leaflet default marker icon issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LeafletMapViewProps {
  nodes: GraphNode[];
  selectedNodeId: string | null;
  onNodeSelect: (node: GraphNode) => void;
  theme: 'light' | 'dark';
  viewMode: 'markers' | 'heatmap';
}

// Node type colors matching D3ForceGraph
const NODE_COLORS: Record<string, string> = {
  well: '#3b82f6',      // blue
  event: '#ef4444',     // red
  formation: '#10b981', // green
  equipment: '#f97316', // orange
};

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  nodes,
  selectedNodeId,
  onNodeSelect,
  theme,
  viewMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map centered on Gulf of Mexico (default location for S&P Global / TGS data)
    const map = L.map(mapContainerRef.current, {
      center: [28.0, -90.0], // Gulf of Mexico
      zoom: 6,
      zoomControl: true,
    });

    mapRef.current = map;

    // Add tile layer (will be updated by theme effect)
    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update tile layer when theme changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    // Remove old tile layer
    tileLayerRef.current.remove();

    // Add new tile layer
    const newTileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    });

    newTileLayer.addTo(mapRef.current);
    tileLayerRef.current = newTileLayer;
  }, [theme]);

  // Update markers or heatmap based on viewMode
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Clear existing heatmap
    if (heatLayerRef.current) {
      heatLayerRef.current.remove();
      heatLayerRef.current = null;
    }

    // Filter nodes with valid coordinates
    const nodesWithCoords = nodes.filter(node => 
      node.lat !== undefined && 
      node.lng !== undefined &&
      !isNaN(node.lat) &&
      !isNaN(node.lng)
    );

    if (nodesWithCoords.length === 0) return;

    if (viewMode === 'markers') {
      // Render circle markers
      nodesWithCoords.forEach(node => {
        const color = NODE_COLORS[node.type] || '#6b7280'; // gray fallback
        
        const marker = L.circleMarker([node.lat!, node.lng!], {
          radius: 8,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        // Add click handler
        marker.on('click', () => {
          onNodeSelect(node);
        });

        // Add tooltip
        marker.bindTooltip(node.name, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
        });

        marker.addTo(map);
        markersRef.current.set(node.id, marker);
      });

      // Fit bounds to show all markers
      if (nodesWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          nodesWithCoords.map(node => [node.lat!, node.lng!] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      // Render heatmap
      const heatData: [number, number, number][] = nodesWithCoords.map(node => [
        node.lat!,
        node.lng!,
        1.0, // intensity
      ]);

      const heatLayer = (L as any).heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        gradient: {
          0.0: 'blue',
          0.5: 'lime',
          1.0: 'red',
        },
      });

      heatLayer.addTo(map);
      heatLayerRef.current = heatLayer;

      // Fit bounds to show all points
      if (nodesWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          nodesWithCoords.map(node => [node.lat!, node.lng!] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [nodes, viewMode, onNodeSelect]);

  // Highlight selected marker
  useEffect(() => {
    if (!mapRef.current || viewMode !== 'markers') return;

    // Reset all markers to normal style
    markersRef.current.forEach((marker, nodeId) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        const color = NODE_COLORS[node.type] || '#6b7280';
        marker.setStyle({
          radius: 8,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.8,
        });
      }
    });

    // Highlight selected marker
    if (selectedNodeId) {
      const selectedMarker = markersRef.current.get(selectedNodeId);
      if (selectedMarker) {
        selectedMarker.setStyle({
          radius: 12,
          weight: 3,
          fillOpacity: 1.0,
        });
        selectedMarker.bringToFront();
      }
    }
  }, [selectedNodeId, nodes, viewMode]);

  // Center map on selected node
  useEffect(() => {
    if (!mapRef.current || !selectedNodeId) return;

    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (selectedNode && selectedNode.lat !== undefined && selectedNode.lng !== undefined) {
      mapRef.current.setView([selectedNode.lat, selectedNode.lng], 10, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [selectedNodeId, nodes]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
      }}
    />
  );
};
