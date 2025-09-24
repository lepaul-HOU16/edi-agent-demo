/**
 * CurveSelectionPanel Component - Interface for showing/hiding curves and customization
 * Requirements: 3.3
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Slider,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  Visibility,
  VisibilityOff,
  Palette,
  LineWeight,
  Add,
  Remove,
  Refresh
} from '@mui/icons-material';
import { WellLogData } from '../../types/petrophysics';
import { TrackConfig, CurveConfig } from './LogPlotViewer';

// Color palette for curve customization
const CURVE_COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#808080',
  '#C0C0C0', '#FF8000', '#8000FF', '#FF0080', '#80FF00', '#0080FF', '#FF8080'
];

// Line style options
const LINE_STYLES = [
  { value: 'solid', label: 'Solid', pattern: [] },
  { value: 'dashed', label: 'Dashed', pattern: [5, 5] },
  { value: 'dotted', label: 'Dotted', pattern: [2, 2] },
  { value: 'dashdot', label: 'Dash-Dot', pattern: [5, 2, 2, 2] }
];

export interface CurveVisibility {
  wellName: string;
  curveName: string;
  visible: boolean;
  color: string;
  lineWidth: number;
  lineStyle: string;
  opacity: number;
}

export interface CurveOverlay {
  id: string;
  name: string;
  curves: Array<{
    wellName: string;
    curveName: string;
    color: string;
    lineWidth: number;
  }>;
  visible: boolean;
}

export interface CurveSelectionPanelProps {
  wellData: WellLogData[];
  tracks: TrackConfig[];
  curveVisibility: CurveVisibility[];
  overlays: CurveOverlay[];
  onCurveVisibilityChange: (visibility: CurveVisibility[]) => void;
  onOverlayChange: (overlays: CurveOverlay[]) => void;
  onCurveStyleChange: (wellName: string, curveName: string, style: Partial<CurveVisibility>) => void;
}

export const CurveSelectionPanel: React.FC<CurveSelectionPanelProps> = ({
  wellData,
  tracks,
  curveVisibility,
  overlays,
  onCurveVisibilityChange,
  onOverlayChange,
  onCurveStyleChange
}) => {
  const [selectedCurves, setSelectedCurves] = useState<string[]>([]);
  const [newOverlayName, setNewOverlayName] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['curves']);

  // Group curves by track
  const curvesByTrack = React.useMemo(() => {
    const groups: { [trackId: string]: Array<{ wellName: string; curve: any; config: CurveConfig }> } = {};
    
    tracks.forEach(track => {
      groups[track.id] = [];
      
      wellData.forEach(well => {
        track.curves.forEach(curveConfig => {
          const curve = well.curves.find(c => c.name === curveConfig.name);
          if (curve) {
            groups[track.id].push({
              wellName: well.wellName,
              curve,
              config: curveConfig
            });
          }
        });
      });
    });
    
    return groups;
  }, [wellData, tracks]);

  // Handle curve visibility toggle
  const handleCurveVisibilityToggle = useCallback((wellName: string, curveName: string) => {
    const updated = curveVisibility.map(cv => 
      cv.wellName === wellName && cv.curveName === curveName
        ? { ...cv, visible: !cv.visible }
        : cv
    );
    onCurveVisibilityChange(updated);
  }, [curveVisibility, onCurveVisibilityChange]);

  // Handle curve selection for overlay creation
  const handleCurveSelection = useCallback((wellName: string, curveName: string) => {
    const curveId = `${wellName}:${curveName}`;
    setSelectedCurves(prev => 
      prev.includes(curveId)
        ? prev.filter(id => id !== curveId)
        : [...prev, curveId]
    );
  }, []);

  // Create new overlay from selected curves
  const handleCreateOverlay = useCallback(() => {
    if (selectedCurves.length === 0 || !newOverlayName.trim()) return;
    
    const newOverlay: CurveOverlay = {
      id: `overlay_${Date.now()}`,
      name: newOverlayName.trim(),
      curves: selectedCurves.map((curveId, index) => {
        const [wellName, curveName] = curveId.split(':');
        return {
          wellName,
          curveName,
          color: CURVE_COLORS[index % CURVE_COLORS.length],
          lineWidth: 2
        };
      }),
      visible: true
    };
    
    onOverlayChange([...overlays, newOverlay]);
    setSelectedCurves([]);
    setNewOverlayName('');
  }, [selectedCurves, newOverlayName, overlays, onOverlayChange]);

  // Remove overlay
  const handleRemoveOverlay = useCallback((overlayId: string) => {
    onOverlayChange(overlays.filter(o => o.id !== overlayId));
  }, [overlays, onOverlayChange]);

  // Toggle overlay visibility
  const handleOverlayVisibilityToggle = useCallback((overlayId: string) => {
    const updated = overlays.map(overlay =>
      overlay.id === overlayId
        ? { ...overlay, visible: !overlay.visible }
        : overlay
    );
    onOverlayChange(updated);
  }, [overlays, onOverlayChange]);

  // Handle section expansion
  const handleSectionToggle = useCallback((section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  }, []);

  // Reset all curves to default visibility
  const handleResetVisibility = useCallback(() => {
    const reset = curveVisibility.map(cv => ({ ...cv, visible: true }));
    onCurveVisibilityChange(reset);
  }, [curveVisibility, onCurveVisibilityChange]);

  // Get curve visibility info
  const getCurveVisibility = useCallback((wellName: string, curveName: string) => {
    return curveVisibility.find(cv => cv.wellName === wellName && cv.curveName === curveName);
  }, [curveVisibility]);

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="h3">
          Curve Selection & Overlays
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Show/hide curves and create comparison overlays
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Curve Visibility Section */}
        <Accordion 
          expanded={expandedSections.includes('curves')}
          onChange={() => handleSectionToggle('curves')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Visibility fontSize="small" />
              <Typography variant="subtitle2">Curve Visibility</Typography>
              <Chip 
                size="small" 
                label={`${curveVisibility.filter(cv => cv.visible).length}/${curveVisibility.length}`}
                color="primary"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Toggle curve visibility by track
                </Typography>
                <Button size="small" onClick={handleResetVisibility} startIcon={<Refresh />}>
                  Show All
                </Button>
              </Box>

              {Object.entries(curvesByTrack).map(([trackId, curves]) => {
                const track = tracks.find(t => t.id === trackId);
                if (!track || curves.length === 0) return null;

                return (
                  <Box key={trackId}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                      {track.title}
                    </Typography>
                    <Stack spacing={1} sx={{ ml: 2 }}>
                      {curves.map(({ wellName, curve, config }) => {
                        const visibility = getCurveVisibility(wellName, curve.name);
                        const isSelected = selectedCurves.includes(`${wellName}:${curve.name}`);
                        
                        return (
                          <Box key={`${wellName}-${curve.name}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={visibility?.visible ?? true}
                                  onChange={() => handleCurveVisibilityToggle(wellName, curve.name)}
                                  size="small"
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      width: 16,
                                      height: 3,
                                      backgroundColor: visibility?.color ?? config.color,
                                      borderRadius: 1
                                    }}
                                  />
                                  <Typography variant="body2">
                                    {curve.name} ({wellName})
                                  </Typography>
                                </Box>
                              }
                              sx={{ flex: 1 }}
                            />
                            
                            <Tooltip title="Select for overlay">
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleCurveSelection(wellName, curve.name)}
                                size="small"
                                color="secondary"
                              />
                            </Tooltip>
                            
                            <Tooltip title="Customize style">
                              <IconButton size="small">
                                <Palette fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Overlay Creation Section */}
        <Accordion 
          expanded={expandedSections.includes('create-overlay')}
          onChange={() => handleSectionToggle('create-overlay')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Add fontSize="small" />
              <Typography variant="subtitle2">Create Overlay</Typography>
              {selectedCurves.length > 0 && (
                <Chip size="small" label={selectedCurves.length} color="secondary" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="caption" color="text.secondary">
                Select curves above and create a comparison overlay
              </Typography>
              
              {selectedCurves.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>Selected Curves:</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedCurves.map(curveId => {
                      const [wellName, curveName] = curveId.split(':');
                      return (
                        <Chip
                          key={curveId}
                          label={`${curveName} (${wellName})`}
                          size="small"
                          onDelete={() => handleCurveSelection(wellName, curveName)}
                        />
                      );
                    })}
                  </Stack>
                </Box>
              )}
              
              <TextField
                label="Overlay Name"
                value={newOverlayName}
                onChange={(e) => setNewOverlayName(e.target.value)}
                size="small"
                fullWidth
                placeholder="Enter overlay name..."
              />
              
              <Button
                variant="contained"
                onClick={handleCreateOverlay}
                disabled={selectedCurves.length === 0 || !newOverlayName.trim()}
                startIcon={<Add />}
                size="small"
              >
                Create Overlay
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Existing Overlays Section */}
        <Accordion 
          expanded={expandedSections.includes('overlays')}
          onChange={() => handleSectionToggle('overlays')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Palette fontSize="small" />
              <Typography variant="subtitle2">Active Overlays</Typography>
              <Chip size="small" label={overlays.length} color="primary" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {overlays.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No overlays created yet
                </Typography>
              ) : (
                overlays.map(overlay => (
                  <Paper key={overlay.id} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">{overlay.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={overlay.visible ? 'Hide overlay' : 'Show overlay'}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOverlayVisibilityToggle(overlay.id)}
                          >
                            {overlay.visible ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove overlay">
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveOverlay(overlay.id)}
                            color="error"
                          >
                            <Remove />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Stack spacing={1}>
                      {overlay.curves.map((curve, index) => (
                        <Box key={`${curve.wellName}-${curve.curveName}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 3,
                              backgroundColor: curve.color,
                              borderRadius: 1
                            }}
                          />
                          <Typography variant="caption">
                            {curve.curveName} ({curve.wellName})
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Paper>
  );
};

export default CurveSelectionPanel;