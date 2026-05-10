import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Home from './pages/Home';
import Renewal from './pages/Renewal';
import Settings from './pages/Settings';
import Contacts from './pages/Contacts';
import Activity from './pages/Activity';
import Notifications from './pages/Notifications';

import EnvelopeList from './pages/envelopes/EnvelopeList';
import NewEnvelope from './pages/envelopes/NewEnvelope';
import EnvelopeDetail from './pages/envelopes/EnvelopeDetail';

import SignView from './pages/sign/SignView';
import SignSuccess from './pages/sign/SignSuccess';

import ChoosePlan from './pages/subscribe/ChoosePlan';
import Register from './pages/subscribe/Register';
import VerifyOtp from './pages/subscribe/VerifyOtp';
import Payment from './pages/subscribe/Payment';
import PaymentSuccess from './pages/subscribe/PaymentSuccess';

import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ToastHost from './components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/m">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/subscribe/plan" element={<ChoosePlan />} />
          <Route path="/subscribe/register" element={<Register />} />
          <Route path="/subscribe/verify" element={<VerifyOtp />} />
          <Route path="/subscribe/payment" element={<Payment />} />
          <Route path="/subscribe/success" element={<PaymentSuccess />} />
          <Route path="/renewal" element={<Renewal />} />

          {/* Sign flow (signataire externe — non protégé) :
               le signataire arrive directement sur l'aperçu du document.
               L'OTP n'apparaît que lorsqu'il valide sa signature. */}
          <Route path="/sign/:token" element={<SignView />} />
          <Route path="/sign/:token/view" element={<SignView />} />
          <Route path="/sign/success" element={<SignSuccess />} />

          {/* App protégée avec bottom-nav */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/home" element={<Home />} />
              <Route path="/envelopes" element={<EnvelopeList />} />
              <Route path="/envelopes/new" element={<NewEnvelope />} />
              <Route path="/envelopes/:id" element={<EnvelopeDetail />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastHost />
    </QueryClientProvider>
  );
}
