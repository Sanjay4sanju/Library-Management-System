import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button
} from '@mui/material';
import {
  LibraryBooks as LibraryIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useApi } from '../../hooks/useApi';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeUsers: 0,
    uptime: 99.9
  });
  const [loading, setLoading] = useState(true);
  const { get } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [booksData, usersData] = await Promise.all([
        get('/books/').catch(() => []),
        get('/users/').catch(() => [])
      ]);

      const totalBooks = Array.isArray(booksData) ? booksData.length : (booksData.results || []).length;
      const activeUsers = Array.isArray(usersData) ? usersData.length : (usersData.results || []).length;

      setStats({
        totalBooks,
        activeUsers,
        uptime: 99.9
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseBooks = () => {
    navigate('/books');
  };

  return (
    <Box>
      {/* Blue Header Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8, textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom>
            Library Management System
          </Typography>
          <Typography variant="h5" sx={{ mb: 4 }}>
            Efficiently manage your library resources with our comprehensive system
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            sx={{ 
              backgroundColor: 'white', 
              color: 'primary.main',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
            onClick={handleBrowseBooks}
          >
            Browse Books
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Stats Section */}
        <Grid container spacing={4} sx={{ my: 8 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <LibraryIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h3" gutterBottom>
                  {stats.totalBooks}+
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  Books Available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <PeopleIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h3" gutterBottom>
                  {stats.activeUsers}+
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  Active Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <ScheduleIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h3" gutterBottom>
                  {stats.uptime}%
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  Uptime
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Features Section */}
        <Box sx={{ py: 8, bgcolor: 'background.default' }}>
          <Typography variant="h3" align="center" gutterBottom>
            Why Choose Our System?
          </Typography>
          <Typography variant="h6" align="center" color="textSecondary" paragraph sx={{ maxWidth: 800, mx: 'auto', mb: 6 }}>
            Our Library Management System is designed to provide an efficient, user-friendly experience for both librarians and patrons. With advanced features and intuitive design, we make library management effortless.
          </Typography>
          
         <Grid container spacing={4}>
  <Grid item xs={12} md={4}>
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        Easy Book Management
      </Typography>
      <Typography>
        Add, edit, and manage your book catalog with our intuitive interface.
      </Typography>
    </Paper>
  </Grid>
  
  <Grid item xs={12} md={4}>
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        User Management
      </Typography>
      <Typography>
        Manage library members, track borrowing history, and monitor fines.
      </Typography>
    </Paper>
  </Grid>
  
  <Grid item xs={12} md={4}>
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        Advanced Reporting
      </Typography>
      <Typography>
        Generate detailed reports on library usage, popular books, and more.
      </Typography>
    </Paper>
  </Grid>
</Grid>

        </Box>

        {/* Contact Section */}
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom>
            Have Questions?
          </Typography>
          <Typography variant="h6" color="textSecondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
            Our support team is here to help you get the most out of our system.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<PhoneIcon />}
            href="tel:+91 88975 56156"
          >
            Call Support: +91 88975 56156
          </Button>
        </Box>

  
      </Container>
    </Box>
  );
};

export default Home;