package ci.cryptoneo.signtrust.app.dto;

public record TemplateCreateRequest(
        String name,
        String description,
        String documentsJson,
        String signatoryRolesJson,
        String fieldsJson
) {}
