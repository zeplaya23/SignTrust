package ci.cryptoneo.signtrust.app.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "signature_fields")
public class SignatureFieldEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private DocumentEntity document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signatory_id")
    private SignatoryEntity signatory;

    @Column(nullable = false)
    private String type; // SIGNATURE, DATE, INITIALS, TEXT, CHECKBOX

    @Column(name = "page_number")
    private Integer pageNumber;

    private Double x;
    private Double y;
    private Double width;
    private Double height;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DocumentEntity getDocument() { return document; }
    public void setDocument(DocumentEntity document) { this.document = document; }

    public SignatoryEntity getSignatory() { return signatory; }
    public void setSignatory(SignatoryEntity signatory) { this.signatory = signatory; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getPageNumber() { return pageNumber; }
    public void setPageNumber(Integer pageNumber) { this.pageNumber = pageNumber; }

    public Double getX() { return x; }
    public void setX(Double x) { this.x = x; }

    public Double getY() { return y; }
    public void setY(Double y) { this.y = y; }

    public Double getWidth() { return width; }
    public void setWidth(Double width) { this.width = width; }

    public Double getHeight() { return height; }
    public void setHeight(Double height) { this.height = height; }
}
