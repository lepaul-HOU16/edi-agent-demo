'use client';

import React, { useState } from 'react';
import { Multiselect, MultiselectProps } from '@cloudscape-design/components';

interface OSDUMultiSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options?: string[];
  invalid?: boolean;
  placeholder?: string;
}

/**
 * Multi-select component for IN operator
 * Allows selecting multiple values from a list or entering custom values
 */
export const OSDUMultiSelect: React.FC<OSDUMultiSelectProps> = ({
  value,
  onChange,
  options = [],
  invalid = false,
  placeholder = 'Select or type values...'
}) => {
  // Parse current value (comma-separated)
  const valueStr = String(value);
  const selectedValues = valueStr
    .split(',')
    .map(v => v.trim())
    .filter(v => v.length > 0);

  // Convert to Multiselect format
  const selectedOptions = selectedValues.map(v => ({ value: v, label: v }));

  // Available options
  const availableOptions = options.map(opt => ({ value: opt, label: opt }));

  const handleChange: MultiselectProps['onChange'] = ({ detail }) => {
    // Convert selected options back to comma-separated string
    const newValue = detail.selectedOptions.map(opt => opt.value).join(', ');
    onChange(newValue);
  };

  return (
    <Multiselect
      selectedOptions={selectedOptions}
      onChange={handleChange}
      options={availableOptions}
      placeholder={placeholder}
      filteringType="auto"
      tokenLimit={3}
      i18nStrings={{
        tokenLimitShowMore: 'Show more',
        tokenLimitShowFewer: 'Show fewer'
      }}
      invalid={invalid}
      // Allow custom values by enabling free text entry
      // Users can type and press Enter to add custom values
    />
  );
};
