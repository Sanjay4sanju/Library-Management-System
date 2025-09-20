import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,Box,Toolbar,
  useMediaQuery,
} from '@mui/material';
import {
  Home as HomeIcon,
  Book as BookIcon,
  Dashboard as DashboardIcon,
  Receipt as TransactionIcon,
  BarChart as ReportIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/', roles: ['student', 'librarian', 'admin'] },
  { text: 'Books', icon: <BookIcon />, path: '/books', roles: ['student', 'librarian', 'admin'] },
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['librarian', 'admin'] },
  { text: 'Transactions', icon: <TransactionIcon />, path: '/transactions', roles: ['student', 'librarian', 'admin'] },
  { text: 'Reports', icon: <ReportIcon />, path: '/reports', roles: ['librarian', 'admin'] },
  { text: 'Profile', icon: <ProfileIcon />, path: '/profile', roles: ['student', 'librarian', 'admin'] },
];

const Sidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { sidebarOpen, setSidebarOpen } = useApp();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(currentUser?.user_type)
  );

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={sidebarOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;