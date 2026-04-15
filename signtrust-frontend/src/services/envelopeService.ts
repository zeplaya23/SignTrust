import { api } from './api';
import type {
  Envelope,
  EnvelopeDetail,
  CreateEnvelopeRequest,
  Document,
  Signatory,
  SignatoryRequest,
  SignatureField,
  FieldRequest,
} from '../types/envelope';

export const envelopeService = {
  // CRUD
  async getAll(status?: string, page?: number): Promise<{ items: Envelope[]; total: number }> {
    const params: Record<string, string | number> = {};
    if (status) params.status = status;
    if (page !== undefined) params.page = page;
    const { data } = await api.get('/envelopes', { params });
    return data;
  },

  async getById(id: number): Promise<EnvelopeDetail> {
    const { data } = await api.get(`/envelopes/${id}`);
    return data;
  },

  async create(payload: CreateEnvelopeRequest): Promise<Envelope> {
    const { data } = await api.post('/envelopes', payload);
    return data;
  },

  async update(id: number, payload: Partial<CreateEnvelopeRequest>): Promise<Envelope> {
    const { data } = await api.put(`/envelopes/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/envelopes/${id}`);
  },

  async send(id: number): Promise<void> {
    await api.post(`/envelopes/${id}/send`);
  },

  async cancel(id: number): Promise<void> {
    await api.post(`/envelopes/${id}/cancel`);
  },

  // Documents
  async uploadDocument(envelopeId: number, file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/envelopes/${envelopeId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteDocument(envelopeId: number, docId: number): Promise<void> {
    await api.delete(`/envelopes/${envelopeId}/documents/${docId}`);
  },

  getDocumentUrl(envelopeId: number, docId: number): string {
    return `${api.defaults.baseURL}/envelopes/${envelopeId}/documents/${docId}/download`;
  },

  async getDocumentBlobUrl(envelopeId: number, docId: number): Promise<string> {
    const { data } = await api.get(`/envelopes/${envelopeId}/documents/${docId}`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(data);
  },

  async downloadDocument(envelopeId: number, docId: number, fileName: string): Promise<void> {
    const { data } = await api.get(`/envelopes/${envelopeId}/documents/${docId}`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async downloadAllDocumentsZip(envelopeId: number, envelopeName: string): Promise<void> {
    const { data } = await api.get(`/envelopes/${envelopeId}/documents/zip`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${envelopeName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Signatories
  async addSignatory(envelopeId: number, payload: SignatoryRequest): Promise<Signatory> {
    const { data } = await api.post(`/envelopes/${envelopeId}/signatories`, payload);
    return data;
  },

  async updateSignatory(
    envelopeId: number,
    sigId: number,
    payload: Partial<SignatoryRequest>
  ): Promise<Signatory> {
    const { data } = await api.put(`/envelopes/${envelopeId}/signatories/${sigId}`, payload);
    return data;
  },

  async removeSignatory(envelopeId: number, sigId: number): Promise<void> {
    await api.delete(`/envelopes/${envelopeId}/signatories/${sigId}`);
  },

  // Fields
  async addField(envelopeId: number, payload: FieldRequest): Promise<SignatureField> {
    const { data } = await api.post(`/envelopes/${envelopeId}/fields`, payload);
    return data;
  },

  async updateField(
    envelopeId: number,
    fieldId: number,
    payload: Partial<FieldRequest>
  ): Promise<SignatureField> {
    const { data } = await api.put(`/envelopes/${envelopeId}/fields/${fieldId}`, payload);
    return data;
  },

  async removeField(envelopeId: number, fieldId: number): Promise<void> {
    await api.delete(`/envelopes/${envelopeId}/fields/${fieldId}`);
  },

  async getFields(envelopeId: number): Promise<SignatureField[]> {
    const { data } = await api.get(`/envelopes/${envelopeId}/fields`);
    return data;
  },
};
