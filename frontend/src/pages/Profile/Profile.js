import React from 'react';
import { Container } from '@mui/material';
import UserProfile from '../../components/users/UserProfile'; // This should work with the index.js file

const Profile = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <UserProfile />
    </Container>
  );
};

export default Profile;