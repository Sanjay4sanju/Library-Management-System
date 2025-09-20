import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Book as BookIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon2,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { useApi } from '../../hooks/useApi';
import { useApp } from '../../contexts/AppContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
 

const Reports = () => {
  const [fines, setFines] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [reportType, setReportType] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const { get } = useApi();
  const { showNotification } = useApp();

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [finesData, borrowData, usersData, booksData, reservationsData, categoriesData] = await Promise.allSettled([
        get('/fines/'),
        get('/borrow-records/'),
        get('/users/'),
        get('/books/'),
        get('/reservations/'),
        get('/categories/')
      ]);

      // Process fines data
      const finesList = finesData.status === 'fulfilled' ? 
        (Array.isArray(finesData.value) ? finesData.value : finesData.value.results || []) : [];
      setFines(finesList);

      // Process borrow records
      const borrowList = borrowData.status === 'fulfilled' ? 
        (Array.isArray(borrowData.value) ? borrowData.value : borrowData.value.results || []) : [];
      setBorrowRecords(borrowList);

      // Process users
      const usersList = usersData.status === 'fulfilled' ? 
        (Array.isArray(usersData.value) ? usersData.value : usersData.value.results || []) : [];
      setUsers(usersList);

      // Process books
      const booksList = booksData.status === 'fulfilled' ? 
        (Array.isArray(booksData.value) ? booksData.value : booksData.value.results || []) : [];
      setBooks(booksList);

      // Process reservations
      const reservationsList = reservationsData.status === 'fulfilled' ? 
        (Array.isArray(reservationsData.value) ? reservationsData.value : reservationsData.value.results || []) : [];
      setReservations(reservationsList);

      // Process categories
      const categoriesList = categoriesData.status === 'fulfilled' ? 
        (Array.isArray(categoriesData.value) ? categoriesData.value : categoriesData.value.results || []) : [];
      setCategories(categoriesList);

    } catch (error) {
      setError('Failed to load report data');
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Calculate fine statistics
  const unpaidFines = fines.filter(fine => !fine.is_paid);
  const paidFines = fines.filter(fine => fine.is_paid);
  
  const totalUnpaid = unpaidFines.reduce((sum, fine) => {
    const amount = parseFloat(fine.amount) || 0;
    return sum + amount;
  }, 0);
  
  const totalCollected = paidFines.reduce((sum, fine) => {
    const amount = parseFloat(fine.amount) || 0;
    return sum + amount;
  }, 0);

  // Calculate borrowing trends
  const getBorrowingTrends = () => {
    const monthlyData = {};
    
    borrowRecords.forEach(record => {
      const monthYear = formatDate(record.borrow_date, 'MMM YYYY');
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      monthlyData[monthYear]++;
    });
    
    return Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
  };

  // Calculate book utilization
  const getBookUtilization = () => {
    const utilization = [];
    
    books.forEach(book => {
      const borrowCount = borrowRecords.filter(record => record.book === book.id).length;
      const utilizationRate = (borrowCount / (book.total_copies || 1)) * 100;
      
      utilization.push({
        id: book.id,
        title: book.title,
        author: book.author,
        borrowCount,
        utilizationRate: Math.round(utilizationRate)
      });
    });
    
    return utilization.sort((a, b) => b.borrowCount - a.borrowCount);
  };

  // Calculate user activity
  const getUserActivity = () => {
    const activity = [];
    
    users.forEach(user => {
      const borrowCount = borrowRecords.filter(record => record.borrower === user.id).length;
      const reservationCount = reservations.filter(res => res.user === user.id).length;
      const fineAmount = fines.filter(fine => fine.user === user.id)
        .reduce((sum, fine) => sum + (parseFloat(fine.amount) || 0), 0);
      
      activity.push({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        userType: user.user_type,
        borrowCount,
        reservationCount,
        fineAmount
      });
    });
    
    return activity.sort((a, b) => b.borrowCount - a.borrowCount);
  };

  // Helper function to get user name by ID
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
  };

  // Helper function to get book title by ID
  const getBookTitle = (bookId) => {
    const book = books.find(b => b.id === bookId);
    return book ? book.title : 'Unknown Book';
  };

  // Helper function to get borrow record by ID
  const getBorrowRecord = (recordId) => {
    return borrowRecords.find(r => r.id === recordId);
  };

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Library Management System Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${date}`, 14, 30);
    
    // Add content based on active tab
    if (tabValue === 0) {
      // Fines report
      doc.text('Fines Summary', 14, 40);
      
      // Add table
      doc.autoTable({
        startY: 45,
        head: [['User', 'Book', 'Amount', 'Status', 'Date']],
        body: fines.map(fine => [
          getUserName(fine.user),
          fine.borrow_record ? getBookTitle(getBorrowRecord(fine.borrow_record)?.book) : 'No associated book',
          formatCurrency(fine.amount),
          fine.is_paid ? 'Paid' : 'Unpaid',
          formatDate(fine.created_at)
        ])
      });
    } else if (tabValue === 1) {
      // Borrowing trends
      doc.text('Borrowing Trends', 14, 40);
      
      const trends = getBorrowingTrends();
      doc.autoTable({
        startY: 45,
        head: [['Month', 'Borrow Count']],
        body: trends.map(trend => [trend.month, trend.count.toString()])
      });
    } else if (tabValue === 2) {
      // Book utilization
      doc.text('Book Utilization', 14, 40);
      
      const utilization = getBookUtilization();
      doc.autoTable({
        startY: 45,
        head: [['Book', 'Author', 'Borrow Count', 'Utilization Rate']],
        body: utilization.map(book => [
          book.title,
          book.author,
          book.borrowCount.toString(),
          `${book.utilizationRate}%`
        ])
      });
    } else if (tabValue === 3) {
      // User activity
      doc.text('User Activity', 14, 40);
      
      const activity = getUserActivity();
      doc.autoTable({
        startY: 45,
        head: [['User', 'Email', 'Borrow Count', 'Reservation Count', 'Total Fines']],
        body: activity.map(user => [
          user.name,
          user.email,
          user.borrowCount.toString(),
          user.reservationCount.toString(),
          formatCurrency(user.fineAmount)
        ])
      });
    }
    
    doc.save(`library-report-${date}.pdf`);
    showNotification('Report exported successfully as PDF', 'success');
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const date = new Date().toLocaleDateString();
    
    // Add header
    csvContent += `Library Management System Report - Generated on: ${date}\r\n\r\n`;
    
    // Add content based on active tab
    if (tabValue === 0) {
      // Fines report
      csvContent += "User,Book,Amount,Status,Date\r\n";
      fines.forEach(fine => {
        csvContent += `"${getUserName(fine.user)}","${fine.borrow_record ? getBookTitle(getBorrowRecord(fine.borrow_record)?.book) : 'No associated book'}","${formatCurrency(fine.amount)}","${fine.is_paid ? 'Paid' : 'Unpaid'}","${formatDate(fine.created_at)}"\r\n`;
      });
    } else if (tabValue === 1) {
      // Borrowing trends
      csvContent += "Month,Borrow Count\r\n";
      const trends = getBorrowingTrends();
      trends.forEach(trend => {
        csvContent += `"${trend.month}","${trend.count}"\r\n`;
      });
    } else if (tabValue === 2) {
      // Book utilization
      csvContent += "Book,Author,Borrow Count,Utilization Rate\r\n";
      const utilization = getBookUtilization();
      utilization.forEach(book => {
        csvContent += `"${book.title}","${book.author}","${book.borrowCount}","${book.utilizationRate}%"\r\n`;
      });
    } else if (tabValue === 3) {
      // User activity
      csvContent += "User,Email,Borrow Count,Reservation Count,Total Fines\r\n";
      const activity = getUserActivity();
      activity.forEach(user => {
        csvContent += `"${user.name}","${user.email}","${user.borrowCount}","${user.reservationCount}","${formatCurrency(user.fineAmount)}"\r\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `library-report-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Report exported successfully as CSV', 'success');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reports & Analytics
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleMenuOpen}
          >
            Export Report
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
           
            <MenuItem onClick={() => { exportToCSV(); handleMenuClose(); }}>Export as CSV</MenuItem>
          </Menu>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filter Options */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter Options
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="all">All Data</MenuItem>
                <MenuItem value="lastWeek">Last Week</MenuItem>
                <MenuItem value="lastMonth">Last Month</MenuItem>
                <MenuItem value="lastQuarter">Last Quarter</MenuItem>
                <MenuItem value="lastYear">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Start Date"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="End Date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="contained" fullWidth sx={{ height: '56px' }}>
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Fines Summary" />
          <Tab label="Borrowing Trends" />
          <Tab label="Book Utilization" />
          <Tab label="User Activity" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <>
          {/* Fine Summary */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Total Unpaid Fines
                      </Typography>
                      <Typography variant="h4" component="div">
                        {formatCurrency(totalUnpaid)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {unpaidFines.length} unpaid fines
                      </Typography>
                    </Box>
                    <WarningIcon color="error" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Total Collected Fines
                      </Typography>
                      <Typography variant="h4" component="div">
                        {formatCurrency(totalCollected)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {paidFines.length} paid fines
                      </Typography>
                    </Box>
                    <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Total Fines Amount
                      </Typography>
                      <Typography variant="h4" component="div">
                        {formatCurrency(totalUnpaid + totalCollected)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {fines.length} total fines
                      </Typography>
                    </Box>
                    <AttachMoneyIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Average Fine Amount
                      </Typography>
                      <Typography variant="h4" component="div">
                        {formatCurrency(fines.length > 0 ? (totalUnpaid + totalCollected) / fines.length : 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Per fine
                      </Typography>
                    </Box>
                    <BarChartIcon color="info" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Unpaid Fines */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Unpaid Fines
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Book</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unpaidFines.length > 0 ? (
                    unpaidFines.map((fine) => {
                      const borrowRecord = fine.borrow_record ? getBorrowRecord(fine.borrow_record) : null;
                      const dueDate = borrowRecord ? borrowRecord.due_date : null;
                      
                      return (
                        <TableRow key={fine.id}>
                          <TableCell>{getUserName(fine.user)}</TableCell>
                          <TableCell>
                            {borrowRecord ? getBookTitle(borrowRecord.book) : 'No associated book'}
                          </TableCell>
                          <TableCell>{formatCurrency(fine.amount)}</TableCell>
                          <TableCell>{dueDate ? formatDate(dueDate) : 'No due date'}</TableCell>
                          <TableCell>
                            <Chip
                              label="Unpaid"
                              color="error"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No unpaid fines found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Paid Fines */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Paid Fines
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Book</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Paid Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paidFines.length > 0 ? (
                    paidFines.map((fine) => {
                      const borrowRecord = fine.borrow_record ? getBorrowRecord(fine.borrow_record) : null;
                      
                      return (
                        <TableRow key={fine.id}>
                          <TableCell>{getUserName(fine.user)}</TableCell>
                          <TableCell>
                            {borrowRecord ? getBookTitle(borrowRecord.book) : 'No associated book'}
                          </TableCell>
                          <TableCell>{formatCurrency(fine.amount)}</TableCell>
                          <TableCell>{fine.paid_date ? formatDate(fine.paid_date) : 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label="Paid"
                              color="success"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No paid fines found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Borrowing Trends
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell>Borrow Count</TableCell>
                  <TableCell>Trend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getBorrowingTrends().length > 0 ? (
                  getBorrowingTrends().map((trend, index, array) => {
                    const prevCount = index > 0 ? array[index - 1].count : 0;
                    const trendDirection = trend.count > prevCount ? 'up' : trend.count < prevCount ? 'down' : 'stable';
                    
                    return (
                      <TableRow key={trend.month}>
                        <TableCell>{trend.month}</TableCell>
                        <TableCell>{trend.count}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {trendDirection === 'up' && <TrendingUpIcon2 color="success" />}
                            {trendDirection === 'down' && <TrendingUpIcon2 sx={{ transform: 'rotate(180deg)', color: 'error.main' }} />}
                            {trendDirection === 'stable' && <BarChartIcon color="disabled" />}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {trendDirection === 'up' ? 'Increasing' : trendDirection === 'down' ? 'Decreasing' : 'Stable'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No borrowing data found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Book Utilization
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Book</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Borrow Count</TableCell>
                  <TableCell>Utilization Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getBookUtilization().length > 0 ? (
                  getBookUtilization().map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.borrowCount}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Box width="100%" mr={1}>
                            <LinearProgress 
                              variant="determinate" 
                              value={book.utilizationRate > 100 ? 100 : book.utilizationRate} 
                              color={book.utilizationRate > 80 ? 'success' : book.utilizationRate > 50 ? 'warning' : 'error'}
                            />
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {book.utilizationRate}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No book utilization data found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Activity
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Borrow Count</TableCell>
                  <TableCell>Reservation Count</TableCell>
                  <TableCell>Total Fines</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getUserActivity().length > 0 ? (
                  getUserActivity().map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.borrowCount}</TableCell>
                      <TableCell>{user.reservationCount}</TableCell>
                      <TableCell>{formatCurrency(user.fineAmount)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No user activity data found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

     
    </Box>
  );
};

export default Reports;