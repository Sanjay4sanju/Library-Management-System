import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Cake as CakeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useApi } from '../../../hooks/useApi';

const UserProfile = () => {
  const { currentUser } = useAuth();
  const { get, put, loading, error } = useApi();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({});
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const data = await get('/auth/profile/');
        setUserData(data);
        setFormData(data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    if (currentUser) {
      fetchUserProfile();
    }
  }, [currentUser, get]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const updatedData = await put('/auth/profile/update/', formData);
      setUserData(updatedData);
      setIsEditing(false);
      setSaveMessage('Profile updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setSaveMessage('Error updating profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData(userData);
    setIsEditing(false);
    setSaveMessage('');
  };

  if (!userData && loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !userData) {
    return (
      <Alert severity="error">
        Error loading profile: {error.message}
      </Alert>
    );
  }

  if (!userData) {
    return (
      <Alert severity="info">
        Please log in to view your profile.
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <PersonIcon sx={{ mr: 2, verticalAlign: 'bottom' }} />
          User Profile
        </Typography>
        
        {!isEditing ? (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        ) : (
          <Box>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{ mr: 2 }}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </Box>
        )}
      </Box>

      {saveMessage && (
        <Alert severity={saveMessage.includes('Error') ? 'error' : 'success'} sx={{ mb: 3 }}>
          {saveMessage}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Left Column - Avatar and Basic Info */}
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '3rem'
              }}
            >
              {userData.first_name?.[0]?.toUpperCase() || userData.username?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            
            <Chip
              label={userData.user_type?.toUpperCase()}
              color="primary"
              variant="filled"
              sx={{ mb: 2 }}
            />
            
            <Typography variant="h6" gutterBottom>
              {userData.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim()}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              @{userData.username}
            </Typography>

            {userData.is_verified && (
              <Chip
                label="Verified"
                color="success"
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Grid>

        {/* Right Column - Profile Details */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Personal Information
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone_number"
                value={formData.phone_number || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <CakeIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                multiline
                rows={3}
                value={formData.address || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Member since: {new Date(userData.date_joined).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default UserProfile; // Make sure this is the default export