import React, { useState } from 'react';
import {
  FormField,
  Select,
  Input,
  Button,
  Box,
} from '@cloudscape-design/components';

interface SimplifiedOSDUQueryBuilderProps {
  onExecute: (naturalLanguageQuery: string) => void;
  onClose: () => void;
}

const DATA_TYPES = [
  { label: 'Well', value: 'wells' },
  { label: 'Wellbore', value: 'wellbores' },
  { label: 'Log', value: 'logs' },
  { label: 'Seismic', value: 'seismic' },
];

export const SimplifiedOSDUQueryBuilder: React.FC<SimplifiedOSDUQueryBuilderProps> = ({
  onExecute,
  onClose,
}) => {
  const [selectedDataType, setSelectedDataType] = useState(DATA_TYPES[0]);
  const [fieldName, setFieldName] = useState('');
  const [fieldValue, setFieldValue] = useState('');

  const buildQuery = (): string => {
    const base = `show me OSDU ${selectedDataType.value}`;
    if (fieldName.trim() && fieldValue.trim()) {
      return `${base} where ${fieldName.trim()} is ${fieldValue.trim()}`;
    }
    return base;
  };

  const handleSearch = () => {
    onExecute(buildQuery());
  };

  return (
    <Box padding="s">
      <div style={{ marginBottom: '8px' }}>
        <FormField label="Data type">
          <Select
            selectedOption={selectedDataType}
            onChange={({ detail }) =>
              setSelectedDataType(detail.selectedOption as typeof selectedDataType)
            }
            options={DATA_TYPES}
          />
        </FormField>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <div style={{ flex: '1 1 auto' }}>
          <FormField label="Field name (optional)">
            <Input
              value={fieldName}
              onChange={({ detail }) => setFieldName(detail.value)}
              placeholder="e.g. operator"
            />
          </FormField>
        </div>
        <div style={{ flex: '1 1 auto' }}>
          <FormField label="Value (optional)">
            <Input
              value={fieldValue}
              onChange={({ detail }) => setFieldValue(detail.value)}
              placeholder="e.g. Shell"
            />
          </FormField>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0, paddingBottom: '2px' }}>
          <Button variant="normal" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </div>
    </Box>
  );
};
