package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.UserProfileEntity;
import ci.cryptoneo.signtrust.app.service.AuthService;
import ci.cryptoneo.signtrust.app.service.OtpService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    private static final Logger LOG = Logger.getLogger(AuthResource.class);

    @Inject
    AuthService authService;

    @Inject
    OtpService otpService;

    /**
     * Sérialise une WebApplicationException en JSON {error: message}.
     * Sans ce wrapper, Quarkus renvoie le bon code HTTP mais avec un body vide.
     */
    private Response toErrorResponse(WebApplicationException e) {
        int status = e.getResponse() != null ? e.getResponse().getStatus() : 500;
        String message = e.getMessage() != null ? e.getMessage() : "Erreur serveur";
        return Response.status(status).entity(ApiResponse.error(message)).build();
    }

    @POST
    @Path("/register")
    public Response register(RegisterRequest req) {
        try {
            UserProfileEntity user = authService.register(req);

            // Send OTP email
            otpService.generateAndSend(req.email());

            return Response.status(Response.Status.CREATED)
                    .entity(new RegisterResponse(user.getId(), user.getEmail(),
                            "Compte créé. Un code de vérification a été envoyé à " + req.email()))
                    .build();
        } catch (WebApplicationException e) {
            LOG.warnf("Auth error %d: %s", e.getResponse() != null ? e.getResponse().getStatus() : -1, e.getMessage());
            return toErrorResponse(e);
        } catch (Exception e) {
            LOG.error("Auth unexpected error", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur lors de l'inscription: " + e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/login")
    public Response login(LoginRequest req) {
        try {
            LoginResponse resp = authService.login(req);
            return Response.ok(resp).build();
        } catch (WebApplicationException e) {
            LOG.warnf("Auth error %d: %s", e.getResponse() != null ? e.getResponse().getStatus() : -1, e.getMessage());
            return toErrorResponse(e);
        } catch (Exception e) {
            LOG.error("Auth unexpected error", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur de connexion: " + e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/refresh")
    public Response refresh(RefreshRequest req) {
        try {
            LoginResponse resp = authService.refresh(req.refreshToken());
            return Response.ok(resp).build();
        } catch (WebApplicationException e) {
            LOG.warnf("Auth error %d: %s", e.getResponse() != null ? e.getResponse().getStatus() : -1, e.getMessage());
            return toErrorResponse(e);
        } catch (Exception e) {
            LOG.error("Auth unexpected error", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur de rafraîchissement: " + e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/otp/send")
    public Response sendOtp(OtpSendRequest req) {
        try {
            otpService.generateAndSend(req.email());
            return Response.ok(ApiResponse.ok("Code OTP envoyé à " + req.email())).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur envoi OTP: " + e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/otp/verify")
    public Response verifyOtp(OtpVerifyRequest req) {
        boolean valid = otpService.verify(req.email(), req.code());
        if (valid) {
            return Response.ok(ApiResponse.ok("Code vérifié avec succès")).build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(ApiResponse.error("Code invalide ou expiré"))
                    .build();
        }
    }
}
