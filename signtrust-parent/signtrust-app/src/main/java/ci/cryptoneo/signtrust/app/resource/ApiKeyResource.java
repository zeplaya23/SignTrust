package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.ApiKeyEntity;
import ci.cryptoneo.signtrust.iam.SignTrustIdentity;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Authenticated
@Path("/api/apikeys")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "API Keys", description = "Gestion des cles API pour les integrateurs. Chaque cle est liee au tenant de l'utilisateur.")
public class ApiKeyResource {

    @Inject
    SignTrustIdentity identity;

    @Inject
    EntityManager em;

    @GET
    @Operation(summary = "Lister les cles API", description = "Retourne toutes les cles API du tenant courant, triees par date de creation decroissante.")
    @APIResponse(responseCode = "200", description = "Liste des cles API")
    public Response list() {
        String tenantId = identity.getTenantId();
        List<ApiKeyEntity> keys = em.createQuery(
                "SELECT k FROM ApiKeyEntity k WHERE k.tenantId = :tid ORDER BY k.createdAt DESC",
                ApiKeyEntity.class)
                .setParameter("tid", tenantId)
                .getResultList();

        List<ApiKeyDto> dtos = keys.stream().map(k -> new ApiKeyDto(
                k.getId(), k.getKeyPrefix(), k.getLabel(),
                k.getUsageCount(), k.isActive(), k.isEnabled(),
                k.getCreatedAt(), k.getRevokedAt()
        )).toList();

        return Response.ok(dtos).build();
    }

    @POST
    @Transactional
    @Operation(summary = "Creer une cle API", description = "Genere une nouvelle cle API. La cle complete est retournee UNE SEULE FOIS dans la reponse. Conservez-la precieusement.")
    @APIResponse(responseCode = "201", description = "Cle creee avec succes. Le champ fullKey contient la cle complete.")
    public Response create(ApiKeyCreateRequest req) {
        String tenantId = identity.getTenantId();

        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawKey = "dsp_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        String keyHash = sha256(rawKey);
        String keyPrefix = rawKey.substring(0, 12);

        ApiKeyEntity entity = new ApiKeyEntity();
        entity.setTenantId(tenantId);
        entity.setKeyPrefix(keyPrefix);
        entity.setKeyHash(keyHash);
        entity.setLabel(req.label() != null && !req.label().isBlank() ? req.label() : "Clé API");
        em.persist(entity);

        return Response.status(Response.Status.CREATED)
                .entity(new ApiKeyCreateResponse(entity.getId(), keyPrefix, entity.getLabel(), rawKey))
                .build();
    }

    @PATCH
    @Path("/{id}/toggle")
    @Transactional
    @Operation(summary = "Activer/Desactiver une cle API", description = "Bascule l'etat actif/inactif d'une cle API. Une cle desactivee ne peut plus etre utilisee pour s'authentifier, mais peut etre reactivee.")
    @APIResponse(responseCode = "200", description = "Etat de la cle mis a jour")
    @APIResponse(responseCode = "404", description = "Cle introuvable")
    @APIResponse(responseCode = "400", description = "Cle revoquee, impossible de la reactiver")
    public Response toggle(@Parameter(description = "ID de la cle API") @PathParam("id") Long id) {
        String tenantId = identity.getTenantId();
        ApiKeyEntity key = em.find(ApiKeyEntity.class, id);
        if (key == null || !key.getTenantId().equals(tenantId)) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(ApiResponse.error("Clé introuvable"))
                    .build();
        }
        if (key.getRevokedAt() != null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(ApiResponse.error("Clé révoquée, impossible de la modifier"))
                    .build();
        }
        key.setEnabled(!key.isEnabled());
        em.merge(key);

        String msg = key.isEnabled() ? "Clé activée" : "Clé désactivée";
        return Response.ok(new ApiKeyDto(
                key.getId(), key.getKeyPrefix(), key.getLabel(),
                key.getUsageCount(), key.isActive(), key.isEnabled(),
                key.getCreatedAt(), key.getRevokedAt()
        )).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @Operation(summary = "Revoquer une cle API", description = "Revoque definitivement une cle API. Cette action est irreversible.")
    @APIResponse(responseCode = "200", description = "Cle revoquee")
    @APIResponse(responseCode = "404", description = "Cle introuvable")
    @APIResponse(responseCode = "400", description = "Cle deja revoquee")
    public Response revoke(@Parameter(description = "ID de la cle API") @PathParam("id") Long id) {
        String tenantId = identity.getTenantId();
        ApiKeyEntity key = em.find(ApiKeyEntity.class, id);
        if (key == null || !key.getTenantId().equals(tenantId)) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(ApiResponse.error("Clé introuvable"))
                    .build();
        }
        if (key.getRevokedAt() != null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(ApiResponse.error("Clé déjà révoquée"))
                    .build();
        }
        key.setRevokedAt(LocalDateTime.now());
        key.setEnabled(false);
        em.merge(key);
        return Response.ok(ApiResponse.ok("Clé révoquée")).build();
    }

    static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
