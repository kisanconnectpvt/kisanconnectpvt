import React from 'react';
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import {AuthProvider,useAuth} from './context/AuthContext';
import Login           from './pages/auth/Login';
import Register        from './pages/auth/Register';
import Products        from './pages/products/Products';
import Checkout        from './pages/Checkout';
import PaymentPage     from './pages/PaymentPage';
import PaymentSuccess  from './pages/PaymentSuccess';
import ProductForm     from './pages/products/ProductForm';
import FarmerDashboard from './pages/dashboard/FarmerDashboard';
import BuyerDashboard  from './pages/dashboard/BuyerDashboard';
import Home            from './pages/Home';

function PrivateRoute({children,roles}) {
  const {user}=useAuth();
  if(!user) return <Navigate to="/login" replace/>;
  if(roles&&!roles.includes(user.role)) return <Navigate to="/products" replace/>;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<Home/>}/>
          <Route path="/login"    element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/products" element={<Products/>}/>
          <Route path="/checkout" element={<PrivateRoute roles={['BUYER']}><Checkout/></PrivateRoute>}/>
          <Route path="/payment" element={<PrivateRoute roles={['BUYER']}><PaymentPage/></PrivateRoute>}/>
          <Route path="/payment/success" element={<PrivateRoute roles={['BUYER']}><PaymentSuccess/></PrivateRoute>}/>
          <Route path="/dashboard/farmer" element={<PrivateRoute roles={['FARMER']}><FarmerDashboard/></PrivateRoute>}/>
          <Route path="/products/new"     element={<PrivateRoute roles={['FARMER']}><ProductForm/></PrivateRoute>}/>
          <Route path="/products/edit/:id" element={<PrivateRoute roles={['FARMER']}><ProductForm/></PrivateRoute>}/>
          <Route path="/dashboard/buyer"  element={<PrivateRoute roles={['BUYER']}><BuyerDashboard/></PrivateRoute>}/>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
