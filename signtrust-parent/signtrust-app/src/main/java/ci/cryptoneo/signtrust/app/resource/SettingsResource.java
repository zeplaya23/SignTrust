package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.SubscriptionEntity;
import ci.cryptoneo.signtrust.app.entity.UserProfileEntity;
import ci.cryptoneo.signtrust.iam.SignTrustIdentity;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Authenticated
@Path("/api/settings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SettingsResource {

    @Inject
    EntityManager em;

    @Inject
    SignTrustIdentity identity;

    @GET
    @Path("/profile")
    public Response getProfile() {
        String userId = identity.getUserId();
        try {
            UserProfileEntity profile = em.createQuery(
                            "SELECT u FROM UserProfileEntity u WHERE u.keycloakId = :kid", UserProfileEntity.class)
                    .setParameter("kid", userId)
                    .getSingleResult();

            return Response.ok(Map.of(
                    "id", profile.getId(),
                    "keycloakId", profile.getKeycloakId(),
                    "email", profile.getEmail(),
                    "firstName", profile.getFirstName() != null ? profile.getFirstName() : "",
                    "lastName", profile.getLastName() != null ? profile.getLastName() : "",
                    "phone", profile.getPhone() != null ? profile.getPhone() : "",
                    "companyName", profile.getCompanyName() != null ? profile.getCompanyName() : "",
                    "accountType", profile.getAccountType() != null ? profile.getAccountType() : ""
            )).build();
        } catch (NoResultException e) {
            throw new WebApplicationException("Profil utilisateur introuvable", Response.Status.NOT_FOUND);
        }
    }

    @PUT
    @Path("/profile")
    @Transactional
    public Response updateProfile(ProfileUpdateRequest req) {
        String userId = identity.getUserId();
        try {
            UserProfileEntity profile = em.createQuery(
                            "SELECT u FROM UserProfileEntity u WHERE u.keycloakId = :kid", UserProfileEntity.class)
                    .setParameter("kid", userId)
                    .getSingleResult();

            if (req.firstName() != null) profile.setFirstName(req.firstName());
            if (req.lastName() != null) profile.setLastName(req.lastName());
            if (req.phone() != null) profile.setPhone(req.phone());
            if (req.companyName() != null) profile.setCompanyName(req.companyName());
            em.merge(profile);

            return Response.ok(ApiResponse.ok("Profil mis a jour")).build();
        } catch (NoResultException e) {
            throw new WebApplicationException("Profil utilisateur introuvable", Response.Status.NOT_FOUND);
        }
    }

    @GET
    @Path("/subscription")
    public Response getSubscription() {
        String userId = identity.getUserId();
        try {
            UserProfileEntity profile = em.createQuery(
                            "SELECT u FROM UserProfileEntity u WHERE u.keycloakId = :kid", UserProfileEntity.class)
                    .setParameter("kid", userId)
                    .getSingleResult();

            SubscriptionEntity sub = em.createQuery(
                            "SELECT s FROM SubscriptionEntity s WHERE s.userId = :uid ORDER BY s.createdAt DESC",
                            SubscriptionEntity.class)
                    .setParameter("uid", profile.getId())
                    .setMaxResults(1)
                    .getSingleResult();

            return Response.ok(Map.of(
                    "id", sub.getId(),
                    "planId", sub.getPlanId(),
                    "status", sub.getStatus(),
                    "startDate", sub.getStartDate() != null ? sub.getStartDate().toString() : "",
                    "endDate", sub.getEndDate() != null ? sub.getEndDate().toString() : "",
                    "amount", sub.getAmount() != null ? sub.getAmount() : 0
            )).build();
        } catch (NoResultException e) {
            return Response.ok(Map.of(
                    "status", "NONE",
                    "planId", "free",
                    "message", "Aucun abonnement actif"
            )).build();
        }
    }
}
