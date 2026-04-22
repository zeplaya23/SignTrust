import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ChoosePlan from './pages/subscribe/ChoosePlan';
import Register from './pages/subscribe/Register';
import VerifyOtp from './pages/subscribe/VerifyOtp';
import Payment from './pages/subscribe/Payment';
import PaymentSuccess from './pages/subscribe/PaymentSuccess';
import Renewal from './pages/Renewal';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import EnvelopeList from './pages/envelopes/EnvelopeList';
import NewEnvelope from './pages/envelopes/NewEnvelope';
import EnvelopeDetail from './pages/envelopes/EnvelopeDetail';
import SignVerify from './pages/sign/SignVerify';
import SignView from './pages/sign/SignView';
import SignSuccess from './pages/sign/SignSuccess';
import Team from './pages/Team';
import Templates from './pages/Templates';
import Contacts from './pages/Contacts';
import Analytics from './pages/Analytics';
import Activity from './pages/Activity';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import ProtectedRoute from './components/auth/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/subscribe/plan" element={<ChoosePlan />} />
          <Route path="/subscribe/register" element={<Register />} />
          <Route path="/subscribe/verify" element={<VerifyOtp />} />
          <Route path="/subscribe/payment" element={<Payment />} />
          <Route path="/subscribe/success" element={<PaymentSuccess />} />
          <Route path="/renewal" element={<Renewal />} />

          {/* Sign routes (no sidebar) */}
          <Route path="/sign/:token" element={<SignVerify />} />
          <Route path="/sign/:token/view" element={<SignView />} />
          <Route path="/sign/success" element={<SignSuccess />} />

          {/* App routes with sidebar — protected */}
          <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/envelopes" element={<EnvelopeList />} />
            <Route path="/envelopes/new" element={<NewEnvelope />} />
            <Route path="/envelopes/:id" element={<EnvelopeDetail />} />
            <Route path="/team" element={<Team />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
