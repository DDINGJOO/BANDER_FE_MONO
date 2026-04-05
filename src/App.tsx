import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './styles/index.css';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ForgotPasswordResetPage } from './pages/ForgotPasswordResetPage';
import { LoginPage } from './pages/LoginPage';
import { MainPage } from './pages/MainPage';
import { ExploreMapPage } from './pages/ExploreMapPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { SpaceDetailPage } from './pages/SpaceDetailPage';
import { SpaceReservationPage } from './pages/SpaceReservationPage';
import { VendorDetailPage } from './pages/VendorDetailPage';
import { SignupPage } from './pages/SignupPage';
import { SignupProfilePage } from './pages/SignupProfilePage';
import { SignupTermsPage } from './pages/SignupTermsPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { ProfileEditPage } from './pages/ProfileEditPage';
import { MyReservationsPage } from './pages/MyReservationsPage';
import { ReservationDetailPage } from './pages/ReservationDetailPage';
import { ReviewWritePage } from './pages/ReviewWritePage';
import { MyReviewsPage } from './pages/MyReviewsPage';
import { NotificationSettingsPage } from './pages/NotificationSettingsPage';
import { PaymentInfoPage } from './pages/PaymentInfoPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ChatPage } from './pages/ChatPage';
import { CommunityPage } from './pages/CommunityPage';
import { CommunityPostDetailPage } from './pages/CommunityPostDetailPage';
import { CommunityWritePage } from './pages/CommunityWritePage';
import { MyMiniFeedPage } from './pages/MyMiniFeedPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';

function App() {
  return (
    <Routes>
      <Route element={<MainPage />} path="/" />
      <Route element={<MainPage previewAuthenticated />} path="/home-auth" />
      <Route element={<CommunityWritePage />} path="/community/write" />
      <Route element={<CommunityPostDetailPage />} path="/community/post/:slug" />
      <Route element={<CommunityPage />} path="/community" />
      <Route element={<SearchResultsPage />} path="/search" />
      <Route element={<ExploreMapPage />} path="/search/map" />
      <Route element={<VendorDetailPage />} path="/vendors/:slug" />
      <Route element={<SpaceDetailPage />} path="/spaces/:slug" />
      <Route element={<SpaceReservationPage />} path="/spaces/:slug/reserve" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<ForgotPasswordPage />} path="/forgot-password" />
      <Route element={<ForgotPasswordResetPage />} path="/forgot-password/reset" />
      <Route element={<SignupPage />} path="/signup" />
      <Route element={<SignupProfilePage />} path="/signup/profile" />
      <Route element={<SignupTermsPage />} path="/signup/terms" />
      <Route element={<ProfileEditPage />} path="/profile/edit" />
      <Route element={<MyMiniFeedPage />} path="/my-minifeed" />
      <Route element={<AccountSettingsPage />} path="/account/settings" />
      <Route element={<NotificationSettingsPage />} path="/notification-settings" />
      <Route element={<PaymentInfoPage />} path="/payment-info" />
      <Route element={<NotificationsPage />} path="/notifications" />
      <Route element={<ChatPage />} path="/chat" />
      <Route element={<MyReservationsPage />} path="/my-reservations" />
      <Route element={<ReservationDetailPage />} path="/reservation-detail" />
      <Route element={<ReviewWritePage />} path="/review/write" />
      <Route element={<MyReviewsPage />} path="/my-reviews" />
      <Route element={<OAuthCallbackPage />} path="/auth/callback" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

export default App;
