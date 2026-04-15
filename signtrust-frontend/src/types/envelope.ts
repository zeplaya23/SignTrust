export type EnvelopeStatus = 'DRAFT' | 'SENT' | 'COMPLETED' | 'CANCELLED';
export type SigningOrder = 'SEQUENTIAL' | 'PARALLEL';
export type SignatoryRole = 'SIGNER' | 'APPROVER' | 'CC';
export type SignatoryStatus = 'PENDING' | 'SIGNED' | 'REJECTED';
export type FieldType = 'SIGNATURE' | 'DATE' | 'INITIALS' | 'TEXT' | 'CHECKBOX';

export interface Envelope {
  id: number;
  name: string;
  status: EnvelopeStatus;
  documentsCount?: number;
  signatoriesCount?: number;
  documents?: Document[] | null;
  signatories?: Signatory[] | null;
  fields?: SignatureField[] | null;
  createdBy?: string;
  message?: string;
  signingOrder?: SigningOrder;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string | null;
}

export interface EnvelopeDetail extends Envelope {
  message: string;
  signingOrder: SigningOrder;
  createdBy: string;
  updatedAt: string;
  documents: Document[];
  signatories: Signatory[];
  fields: SignatureField[];
  auditTrail?: AuditEntry[];
}

export interface Document {
  id: number;
  name: string;
  contentType: string;
  pageCount: number;
  orderIndex: number;
  storageKey?: string;
}

export interface Signatory {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: SignatoryRole;
  orderIndex: number;
  status: SignatoryStatus;
  signedAt?: string;
}

export interface SignatureField {
  id: number;
  documentId: number;
  signatoryId: number;
  type: FieldType;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AuditEntry {
  id: number;
  action: string;
  userId: string;
  details: string;
  createdAt: string;
}

export interface CreateEnvelopeRequest {
  name: string;
  message?: string;
  signingOrder: SigningOrder;
  expiresAt?: string;
}

export interface SignatoryRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: SignatoryRole;
  orderIndex: number;
}

export interface FieldRequest {
  documentId: number;
  signatoryId: number;
  type: FieldType;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignEnvelopeInfo {
  envelopeName: string;
  message: string;
  signatoryName: string;
  signatoryEmail: string;
  signatoryStatus: string;
  documents: Document[];
  fields: SignatureField[];
}
