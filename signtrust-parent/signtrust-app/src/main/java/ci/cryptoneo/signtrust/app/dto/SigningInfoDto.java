package ci.cryptoneo.signtrust.app.dto;

import java.util.List;

public record SigningInfoDto(
        String envelopeName,
        String message,
        String signatoryName,
        String signatoryEmail,
        String signatoryStatus,
        List<DocumentDto> documents,
        List<SignatureFieldDto> fields
) {}
