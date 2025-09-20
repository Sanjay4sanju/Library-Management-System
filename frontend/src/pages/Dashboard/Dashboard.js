import React from 'react';
import { Container } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from '../../components/dashboard/AdminDashboard';
import LibrarianDashboard from '../../components/dashboard/LibrarianDashboard';
import StudentDashboard from '../../components/dashboard/StudentDashboard';

const Dashboard = () => {
  const { isAdmin, isLibrarian, isStudent } = useAuth();

  return (
    <Container maxWidth="xl">
      {isAdmin && <AdminDashboard />}
      {isLibrarian && !isAdmin && <LibrarianDashboard />}
      {isStudent && <StudentDashboard />}
    </Container>
  );
};

export default Dashboard;