package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.iam.KeycloakAdminService;
import ci.cryptoneo.signtrust.iam.SignTrustIdentity;
import ci.cryptoneo.signtrust.notification.NotificationService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

import java.util.Collections;
import java.util.List;

@Authenticated
@Path("/api/team")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TeamResource {

    private static final Logger LOG = Logger.getLogger(TeamResource.class);

    @Inject
    SignTrustIdentity identity;

    @Inject
    Keycloak keycloak;

    @Inject
    KeycloakAdminService keycloakAdmin;

    @Inject
    NotificationService notificationService;

    @GET
    public Response list() {
        String realmName = "signtrust";
        try {
            List<UserRepresentation> users = keycloak.realm(realmName).users().list(0, 100);
            List<TeamMemberDto> members = users.stream().map(u -> {
                // Get the first realm role that matches our known roles
                String role = "member";
                try {
                    List<RoleRepresentation> roles = keycloak.realm(realmName).users()
                            .get(u.getId()).roles().realmLevel().listEffective();
                    for (RoleRepresentation r : roles) {
                        if ("admin".equals(r.getName()) || "manager".equals(r.getName()) || "member".equals(r.getName())) {
                            role = r.getName();
                            break;
                        }
                    }
                } catch (Exception ignored) {}
                return new TeamMemberDto(u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(), role);
            }).toList();
            return Response.ok(members).build();
        } catch (Exception e) {
            LOG.errorf(e, "Failed to list team members");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur lors du chargement de l'equipe: " + e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/invite")
    public Response invite(TeamInviteRequest req) {
        try {
            String tenantId = identity.getTenantId();
            // Generate a random temporary password
            String tempPassword = java.util.UUID.randomUUID().toString().substring(0, 12);
            String userId = keycloakAdmin.createUser(tenantId != null ? tenantId : "signtrust",
                    req.email(), req.firstName(), req.lastName(), tempPassword);

            // Assign role
            if (req.role() != null) {
                try {
                    keycloakAdmin.assignRole(tenantId != null ? tenantId : "signtrust", userId, req.role());
                } catch (Exception e) {
                    LOG.warnf("Could not assign role %s to user %s: %s", req.role(), userId, e.getMessage());
                }
            }

            // Send invitation email
            String html = "<div style='font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:0'>"
                    + "<div style='background:linear-gradient(135deg,#0083BF,#005A8C);padding:28px 32px;border-radius:16px 16px 0 0'>"
                    + "<h2 style='color:#fff;margin:0;font-size:20px;font-weight:700'>DigiSign <span style=\"font-weight:400;opacity:.7\">Parapheur</span></h2>"
                    + "</div>"
                    + "<div style='background:#fff;padding:32px;border:1px solid #E8ECF1;border-top:none;border-radius:0 0 16px 16px'>"
                    + "<p style='color:#1E293B;font-size:15px;margin:0 0 16px'>Bonjour " + req.firstName() + ",</p>"
                    + "<p style='color:#64748B;font-size:14px;margin:0 0 20px'>Vous avez ete invite(e) a rejoindre votre equipe sur DigiSign Parapheur.</p>"
                    + "<div style='background:#F0F9FF;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px'>"
                    + "<p style='color:#64748B;font-size:12px;margin:0 0 8px'>Votre mot de passe temporaire</p>"
                    + "<span style='font-size:22px;font-weight:800;letter-spacing:3px;color:#0083BF'>" + tempPassword + "</span>"
                    + "</div>"
                    + "<p style='color:#EF4444;font-size:13px;font-weight:600;margin:0'>Veuillez le modifier lors de votre premiere connexion.</p>"
                    + "</div>"
                    + "<p style='text-align:center;color:#94A3B8;font-size:11px;margin-top:16px'>Cryptoneo — Cote d'Ivoire</p>"
                    + "</div>";
            notificationService.sendEmail(req.email(), "DigiSign Parapheur — Invitation equipe", html);

            return Response.status(Response.Status.CREATED)
                    .entity(new TeamMemberDto(userId, req.email(), req.firstName(), req.lastName(), req.role()))
                    .build();
        } catch (Exception e) {
            LOG.errorf(e, "Failed to invite team member");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur invitation: " + e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/{userId}/role")
    public Response changeRole(@PathParam("userId") String userId, RoleUpdateRequest req) {
        try {
            String tenantId = identity.getTenantId();
            String realmName = "signtrust";

            // Remove existing platform roles
            List<RoleRepresentation> currentRoles = keycloak.realm(realmName).users()
                    .get(userId).roles().realmLevel().listEffective();
            List<RoleRepresentation> toRemove = currentRoles.stream()
                    .filter(r -> "admin".equals(r.getName()) || "manager".equals(r.getName()) || "member".equals(r.getName()))
                    .toList();
            if (!toRemove.isEmpty()) {
                keycloak.realm(realmName).users().get(userId).roles().realmLevel().remove(toRemove);
            }

            // Assign new role
            keycloakAdmin.assignRole(tenantId != null ? tenantId : "signtrust", userId, req.role());

            return Response.ok(ApiResponse.ok("Role mis a jour")).build();
        } catch (Exception e) {
            LOG.errorf(e, "Failed to change role");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur changement de role: " + e.getMessage()))
                    .build();
        }
    }
}
