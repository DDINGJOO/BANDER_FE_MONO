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
import { MyScrapsPage } from './pages/MyScrapsPage';
import { PointsPage } from './pages/PointsPage';
import { CouponsPage } from './pages/CouponsPage';
import { NoticesPage } from './pages/NoticesPage';
import { NoticeDetailPage } from './pages/NoticeDetailPage';
import { SupportPage } from './pages/SupportPage';
import { InquiryNewPage } from './pages/InquiryNewPage';
import { InquiryDetailPage } from './pages/InquiryDetailPage';
import { TermsPage } from './pages/TermsPage';
import { BusinessApplyPage } from './pages/BusinessApplyPage';
import { NotificationSettingsPage } from './pages/NotificationSettingsPage';
import { PaymentInfoPage } from './pages/PaymentInfoPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ChatPage } from './pages/ChatPage';
import { CommunityPage } from './pages/CommunityPage';
import { CommunityPostDetailPage } from './pages/CommunityPostDetailPage';
import { CommunityWritePage } from './pages/CommunityWritePage';
import { MyMiniFeedPage } from './pages/MyMiniFeedPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentFailPage } from './pages/PaymentFailPage';
import { GuestGateProvider } from './components/home/GuestGateProvider';
import { ToastProvider } from './components/ui/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <GuestGateProvider>
        <Routes>
          <Route element={<MainPage />} path="/" />
          <Route element={<MainPage previewAuthenticated />} path="/home-auth" />
          <Route element={<CommunityWritePage />} path="/community/write" />
          <Route element={<CommunityWritePage />} path="/community/post/:slug/edit" />
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
          <Route element={<MyMiniFeedPage />} path="/users/:userId/minifeed" />
          <Route element={<AccountSettingsPage />} path="/account/settings" />
          <Route element={<NotificationSettingsPage />} path="/notification-settings" />
          <Route element={<PaymentInfoPage />} path="/payment-info" />
          <Route element={<NotificationsPage />} path="/notifications" />
          <Route element={<ChatPage />} path="/chat" />
          <Route element={<MyReservationsPage />} path="/my-reservations" />
          <Route element={<ReservationDetailPage />} path="/reservation-detail" />
          <Route element={<ReviewWritePage />} path="/review/write" />
          <Route element={<MyReviewsPage />} path="/my-reviews" />
          <Route element={<MyScrapsPage />} path="/my-scraps" />
          <Route element={<PointsPage />} path="/points" />
          <Route element={<CouponsPage />} path="/coupons" />
          <Route element={<NoticesPage />} path="/notices" />
          <Route element={<NoticeDetailPage />} path="/notices/:slug" />
          <Route element={<SupportPage />} path="/support" />
          <Route element={<InquiryNewPage />} path="/support/inquiry/new" />
          <Route element={<InquiryDetailPage />} path="/support/inquiry/:id" />
          <Route element={<TermsPage />} path="/terms" />
          <Route element={<BusinessApplyPage />} path="/business/apply" />
          <Route element={<OAuthCallbackPage />} path="/auth/callback" />
          <Route element={<PaymentSuccessPage />} path="/payment/success" />
          <Route element={<PaymentFailPage />} path="/payment/fail" />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </GuestGateProvider>
    </ToastProvider>
  );
}

export default App;
