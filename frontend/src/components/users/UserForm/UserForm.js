import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useApi } from '../../../hooks/useApi';
import { useApp } from '../../../contexts/AppContext';
import {
  validateRequired,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validatePhoneNumber,
} from '../../../utils/validators';
import { USER_TYPES } from '../../../utils/constants';

const UserForm = ({ user, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    first_name: '',
    last_name: '',
    user_type: 'student',
    phone_number: '',
    is_active: true,
    is_verified: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const { post, put } = useApi();
  const { showNotification } = useApp();

  useEffect(() => {
    if (user) {
      setIsEditMode(true);
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        user_type: user.user_type || 'student',
        phone_number: user.phone_number || '',
        is_active: user.is_active !== undefined ? user.is_active : true,
        is_verified: user.is_verified || false,
      });
    }
  }, [user]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleSwitchChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isEditMode) {
      newErrors.username = validateRequired(formData.username, 'Username');
    }

    newErrors.email = validateEmail(formData.email);
    newErrors.first_name = validateRequired(formData.first_name, 'First name');
    newErrors.last_name = validateRequired(formData.last_name, 'Last name');

    if (!isEditMode) {
      newErrors.password = validatePassword(formData.password);
      newErrors.password_confirmation = validateConfirmPassword(
        formData.password,
        formData.password_confirmation
      );
    }

    if (formData.phone_number) {
      newErrors.phone_number = validatePhoneNumber(formData.phone_number);
    }

    // Remove null errors
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key] === null) {
        delete newErrors[key];
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const dataToSend = { ...formData };
      
      // Don't send password fields if they're empty in edit mode
      if (isEditMode && !dataToSend.password) {
        delete dataToSend.password;
        delete dataToSend.password_confirmation;
      }

      if (isEditMode) {
        await put(`/users/${user.id}/`, dataToSend);
      } else {
        await post('/users/', dataToSend);
      }

      showNotification(
        isEditMode ? 'User updated successfully' : 'User created successfully',
        'success'
      );
      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      showNotification('Error saving user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="First Name"
            value={formData.first_name}
            onChange={handleChange('first_name')}
            error={!!errors.first_name}
            helperText={errors.first_name}
            disabled={isSubmitting}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Last Name"
            value={formData.last_name}
            onChange={handleChange('last_name')}
            error={!!errors.last_name}
            helperText={errors.last_name}
            disabled={isSubmitting}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required={!isEditMode}
            fullWidth
            label="Username"
            value={formData.username}
            onChange={handleChange('username')}
            error={!!errors.username}
            helperText={errors.username}
            disabled={isEditMode || isSubmitting}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            disabled={isSubmitting}
          />
        </Grid>

        {!isEditMode && (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                error={!!errors.password}
                helperText={errors.password}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Confirm Password"
                type="password"
                value={formData.password_confirmation}
                onChange={handleChange('password_confirmation')}
                error={!!errors.password_confirmation}
                helperText={errors.password_confirmation}
                disabled={isSubmitting}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone_number}
            onChange={handleChange('phone_number')}
            error={!!errors.phone_number}
            helperText={errors.phone_number}
            disabled={isSubmitting}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>User Type</InputLabel>
            <Select
              value={formData.user_type}
              onChange={handleChange('user_type')}
              label="User Type"
              disabled={isSubmitting}
            >
              {Object.entries(USER_TYPES).map(([key, value]) => (
                <MenuItem key={key} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={handleSwitchChange('is_active')}
                disabled={isSubmitting}
              />
            }
            label="Active Account"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_verified}
                onChange={handleSwitchChange('is_verified')}
                disabled={isSubmitting}
              />
            }
            label="Verified Account"
          />
        </Grid>
      </Grid>

      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Please fix the errors in the form.
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress size={24} />
          ) : (
            isEditMode ? 'Update User' : 'Create User'
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default UserForm;