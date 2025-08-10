'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Typography,
  Alert,
  Button,
  Stack,
  Autocomplete,
  FormHelperText,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  DatePicker,
  LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';

interface LegalTagFormData {
  name: string;
  description: string;
  properties: {
    countryOfOrigin: string[];
    contractId: string;
    expirationDate: string;
    originator: string;
    dataType: string;
    securityClassification: string;
    personalData: string;
    exportClassification: string;
  };
}

interface LegalTagFormProps {
  initialData?: Partial<LegalTagFormData>;
  onSubmit: (data: LegalTagFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

// Predefined options for form fields
const SECURITY_CLASSIFICATIONS = [
  'Public',
  'Internal',
  'Confidential',
  'Restricted'
];

const DATA_TYPES = [
  'Well Data',
  'Seismic Data',
  'Production Data',
  'Geological Data',
  'Geophysical Data',
  'Reservoir Data',
  'Drilling Data',
  'Completion Data',
  'Workover Data',
  'Log Data',
  'Core Data',
  'Test Data',
  'Other'
];

const PERSONAL_DATA_OPTIONS = [
  'None',
  'Personal',
  'Sensitive Personal',
  'Anonymous',
  'Pseudonymized'
];

const EXPORT_CLASSIFICATIONS = [
  'EAR99',
  'ECCN',
  'ITAR',
  'Not Applicable'
];

// Common countries for oil and gas operations
const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Norway',
  'Netherlands',
  'Germany',
  'France',
  'Australia',
  'Brazil',
  'Mexico',
  'Saudi Arabia',
  'United Arab Emirates',
  'Qatar',
  'Kuwait',
  'Nigeria',
  'Angola',
  'Russia',
  'Kazakhstan',
  'Malaysia',
  'Indonesia',
  'Other'
];

const LegalTagForm: React.FC<LegalTagFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode
}) => {
  const [formData, setFormData] = useState<LegalTagFormData>({
    name: '',
    description: '',
    properties: {
      countryOfOrigin: ['United States'], // Default to US
      contractId: 'default-contract',
      expirationDate: '2025-12-31T23:59:59.999Z',
      originator: 'OSDU',
      dataType: 'Well Data',
      securityClassification: 'Public',
      personalData: 'None',
      exportClassification: 'EAR99'
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        properties: {
          countryOfOrigin: initialData.properties?.countryOfOrigin || ['United States'],
          contractId: initialData.properties?.contractId || 'default-contract',
          expirationDate: initialData.properties?.expirationDate || '2025-12-31T23:59:59.999Z',
          originator: initialData.properties?.originator || 'OSDU',
          dataType: initialData.properties?.dataType || 'Well Data',
          securityClassification: initialData.properties?.securityClassification || 'Public',
          personalData: initialData.properties?.personalData || 'None',
          exportClassification: initialData.properties?.exportClassification || 'EAR99'
        }
      });
    }
  }, [initialData]);

  // Validation rules
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length === 0) {
          return 'Legal tag name is required';
        }
        if (value.length < 3) {
          return 'Legal tag name must be at least 3 characters';
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
          return 'Legal tag name can only contain letters, numbers, hyphens, and underscores';
        }
        return '';
      
      case 'description':
        if (!value || value.trim().length === 0) {
          return 'Description is required';
        }
        if (value.length < 10) {
          return 'Description must be at least 10 characters';
        }
        return '';
      
      case 'properties.dataType':
        if (!value) {
          return 'Data type is required';
        }
        return '';
      
      case 'properties.securityClassification':
        if (!value) {
          return 'Security classification is required';
        }
        return '';
      
      case 'properties.originator':
        if (!value || value.trim().length === 0) {
          return 'Originator is required';
        }
        return '';
      
      case 'properties.countryOfOrigin':
        if (!value || value.length === 0) {
          return 'At least one country of origin is required';
        }
        return '';
      
      case 'properties.expirationDate':
        if (value) {
          const date = new Date(value);
          const now = new Date();
          if (date <= now) {
            return 'Expiration date must be in the future';
          }
        }
        return '';
      
      default:
        return '';
    }
  };

  // Handle field changes
  const handleFieldChange = (name: string, value: any) => {
    if (name.startsWith('properties.')) {
      const propertyName = name.replace('properties.', '');
      setFormData(prev => ({
        ...prev,
        properties: {
          ...prev.properties,
          [propertyName]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // Handle field blur for validation
  const handleFieldBlur = (name: string) => {
    const value = name.startsWith('properties.') 
      ? formData.properties[name.replace('properties.', '') as keyof typeof formData.properties]
      : formData[name as keyof typeof formData];
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate all required fields
    const fieldsToValidate = [
      'name',
      'description',
      'properties.dataType',
      'properties.securityClassification',
      'properties.originator',
      'properties.countryOfOrigin',
      'properties.expirationDate'
    ];

    fieldsToValidate.forEach(fieldName => {
      const value = fieldName.startsWith('properties.') 
        ? formData.properties[fieldName.replace('properties.', '') as keyof typeof formData.properties]
        : formData[fieldName as keyof typeof formData];
      
      const error = validateField(fieldName, value);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Mark all fields as touched
    const allFields = [
      'name',
      'description',
      'properties.dataType',
      'properties.securityClassification',
      'properties.originator',
      'properties.countryOfOrigin',
      'properties.expirationDate',
      'properties.contractId',
      'properties.personalData',
      'properties.exportClassification'
    ];
    
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    if (validateForm()) {
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Legal Tag Name"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onBlur={() => handleFieldBlur('name')}
                      error={touched.name && !!errors.name}
                      helperText={touched.name && errors.name}
                      required
                      placeholder="e.g., well-data-public-us"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      onBlur={() => handleFieldBlur('description')}
                      error={touched.description && !!errors.description}
                      helperText={touched.description && errors.description}
                      required
                      multiline
                      rows={3}
                      placeholder="Describe the purpose and scope of this legal tag"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Data Classification */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Data Classification
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl 
                      fullWidth 
                      error={touched['properties.dataType'] && !!errors['properties.dataType']}
                      required
                    >
                      <InputLabel>Data Type</InputLabel>
                      <Select
                        value={formData.properties.dataType}
                        onChange={(e) => handleFieldChange('properties.dataType', e.target.value)}
                        onBlur={() => handleFieldBlur('properties.dataType')}
                        label="Data Type"
                      >
                        {DATA_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched['properties.dataType'] && errors['properties.dataType'] && (
                        <FormHelperText>{errors['properties.dataType']}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl 
                      fullWidth 
                      error={touched['properties.securityClassification'] && !!errors['properties.securityClassification']}
                      required
                    >
                      <InputLabel>Security Classification</InputLabel>
                      <Select
                        value={formData.properties.securityClassification}
                        onChange={(e) => handleFieldChange('properties.securityClassification', e.target.value)}
                        onBlur={() => handleFieldBlur('properties.securityClassification')}
                        label="Security Classification"
                      >
                        {SECURITY_CLASSIFICATIONS.map((classification) => (
                          <MenuItem key={classification} value={classification}>
                            {classification}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched['properties.securityClassification'] && errors['properties.securityClassification'] && (
                        <FormHelperText>{errors['properties.securityClassification']}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Personal Data</InputLabel>
                      <Select
                        value={formData.properties.personalData}
                        onChange={(e) => handleFieldChange('properties.personalData', e.target.value)}
                        label="Personal Data"
                      >
                        {PERSONAL_DATA_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Export Classification</InputLabel>
                      <Select
                        value={formData.properties.exportClassification}
                        onChange={(e) => handleFieldChange('properties.exportClassification', e.target.value)}
                        label="Export Classification"
                      >
                        {EXPORT_CLASSIFICATIONS.map((classification) => (
                          <MenuItem key={classification} value={classification}>
                            {classification}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Geographic and Legal Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Geographic and Legal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete
                      multiple
                      options={COUNTRIES}
                      value={formData.properties.countryOfOrigin}
                      onChange={(_, newValue) => handleFieldChange('properties.countryOfOrigin', newValue)}
                      onBlur={() => handleFieldBlur('properties.countryOfOrigin')}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={option}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Countries of Origin"
                          placeholder="Select countries"
                          error={touched['properties.countryOfOrigin'] && !!errors['properties.countryOfOrigin']}
                          helperText={touched['properties.countryOfOrigin'] && errors['properties.countryOfOrigin']}
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Originator"
                      value={formData.properties.originator}
                      onChange={(e) => handleFieldChange('properties.originator', e.target.value)}
                      onBlur={() => handleFieldBlur('properties.originator')}
                      error={touched['properties.originator'] && !!errors['properties.originator']}
                      helperText={touched['properties.originator'] && errors['properties.originator']}
                      required
                      placeholder="Organization or person who created the data"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contract ID"
                      value={formData.properties.contractId}
                      onChange={(e) => handleFieldChange('properties.contractId', e.target.value)}
                      placeholder="Associated contract identifier"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Expiration Date"
                      value={formData.properties.expirationDate ? parseISO(formData.properties.expirationDate) : null}
                      onChange={(date) => {
                        const dateString = date ? format(date, 'yyyy-MM-dd') : '';
                        handleFieldChange('properties.expirationDate', dateString);
                      }}
                      onClose={() => handleFieldBlur('properties.expirationDate')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: touched['properties.expirationDate'] && !!errors['properties.expirationDate'],
                          helperText: touched['properties.expirationDate'] && errors['properties.expirationDate'],
                          placeholder: 'Select expiration date'
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Form Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (mode === 'create' ? 'Create Legal Tag' : 'Update Legal Tag')}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Please fix the following errors:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default LegalTagForm;