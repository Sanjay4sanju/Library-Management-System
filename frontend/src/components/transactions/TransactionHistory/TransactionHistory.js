import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useFetch } from '../../../hooks/useFetch';

const TransactionHistory = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

const { data: transactions, loading, error, refetch } = useFetch('/borrow-records-list/');


  // Ensure transactions is always an array
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const filteredTransactions = useMemo(() => {
    let filtered = safeTransactions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.book_author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => {
        if (filterType === 'active') return !transaction.is_returned;
        if (filterType === 'returned') return transaction.is_returned;
        if (filterType === 'overdue') return transaction.is_overdue;
        return true;
      });
    }

    return filtered;
  }, [safeTransactions, searchTerm, filterType]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (transaction) => {
    if (transaction.is_returned) {
      return <Chip label="Returned" color="success" size="small" />;
    } else if (transaction.is_overdue) {
      return <Chip label="Overdue" color="error" size="small" />;
    } else {
      return <Chip label="Active" color="primary" size="small" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Slice the transactions for pagination - only if it's an array
  const paginatedTransactions = Array.isArray(filteredTransactions) 
    ? filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading transactions: {error.message}
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2" gutterBottom>
          <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Transaction History
        </Typography>
        
        <IconButton onClick={refetch} color="primary">
          <VisibilityIcon />
        </IconButton>
      </Box>

      {/* Search and Filter Section */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="Search books, authors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200, flexGrow: 1 }}
        />
        
        <TextField
          select
          label="Filter by status"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          SelectProps={{ native: true }}
          sx={{ minWidth: 120 }}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
        </TextField>
      </Box>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" mb={2}>
        Showing {filteredTransactions.length} transaction(s)
      </Typography>

      {/* Transactions Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Book</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Borrower</TableCell>
              <TableCell>Borrow Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Return Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Fine</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {transaction.book_title || 'Unknown Book'}
                    </Typography>
                  </TableCell>
                  <TableCell>{transaction.book_author || 'Unknown Author'}</TableCell>
                  <TableCell>{transaction.borrower_name || 'Unknown User'}</TableCell>
                  <TableCell>{formatDate(transaction.borrow_date)}</TableCell>
                  <TableCell>{formatDate(transaction.due_date)}</TableCell>
                  <TableCell>{formatDate(transaction.return_date)}</TableCell>
                  <TableCell>{getStatusChip(transaction)}</TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={transaction.fine_amount > 0 ? 'error' : 'text.secondary'}
                      fontWeight={transaction.fine_amount > 0 ? 'medium' : 'normal'}
                    >
                      {formatCurrency(transaction.fine_amount)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {safeTransactions.length === 0 ? 'No transactions found.' : 'No transactions match your search criteria.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {filteredTransactions.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredTransactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
};

export default TransactionHistory;