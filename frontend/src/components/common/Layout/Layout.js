import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Sidebar from '../Sidebar';
import Footer from '../Footer';
import Notification from '../Notification';
import { useApp } from '../../../contexts/AppContext';

const Layout = () => {
  const { sidebarOpen } = useApp();

  return (
    <Box sx={{ display: 'flex' }}>
      <Header />
      <Sidebar />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${sidebarOpen ? 240 : 0}px)` },
          ml: { md: sidebarOpen ? '240px' : 0 },
          transition: theme => theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Outlet />
        <Footer />
      </Box>
      
      <Notification />
    </Box>
  );
};

export default Layout;