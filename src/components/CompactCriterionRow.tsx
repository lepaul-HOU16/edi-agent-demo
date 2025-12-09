import React from 'react';
import { Grid, Select, Input, Button } from '@cloudscape-design/components';
import type { SelectProps } from '@cloudscape-design/components';

export interface QueryCriterion {
  id: string;
  field: string;
  fieldType: 'string' | 'number' | 'date';
  operator: string;
  value: string | number;
  isValid: boolean;
  errorMessage?: string;
}

interface CompactCriterionRowProps {
  criterion: QueryCriterion;
  index: number;
  onUpdate: (updates: Partial<QueryCriterion>) => void;
  onRemove: () => void;
  dataType: string;
}

const getFieldOptions = (dataType: string): SelectProps.Option[] => {
  const wellFields: SelectProps.Option[] = [
    { label: 'Operator', value: 'data.operator' },
    { label: 'Country', value: 'data.country' },
    { label: 'Basin', value: 'data.basin' },
    { label: 'Depth', value: 'data.VerticalMeasurement.Depth.Value' },
    { label: 'Well Name', value: 'data.FacilityName' },
    { label: 'Status', value: 'data.status' },
    { label: 'Type', value: 'data.type' }
  ];

  const wellboreFields: SelectProps.Option[] = [
    { label: 'Wellbore Name', value: 'data.WellboreName' },
    { label: 'Operator', value: 'data.operator' },
    { label: 'Status', value: 'data.status' }
  ];

  const logFields: SelectProps.Option[] = [
    { label: 'Log Name', value: 'data.LogName' },
    { label: 'Log Type', value: 'data.LogType' }
  ];

  switch (dataType) {
    case 'wellbore':
      return wellboreFields;
    case 'log':
      return logFields;
    case 'seismic':
      return [{ label: 'Survey Name', value: 'data.SurveyName' }];
    default:
      return wellFields;
  }
};

const getOperatorOptions = (fieldType: 'string' | 'number' | 'date'): SelectProps.Option[] => {
  if (fieldType === 'number') {
    return [
      { label: 'Equals', value: '=' },
      { label: 'Greater Than', value: '>' },
      { label: 'Less Than', value: '<' },
      { label: 'Greater or Equal', value: '>=' },
      { label: 'Less or Equal', value: '<=' },
      { label: 'Not Equal', value: '!=' }
    ];
  }

  if (fieldType === 'date') {
    return [
      { label: 'Equals', value: '=' },
      { label: 'After', value: '>' },
      { label: 'Before', value: '<' }
    ];
  }

  return [
    { label: 'Equals', value: '=' },
    { label: 'Contains', value: 'LIKE' },
    { label: 'Starts With', value: 'STARTS_WITH' },
    { label: 'Not Equal', value: '!=' }
  ];
};

export const CompactCriterionRow: React.FC<CompactCriterionRowProps> = ({
  criterion,
  onUpdate,
  onRemove,
  dataType
}) => {
  const fieldOptions = getFieldOptions(dataType);
  const operatorOptions = getOperatorOptions(criterion.fieldType);

  const selectedField = fieldOptions.find(opt => opt.value === criterion.field) || null;
  const selectedOperator = operatorOptions.find(opt => opt.value === criterion.operator) || null;

  return (
    <Grid
      gridDefinition={[
        { colspan: 4 },
        { colspan: 3 },
        { colspan: 4 },
        { colspan: 1 }
      ]}
    >
      <Select
        selectedOption={selectedField}
        onChange={({ detail }) => {
          const newField = detail.selectedOption.value || '';
          const newFieldType = newField.includes('Depth') ? 'number' : 'string';
          onUpdate({ field: newField, fieldType: newFieldType });
        }}
        options={fieldOptions}
        placeholder="Select field"
        expandToViewport
      />

      <Select
        selectedOption={selectedOperator}
        onChange={({ detail }) => onUpdate({ operator: detail.selectedOption.value || '=' })}
        options={operatorOptions}
        placeholder="Operator"
        expandToViewport
      />

      <Input
        value={String(criterion.value)}
        onChange={({ detail }) => onUpdate({ value: detail.value })}
        placeholder="Value"
        invalid={!criterion.isValid}
        type={criterion.fieldType === 'number' ? 'number' : 'text'}
      />

      <Button
        onClick={onRemove}
        iconName="remove"
        variant="icon"
        ariaLabel="Remove criterion"
      />
    </Grid>
  );
};
