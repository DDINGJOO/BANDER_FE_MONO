import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './styles/index.css';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ForgotPasswordResetPage } from './pages/ForgotPasswordResetPage';
import { LoginPage } from './pages/LoginPage';
import { MainPage } from './pages/MainPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { SpaceDetailPage } from './pages/SpaceDetailPage';
import { SpaceReservationPage } from './pages/SpaceReservationPage';
import { SignupPage } from './pages/SignupPage';
import { SignupProfilePage } from './pages/SignupProfilePage';
import { SignupTermsPage } from './pages/SignupTermsPage';

function App() {
  return (
    <Routes>
      <Route element={<MainPage />} path="/" />
      <Route element={<MainPage previewAuthenticated />} path="/home-auth" />
      <Route element={<SearchResultsPage />} path="/search" />
      <Route element={<SpaceDetailPage />} path="/spaces/:slug" />
      <Route element={<SpaceReservationPage />} path="/spaces/:slug/reserve" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<ForgotPasswordPage />} path="/forgot-password" />
      <Route element={<ForgotPasswordResetPage />} path="/forgot-password/reset" />
      <Route element={<SignupPage />} path="/signup" />
      <Route element={<SignupProfilePage />} path="/signup/profile" />
      <Route element={<SignupTermsPage />} path="/signup/terms" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

export default App;
