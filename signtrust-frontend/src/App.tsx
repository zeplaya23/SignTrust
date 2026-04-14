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
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/subscribe/plan" element={<ChoosePlan />} />
          <Route path="/subscribe/register" element={<Register />} />
          <Route path="/subscribe/verify" element={<VerifyOtp />} />
          <Route path="/subscribe/payment" element={<Payment />} />
          <Route path="/subscribe/success" element={<PaymentSuccess />} />
          <Route path="/renewal" element={<Renewal />} />
          <Route
            path="/dashboard"
            element={
              <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-dark mb-2">Dashboard</h1>
                  <p className="text-txt-secondary">Phase 3</p>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
