/**
 * Renewable Configuration Panel
 * 
 * UI component for managing renewable energy configuration settings.
 * Allows users to adjust feature flags, deployment settings, and error handling options.
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Alert,
  Badge,
  Toggle,
  Input,
  FormField,
  Tabs,
  StatusIndicator,
  Select
} from '@cloudscape-design/components';

import { renewableConfig, RenewableConfig } from '../../services/renewable-integration/RenewableConfigManager';

interface RenewableConfigPanelProps {
  className?: string;
  onConfigChange?: (config: any) => void;
}

export function RenewableConfigPanel({ className = '', onConfigChange }: RenewableConfigPanelProps) {
  const [config, setConfig] = useState<RenewableConfig>(renewableConfig.getConfig());
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] });
  const [hasChanges, setHasChanges] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    const unsubscribe = renewableConfig.subscribe((newConfig) => {
      setConfig(newConfig);
      setHasChanges(false);
      if (onConfigChange) {
        onConfigChange(newConfig);
      }
    });

    return unsubscribe;
  }, [onConfigChange]);

  const handleConfigUpdate = (updates: Partial<RenewableConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    setHasChanges(true);
    
    // Validate the new configuration
    const tempConfig = renewableConfig.getConfig();
    renewableConfig.updateConfig(updates);
    const validationResult = renewableConfig.validateConfiguration();
    setValidation(validationResult);
    
    // Restore original config for validation
    renewableConfig.updateConfig(tempConfig);
  };

  const handleSaveChanges = () => {
    renewableConfig.updateConfig(config);
    setHasChanges(false);
  };

  const handleResetToDefaults = () => {
    renewableConfig.resetToDefaults();
    setHasChanges(false);
  };

  const handleExportConfig = () => {
    const configJson = renewableConfig.exportConfiguration();
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'renewable-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = () => {
    const result = renewableConfig.importConfiguration(importText);
    if (result.success) {
      setImportText('');
      setShowImport(false);
    } else {
      alert(`Import failed: ${result.error}`);
    }
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Configure renewable energy features and deployment settings"
          actions={
            <SpaceBetween direction="horizontal" size="s">
              {validation.isValid ? (
                <Badge color="green">
                  <StatusIndicator type="success">Valid Configuration</StatusIndicator>
                </Badge>
              ) : (
                <Badge color="red">
                  <StatusIndicator type="error">
                    {validation.errors.length} Error{validation.errors.length !== 1 ? 's' : ''}
                  </StatusIndicator>
                </Badge>
              )}
              {hasChanges && (
                <Badge color="blue">Unsaved Changes</Badge>
              )}
            </SpaceBetween>
          }
        >
          Renewable Energy Configuration
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        {!validation.isValid && (
          <Alert
            statusIconAriaLabel="Error"
            type="error"
            header="Configuration Errors"
          >
            <ul>
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}
        
        <Tabs
          tabs={[
            {
              label: "Features",
              id: "features",
              content: (
                <SpaceBetween direction="vertical" size="m">
                  <Box variant="h3">Feature Flags</Box>
                  <SpaceBetween direction="vertical" size="s">
                    <FormField label="Terrain Analysis">
                      <Toggle
                        checked={config.features.terrainAnalysis}
                        onChange={({ detail }) => 
                          handleConfigUpdate({ 
                            features: { ...config.features, terrainAnalysis: detail.checked } 
                          })
                        }
                      />
                    </FormField>
                    
                    <FormField label="Layout Optimization">
                      <Toggle
                        checked={config.features.layoutOptimization}
                        onChange={({ detail }) => 
                          handleConfigUpdate({ 
                            features: { ...config.features, layoutOptimization: detail.checked } 
                          })
                        }
                      />
                    </FormField>
                    
                    <FormField label="Wake Simulation">
                      <Toggle
                        checked={config.features.wakeSimulation}
                        onChange={({ detail }) => 
                          handleConfigUpdate({ 
                            features: { ...config.features, wakeSimulation: detail.checked } 
                          })
                        }
                      />
                    </FormField>
                    
                    <FormField label="Report Generation">
                      <Toggle
                        checked={config.features.reportGeneration}
                        onChange={({ detail }) => 
                          handleConfigUpdate({ 
                            features: { ...config.features, reportGeneration: detail.checked } 
                          })
                        }
                      />
                    </FormField>
                  </SpaceBetween>
                </SpaceBetween>
              )
            },
            {
              label: "Deployment",
              id: "deployment", 
              content: (
                <SpaceBetween direction="vertical" size="m">
                  <Box variant="h3">Deployment Settings</Box>
                  <SpaceBetween direction="vertical" size="s">
                    <FormField label="Retry Attempts">
                      <Input
                        type="number"
                        value={config.deployment.retryAttempts.toString()}
                        onChange={({ detail }) => 
                          handleConfigUpdate({ 
                            deployment: { 
                              ...config.deployment, 
                              retryAttempts: parseInt(detail.value, 10) || 0 
                            } 
                          })
                        }
                      />
                    </FormField>
                    
                    <FormField label="Timeout (ms)">
                      <Input
                        type="number"
                        value={config.deployment.timeoutMs.toString()}
                        onChange={({ detail }) => 
                          handleConfigUpdate({ 
                            deployment: { 
                              ...config.deployment, 
                              timeoutMs: parseInt(detail.value, 10) || 30000 
                            } 
                          })
                        }
                      />
                    </FormField>
                  </SpaceBetween>
                </SpaceBetween>
              )
            },
            {
              label: "UI Settings",
              id: "ui",
              content: (
                <SpaceBetween direction="vertical" size="m">
                  <Box variant="h3">UI Settings</Box>
                  <SpaceBetween direction="vertical" size="s">
                    <FormField label="Show Deployment Status">
                      <Toggle
                        checked={config.ui.showDeploymentStatus}
                        onChange={({ detail }) => 
                          handleConfigUpdate({ 
                            ui: { ...config.ui, showDeploymentStatus: detail.checked } 
                          })
                        }
                      />
                    </FormField>
                    
                    <FormField label="Show Debug Info">
                      <Toggle
                        checked={config.ui.showDebugInfo}
                        onChange={({ detail }) => 
                          handleConfigUpdate({ 
                            ui: { ...config.ui, showDebugInfo: detail.checked } 
                          })
                        }
                      />
                    </FormField>
                  </SpaceBetween>
                </SpaceBetween>
              )
            }
          ]}
        />
        
        <SpaceBetween direction="horizontal" size="s">
          <Button
            variant="primary"
            onClick={handleSaveChanges}
            disabled={!hasChanges || !validation.isValid}
          >
            Save Changes
          </Button>
          
          <Button
            onClick={handleResetToDefaults}
          >
            Reset to Defaults
          </Button>
          
          <Button
            onClick={handleExportConfig}
          >
            Export Config
          </Button>
        </SpaceBetween>
      </SpaceBetween>
    </Container>
  );
}