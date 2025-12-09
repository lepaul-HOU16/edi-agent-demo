import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  FormField,
  Select,
  Button,
  Box,
  ExpandableSection,
  Input
} from '@cloudscape-design/components';
import type { SelectProps } from '@cloudscape-design/components';
import { CompactCriterionRow, QueryCriterion } from './CompactCriterionRow';
import './CompactOSDUQueryBuilder.css';

interface CompactQueryBuilderProps {
  onExecute: (query: string, criteria: QueryCriterion[]) => void;
  onClose: () => void;
  isSticky?: boolean;
}

const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const generateOSDUQuery = (criteria: QueryCriterion[]): string => {
  if (criteria.length === 0) {
    return '// No criteria defined';
  }

  const validCriteria = criteria.filter(c => c.isValid && c.field && c.value);
  
  if (validCriteria.length === 0) {
    return '// Add valid criteria to generate query';
  }

  const queryParts = validCriteria.map(criterion => {
    const { field, operator, value, fieldType } = criterion;
    
    if (fieldType === 'number') {
      return `${field} ${operator} ${value}`;
    }
    
    if (operator === 'LIKE') {
      return `${field} LIKE "%${value}%"`;
    }
    
    if (operator === 'STARTS_WITH') {
      return `${field} LIKE "${value}%"`;
    }
    
    return `${field} ${operator} "${value}"`;
  });

  return queryParts.join(' AND ');
};

export const CompactOSDUQueryBuilder: React.FC<CompactQueryBuilderProps> = ({
  onExecute,
  onClose,
  isSticky = true
}) => {
  const [dataType, setDataType] = useState<string>('well');
  const [criteria, setCriteria] = useState<QueryCriterion[]>([]);
  const [queryPreview, setQueryPreview] = useState<string>('// Add criteria to build query');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxResults, setMaxResults] = useState<string>('1000');

  const debouncedUpdatePreview = useMemo(
    () => debounce((criteria: QueryCriterion[]) => {
      const query = generateOSDUQuery(criteria);
      setQueryPreview(query);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedUpdatePreview(criteria);
  }, [criteria, debouncedUpdatePreview]);

  const addCriterion = useCallback(() => {
    const newCriterion: QueryCriterion = {
      id: `criterion-${Date.now()}`,
      field: '',
      fieldType: 'string',
      operator: '=',
      value: '',
      isValid: false
    };
    setCriteria(prev => [...prev, newCriterion]);
  }, []);

  const updateCriterion = useCallback((id: string, updates: Partial<QueryCriterion>) => {
    setCriteria(prev => prev.map(c => {
      if (c.id !== id) return c;
      
      const updated = { ...c, ...updates };
      updated.isValid = Boolean(updated.field && updated.value);
      
      return updated;
    }));
  }, []);

  const removeCriterion = useCallback((id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleExecute = useCallback(() => {
    const validCriteria = criteria.filter(c => c.isValid);
    if (validCriteria.length === 0) {
      return;
    }
    
    const query = generateOSDUQuery(validCriteria);
    onExecute(query, validCriteria);
  }, [criteria, onExecute]);

  const dataTypeOptions: SelectProps.Option[] = [
    { label: 'Well', value: 'well' },
    { label: 'Wellbore', value: 'wellbore' },
    { label: 'Log', value: 'log' },
    { label: 'Seismic', value: 'seismic' }
  ];

  const selectedDataType = dataTypeOptions.find(opt => opt.value === dataType) || dataTypeOptions[0];

  const validCriteriaCount = criteria.filter(c => c.isValid).length;
  const canExecute = validCriteriaCount > 0;

  return (
    <div className={isSticky ? 'compact-query-builder-sticky' : 'compact-query-builder'}>
      <Container
        header={
          <Header
            variant="h3"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button 
                  onClick={() => setShowAdvanced(!showAdvanced)} 
                  iconName="settings"
                  variant="normal"
                >
                  Advanced
                </Button>
                <Button 
                  onClick={onClose} 
                  iconName="close" 
                  variant="icon"
                  ariaLabel="Close query builder"
                />
              </SpaceBetween>
            }
          >
            OSDU Query Builder
          </Header>
        }
      >
        <SpaceBetween size="s">
          <FormField label="Data Type">
            <Select
              selectedOption={selectedDataType}
              onChange={({ detail }) => setDataType(detail.selectedOption.value || 'well')}
              options={dataTypeOptions}
              expandToViewport
            />
          </FormField>

          <div className="criteria-list-scrollable">
            <SpaceBetween size="xs">
              {criteria.length === 0 ? (
                <Box textAlign="center" color="text-body-secondary" padding="s">
                  No filters added yet. Click "Add Filter" to start building your query.
                </Box>
              ) : (
                criteria.map((criterion, index) => (
                  <CompactCriterionRow
                    key={criterion.id}
                    criterion={criterion}
                    index={index}
                    onUpdate={(updates) => updateCriterion(criterion.id, updates)}
                    onRemove={() => removeCriterion(criterion.id)}
                    dataType={dataType}
                  />
                ))
              )}
            </SpaceBetween>
          </div>

          <Button 
            onClick={addCriterion} 
            iconName="add-plus"
            fullWidth
          >
            Add Filter
          </Button>

          <ExpandableSection 
            headerText={`Query Preview (${validCriteriaCount} ${validCriteriaCount === 1 ? 'filter' : 'filters'})`}
            variant="footer"
          >
            <Box padding="s">
              <code className="query-preview-code">
                {queryPreview}
              </code>
            </Box>
          </ExpandableSection>

          {showAdvanced && (
            <ExpandableSection 
              headerText="Advanced Options" 
              defaultExpanded
            >
              <SpaceBetween size="s">
                <FormField 
                  label="Max Results"
                  description="Maximum number of records to return (1-10000)"
                >
                  <Input
                    type="number"
                    value={maxResults}
                    onChange={({ detail }) => setMaxResults(detail.value)}
                    placeholder="1000"
                  />
                </FormField>
              </SpaceBetween>
            </ExpandableSection>
          )}

          <Button 
            variant="primary" 
            onClick={handleExecute}
            disabled={!canExecute}
            fullWidth
          >
            Execute Query {canExecute && `(${validCriteriaCount} ${validCriteriaCount === 1 ? 'filter' : 'filters'})`}
          </Button>
        </SpaceBetween>
      </Container>
    </div>
  );
};
