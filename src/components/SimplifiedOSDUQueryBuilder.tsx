import React, { useState } from 'react';
import {
  SpaceBetween,
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
      <SpaceBetween size="s">
        <FormField label="Data type">
          <Select
            selectedOption={selectedDataType}
            onChange={({ detail }) =>
              setSelectedDataType(detail.selectedOption as typeof selectedDataType)
            }
            options={DATA_TYPES}
          />
        </FormField>

        <SpaceBetween size="xs" direction="horizontal">
          <FormField label="Field name (optional)">
            <Input
              value={fieldName}
              onChange={({ detail }) => setFieldName(detail.value)}
              placeholder="e.g. operator"
            />
          </FormField>
          <FormField label="Value (optional)">
            <Input
              value={fieldValue}
              onChange={({ detail }) => setFieldValue(detail.value)}
              placeholder="e.g. Shell"
            />
          </FormField>
        </SpaceBetween>

        <SpaceBetween size="xs" direction="horizontal">
          <Button variant="primary" onClick={handleSearch}>
            Search
          </Button>
          <Button variant="normal" onClick={onClose}>
            Close
          </Button>
        </SpaceBetween>
      </SpaceBetween>
    </Box>
  );
};
