package ci.cryptoneo.signtrust.envelope;

public interface EnvelopeService {
    Long create(String tenantId, String name, String createdBy);
    void addDocument(Long envelopeId, String fileName, byte[] content);
    void addSignatory(Long envelopeId, String email, String name, String role);
    void send(Long envelopeId);
    void cancel(Long envelopeId);
}
