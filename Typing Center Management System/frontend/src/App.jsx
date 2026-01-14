import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './Layout';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import Clients from './Pages/Clients';
import Quotations from './Pages/Quotations';
import QuotationView from "./Components/quotations/QuotationView";
import Invoices from './Pages/Invoices';
import Payments from './Pages/Payments';
import Applications from './Pages/Applications';
import Reports from './Pages/Reports';
import Users from './Pages/Users';
import UsefulLinksPage from './Pages/UsefulLinks';
import UserNotRegisteredError from './Components/UserNotRegisteredError';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="/quotations/:id/view" element={<QuotationView />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="payments" element={<Payments />} />
            <Route path="applications" element={<Applications />} />
            <Route path="useful-links" element={<UsefulLinksPage />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
            <Route path="not-authorized" element={<UserNotRegisteredError />} />            
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;