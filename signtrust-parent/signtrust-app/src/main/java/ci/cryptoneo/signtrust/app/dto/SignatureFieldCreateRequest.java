package ci.cryptoneo.signtrust.app.dto;

public record SignatureFieldCreateRequest(
        Long documentId,
        Long signatoryId,
        String type,
        Integer pageNumber,
        Double x,
        Double y,
        Double width,
        Double height
) {}
