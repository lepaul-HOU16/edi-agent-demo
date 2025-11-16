
import React from 'react';
import { FormField, Input, SpaceBetween, ColumnLayout, DatePicker } from '@cloudscape-design/components';

interface OSDURangeInputProps {
  fieldType: 'number' | 'date';
  value: string | number;
  onChange: (value: string) => void;
  invalid?: boolean;
  fieldLabel?: string;
}

/**
 * Range input component for BETWEEN operator
 * Handles both numeric ranges and date ranges
 */
export const OSDURangeInput: React.FC<OSDURangeInputProps> = ({
  fieldType,
  value,
  onChange,
  invalid = false,
  fieldLabel = 'Value'
}) => {
  // Parse the current value (comma-separated min,max)
  const valueStr = String(value);
  const parts = valueStr.split(',').map(v => v.trim());
  const minValue = parts[0] || '';
  const maxValue = parts[1] || '';

  const handleMinChange = (newMin: string) => {
    const newValue = `${newMin}, ${maxValue}`;
    onChange(newValue);
  };

  const handleMaxChange = (newMax: string) => {
    const newValue = `${minValue}, ${newMax}`;
    onChange(newValue);
  };

  if (fieldType === 'date') {
    return (
      <SpaceBetween size="xs">
        <ColumnLayout columns={2} variant="text-grid">
          <FormField
            label="Start Date"
            description="YYYY-MM-DD"
          >
            <DatePicker
              value={minValue}
              onChange={({ detail }) => handleMinChange(detail.value)}
              placeholder="YYYY-MM-DD"
              invalid={invalid}
              openCalendarAriaLabel={(selectedDate) =>
                "Choose start date" + (selectedDate ? `, selected date is ${selectedDate}` : "")
              }
              nextMonthAriaLabel="Next month"
              previousMonthAriaLabel="Previous month"
              todayAriaLabel="Today"
            />
          </FormField>

          <FormField
            label="End Date"
            description="YYYY-MM-DD"
          >
            <DatePicker
              value={maxValue}
              onChange={({ detail }) => handleMaxChange(detail.value)}
              placeholder="YYYY-MM-DD"
              invalid={invalid}
              openCalendarAriaLabel={(selectedDate) =>
                "Choose end date" + (selectedDate ? `, selected date is ${selectedDate}` : "")
              }
              nextMonthAriaLabel="Next month"
              previousMonthAriaLabel="Previous month"
              todayAriaLabel="Today"
            />
          </FormField>
        </ColumnLayout>
      </SpaceBetween>
    );
  }

  // Numeric range
  return (
    <SpaceBetween size="xs">
      <ColumnLayout columns={2} variant="text-grid">
        <FormField
          label="Minimum"
          description="Lower bound"
        >
          <Input
            value={minValue}
            onChange={({ detail }) => handleMinChange(detail.value)}
            type="number"
            placeholder="Min value"
            invalid={invalid}
          />
        </FormField>

        <FormField
          label="Maximum"
          description="Upper bound"
        >
          <Input
            value={maxValue}
            onChange={({ detail }) => handleMaxChange(detail.value)}
            type="number"
            placeholder="Max value"
            invalid={invalid}
          />
        </FormField>
      </ColumnLayout>
    </SpaceBetween>
  );
};
