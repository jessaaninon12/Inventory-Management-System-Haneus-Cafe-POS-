import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import CreateProduct from './pages/CreateProduct';
import LowStock from './pages/LowStock';
import ManageStock from './pages/ManageStock';
import Sales from './pages/Sales';
import Profile from './pages/Profile';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('haneus_logged_in') === 'true';
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/products" element={
          <PrivateRoute>
            <Layout><Products /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/create-product" element={
          <PrivateRoute>
            <Layout><CreateProduct /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/low-stock" element={
          <PrivateRoute>
            <Layout><LowStock /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/manage-stock" element={
          <PrivateRoute>
            <Layout><ManageStock /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/sales" element={
          <PrivateRoute>
            <Layout><Sales /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/profile" element={
          <PrivateRoute>
            <Layout><Profile /></Layout>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}
