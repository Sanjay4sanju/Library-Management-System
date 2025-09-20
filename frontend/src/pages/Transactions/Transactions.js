import React from 'react';
import { Container } from '@mui/material';
import TransactionHistory from '../../components/transactions/TransactionHistory';

const Transactions = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <TransactionHistory />
    </Container>
  );
};

export default Transactions;