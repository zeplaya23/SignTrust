package ci.cryptoneo.signtrust.app.entity;

import ci.cryptoneo.signtrust.tenant.TenantEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "templates")
public class TemplateEntity extends TenantEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "documents_json", columnDefinition = "TEXT")
    private String documentsJson;

    @Column(name = "signatory_roles_json", columnDefinition = "TEXT")
    private String signatoryRolesJson;

    @Column(name = "fields_json", columnDefinition = "TEXT")
    private String fieldsJson;

    @Column(name = "usage_count")
    private Integer usageCount = 0;

    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDocumentsJson() { return documentsJson; }
    public void setDocumentsJson(String documentsJson) { this.documentsJson = documentsJson; }

    public String getSignatoryRolesJson() { return signatoryRolesJson; }
    public void setSignatoryRolesJson(String signatoryRolesJson) { this.signatoryRolesJson = signatoryRolesJson; }

    public String getFieldsJson() { return fieldsJson; }
    public void setFieldsJson(String fieldsJson) { this.fieldsJson = fieldsJson; }

    public Integer getUsageCount() { return usageCount; }
    public void setUsageCount(Integer usageCount) { this.usageCount = usageCount; }
}
