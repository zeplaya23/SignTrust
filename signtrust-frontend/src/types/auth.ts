export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  tenantId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  accountType: 'particulier' | 'entreprise';
  companyName?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  planId?: string;
}

export interface OtpVerifyRequest {
  email: string;
  code: string;
}
