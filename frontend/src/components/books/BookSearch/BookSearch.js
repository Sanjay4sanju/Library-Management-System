import InventoryIcon from '@mui/icons-material/Inventory';
import FilterList from '@mui/icons-material/FilterList';
import WarningIcon from '@mui/icons-material/Warning';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';


import React, { useState } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { BOOK_GENRES } from '../../../utils/constants';

const BookSearch = ({ onSearch, onFilter, initialFilters = {} }) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [filters, setFilters] = useState({
    genre: initialFilters.genre || '',
    availability: initialFilters.availability || 'all',
    yearRange: initialFilters.yearRange || [1000, new Date().getFullYear()],
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleYearRangeChange = (event, newValue) => {
    const newFilters = { ...filters, yearRange: newValue };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      genre: '',
      availability: 'all',
      yearRange: [1000, new Date().getFullYear()],
    };
    setFilters(defaultFilters);
    setSearchTerm('');
    onSearch('');
    onFilter(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      searchTerm ||
      filters.genre ||
      filters.availability !== 'all' ||
      filters.yearRange[0] !== 1000 ||
      filters.yearRange[1] !== new Date().getFullYear()
    );
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search books by title, author, or ISBN..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    setSearchTerm('');
                    onSearch('');
                  }}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        <IconButton
          onClick={() => setShowFilters(!showFilters)}
          color={showFilters ? 'primary' : 'default'}
        >
          <FilterList />
        </IconButton>
        
        {hasActiveFilters() && (
          <Button onClick={clearFilters} startIcon={<ClearIcon />}>
            Clear All
          </Button>
        )}
      </Box>

      {showFilters && (
        <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Genre</InputLabel>
              <Select
                value={filters.genre}
                onChange={handleFilterChange('genre')}
                label="Genre"
              >
                <MenuItem value="">All Genres</MenuItem>
                {Object.entries(BOOK_GENRES).map(([key, value]) => (
                  <MenuItem key={key} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Availability</InputLabel>
              <Select
                value={filters.availability}
                onChange={handleFilterChange('availability')}
                label="Availability"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="unavailable">Unavailable</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ minWidth: 200 }}>
              <Typography gutterBottom>Publication Year</Typography>
              <Slider
                value={filters.yearRange}
                onChange={handleYearRangeChange}
                valueLabelDisplay="auto"
                min={1000}
                max={new Date().getFullYear()}
                marks={[
                  { value: 1000, label: '1000' },
                  { value: new Date().getFullYear(), label: 'Current' },
                ]}
              />
            </Box>
          </Box>
        </Box>
      )}

      {hasActiveFilters() && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Active Filters:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {searchTerm && (
              <Chip
                label={`Search: ${searchTerm}`}
                onDelete={() => {
                  setSearchTerm('');
                  onSearch('');
                }}
              />
            )}
            {filters.genre && (
              <Chip
                label={`Genre: ${filters.genre}`}
                onDelete={() => handleFilterChange('genre')({ target: { value: '' } })}
              />
            )}
            {filters.availability !== 'all' && (
              <Chip
                label={`Availability: ${filters.availability}`}
                onDelete={() => handleFilterChange('availability')({ target: { value: 'all' } })}
              />
            )}
            {(filters.yearRange[0] !== 1000 || filters.yearRange[1] !== new Date().getFullYear()) && (
              <Chip
                label={`Year: ${filters.yearRange[0]} - ${filters.yearRange[1]}`}
                onDelete={() => handleYearRangeChange(null, [1000, new Date().getFullYear()])}
              />
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default BookSearch;