package ci.cryptoneo.signtrust.app.dto;

import java.time.LocalDateTime;

public record SignatoryDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        String role,
        Integer orderIndex,
        String status,
        LocalDateTime signedAt
) {}
