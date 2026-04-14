package ci.cryptoneo.signtrust.app.entity;

import ci.cryptoneo.signtrust.tenant.TenantEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "contacts")
public class ContactEntity extends TenantEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    private String phone;

    @Column(name = "envelope_count")
    private Integer envelopeCount = 0;

    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Integer getEnvelopeCount() { return envelopeCount; }
    public void setEnvelopeCount(Integer envelopeCount) { this.envelopeCount = envelopeCount; }
}
