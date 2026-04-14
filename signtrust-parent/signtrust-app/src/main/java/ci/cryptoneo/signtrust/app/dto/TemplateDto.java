package ci.cryptoneo.signtrust.app.dto;

import java.time.LocalDateTime;

public record TemplateDto(
        Long id,
        String name,
        String description,
        String documentsJson,
        String signatoryRolesJson,
        String fieldsJson,
        Integer usageCount,
        LocalDateTime createdAt
) {}
