export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxx',
  USE_MOCKS: import.meta.env.VITE_USE_MOCKS === 'true',
};
