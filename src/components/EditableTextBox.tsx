import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

const getValueByPath = <T,>(obj: T, path: string | string[]): unknown => {
    if (typeof path === 'string') {
        path = path.split('.');
    }
    return (path as string[]).reduce((acc, key) => (acc && (acc as Record<string, unknown>)[key] !== undefined) ? (acc as Record<string, unknown>)[key] : undefined, obj as unknown);
};

interface EditableTextBoxProps<T> {
    object: T;
    fieldPath: string | string[];
    onUpdate: (updatedObject: T) => void;
    typographyVariant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'button' | 'overline' | 'inherit';
    typographyColor?: string; //'initial' | 'inherit' | 'primary' | 'secondary' | 'textPrimary' | 'textSecondary' | 'error';
    stripTimestamp?: boolean; // Strip timestamp from display
}

const EditableTextBox = <T,>({ object, fieldPath, onUpdate, typographyVariant = 'body1', typographyColor, stripTimestamp = false }: EditableTextBoxProps<T>) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [value, setValue] = useState<string>(String(getValueByPath(object, fieldPath)));

    useEffect(() => {
        setValue(String(getValueByPath(object, fieldPath)));
    }, [object, fieldPath]);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSaveClick = () => {
        const updatedObject = { ...object } as Record<string, unknown>;
        const keys = Array.isArray(fieldPath) ? fieldPath : fieldPath.split('.');
        let temp: Record<string, unknown> = updatedObject; 
        keys.slice(0, -1).forEach(key => {
            if (!temp[key]) temp[key] = {};
            temp = temp[key] as Record<string, unknown>;
        });
        temp[keys[keys.length - 1]] = value;

        Object.keys(updatedObject).forEach(key => {
            if (typeof updatedObject[key] === 'function') {
                delete updatedObject[key];
            }
            if (['owner', 'createdAt', 'id', 'updatedAt'].includes(key)) {
                delete updatedObject[key];
            }
        });

        onUpdate(updatedObject as T);
        setIsEditing(false);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSaveClick();
        }
    };

    // Strip timestamp from display (e.g., "Canvas Name - 12/8/2025, 2:30:24 PM" -> "Canvas Name")
    const getDisplayValue = () => {
        const rawValue = String(getValueByPath(object, fieldPath));
        if (stripTimestamp) {
            return rawValue.replace(/\s*-\s*\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}:\d{2}\s*[AP]M\s*$/, '');
        }
        return rawValue;
    };

    return (
        <Box 
            display="flex" 
            alignItems="center" 
            gap="8px"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isEditing ? (
                <TextField 
                    value={value} 
                    onChange={handleChange} 
                    onKeyDown={handleKeyDown}
                    autoFocus 
                    onBlur={handleSaveClick}
                    size="small"
                />
            ) : (
                <>
                    <Typography variant={typographyVariant} color={typographyColor} onDoubleClick={handleEditClick}>
                        {getDisplayValue()}
                    </Typography>
                    {isHovered && (
                        <IconButton 
                            size="small" 
                            onClick={handleEditClick}
                            sx={{ padding: '4px', opacity: 0.7 }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    )}
                </>
            )}
        </Box>
    );
};

export default EditableTextBox;