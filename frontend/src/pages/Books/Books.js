import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import BookList from '../../components/books/BookList';


const Books = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
      
      </Tabs>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <BookList 
            searchTerm={searchTerm}
            filters={filters}
            activeTab={activeTab}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Books;