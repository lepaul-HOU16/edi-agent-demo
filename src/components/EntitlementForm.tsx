'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Alert,
  Divider,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { Entitlement, EntitlementCondition, CreateEntitlementInput, UpdateEntitlementInput } from '../hooks/useEntitlementOperations';

interface EntitlementFormProps {
  initialData?: Entitlement | null;
  onSubmit: (data: CreateEntitlementInput | UpdateEntitlementInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// Available actions for entitlements
const AVAILABLE_ACTIONS = ['read', 'write', 'delete', 'admin'];

// Available attributes for conditions
const AVAILABLE_ATTRIBUTES = [
  'data.kind',
  'data.source',
  'data.type',
  'data.classification',
  'data.originator',
  'data.countryOfOrigin',
  'legal.legaltags',
  'legal.otherRelevantDataCountries'
];

// Available operators for conditions
const AVAILABLE_OPERATORS = [
  'equals',
  'contains',
  'startsWith',
  'endsWith',
  'in',
  'notEquals'
];

const EntitlementForm: React.FC<EntitlementFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false
}) => {
  // Form state
  const [groupEmail, setGroupEmail] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [conditions, setConditions] = useState<EntitlementCondition[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setGroupEmail(initialData.groupEmail);
      setSelectedActions(initialData.actions);
      setConditions(initialData.conditions || []);
    } else {
      // Reset form for create mode
      setGroupEmail('');
      setSelectedActions([]);
      setConditions([]);
    }
    setErrors({});
  }, [initialData]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate group email
    if (!groupEmail.trim()) {
      newErrors.groupEmail = 'Group email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(groupEmail)) {
      newErrors.groupEmail = 'Please enter a valid email address';
    }

    // Validate actions
    if (selectedActions.length === 0) {
      newErrors.actions = 'At least one action must be selected';
    }

    // Validate conditions
    conditions.forEach((condition, index) => {
      if (!condition.attribute.trim()) {
        newErrors[`condition_${index}_attribute`] = 'Attribute is required';
      }
      if (!condition.operator.trim()) {
        newErrors[`condition_${index}_operator`] = 'Operator is required';
      }
      if (!condition.value.trim()) {
        newErrors[`condition_${index}_value`] = 'Value is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle action selection
  const handleActionChange = (action: string, checked: boolean) => {
    if (checked) {
      setSelectedActions(prev => [...prev, action]);
    } else {
      setSelectedActions(prev => prev.filter(a => a !== action));
    }
  };

  // Handle condition changes
  const handleConditionChange = (index: number, field: keyof EntitlementCondition, value: string) => {
    setConditions(prev => prev.map((condition, i) => 
      i === index ? { ...condition, [field]: value } : condition
    ));
  };

  // Add new condition
  const addCondition = () => {
    setConditions(prev => [...prev, { attribute: '', operator: '', value: '' }]);
  };

  // Remove condition
  const removeCondition = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const formData = {
      groupEmail: groupEmail.trim(),
      actions: selectedActions,
      conditions: conditions.filter(c => c.attribute && c.operator && c.value)
    };

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 2 }}>
      {/* Group Email */}
      <TextField
        fullWidth
        label="Group Email"
        value={groupEmail}
        onChange={(e) => setGroupEmail(e.target.value)}
        error={!!errors.groupEmail}
        helperText={errors.groupEmail || 'Enter the email address of the group to grant entitlements'}
        margin="normal"
        required
        disabled={loading}
        placeholder="data-admins@example.com"
      />

      {/* Actions Selection */}
      <FormControl component="fieldset" margin="normal" fullWidth error={!!errors.actions}>
        <FormLabel component="legend">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon fontSize="small" />
            Actions
          </Box>
        </FormLabel>
        <FormGroup row sx={{ mt: 1 }}>
          {AVAILABLE_ACTIONS.map((action) => (
            <FormControlLabel
              key={action}
              control={
                <Checkbox
                  checked={selectedActions.includes(action)}
                  onChange={(e) => handleActionChange(action, e.target.checked)}
                  disabled={loading}
                />
              }
              label={
                <Chip
                  label={action}
                  size="small"
                  color={selectedActions.includes(action) ? 'primary' : 'default'}
                  variant={selectedActions.includes(action) ? 'filled' : 'outlined'}
                />
              }
            />
          ))}
        </FormGroup>
        {errors.actions && (
          <Typography variant="caption" color="error" sx={{ mt: 1 }}>
            {errors.actions}
          </Typography>
        )}
      </FormControl>

      <Divider sx={{ my: 3 }} />

      {/* Conditions */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Access Conditions
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addCondition}
            disabled={loading}
            size="small"
          >
            Add Condition
          </Button>
        </Box>

        {conditions.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No conditions specified. This entitlement will apply to all resources.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {conditions.map((condition, index) => (
              <Paper key={index} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ minWidth: 100 }}>
                    Condition {index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeCondition(index)}
                    disabled={loading}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {/* Attribute */}
                  <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel>Attribute</InputLabel>
                    <Select
                      value={condition.attribute}
                      onChange={(e) => handleConditionChange(index, 'attribute', e.target.value)}
                      label="Attribute"
                      disabled={loading}
                      error={!!errors[`condition_${index}_attribute`]}
                    >
                      {AVAILABLE_ATTRIBUTES.map((attr) => (
                        <MenuItem key={attr} value={attr}>
                          {attr}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Operator */}
                  <FormControl sx={{ minWidth: 150 }} size="small">
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={condition.operator}
                      onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                      label="Operator"
                      disabled={loading}
                      error={!!errors[`condition_${index}_operator`]}
                    >
                      {AVAILABLE_OPERATORS.map((op) => (
                        <MenuItem key={op} value={op}>
                          {op}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Value */}
                  <TextField
                    label="Value"
                    value={condition.value}
                    onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                    size="small"
                    sx={{ minWidth: 200, flexGrow: 1 }}
                    disabled={loading}
                    error={!!errors[`condition_${index}_value`]}
                    placeholder="Enter condition value"
                  />
                </Box>

                {/* Show errors for this condition */}
                {(errors[`condition_${index}_attribute`] || 
                  errors[`condition_${index}_operator`] || 
                  errors[`condition_${index}_value`]) && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    Please fill in all condition fields
                  </Alert>
                )}
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      {/* Form Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          startIcon={<CancelIcon />}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')} Entitlement
        </Button>
      </Box>
    </Box>
  );
};

export default EntitlementForm;
