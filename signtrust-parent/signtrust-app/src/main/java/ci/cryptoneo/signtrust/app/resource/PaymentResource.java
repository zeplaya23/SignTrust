package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.ApiResponse;
import ci.cryptoneo.signtrust.app.dto.PaymentInitRequest;
import ci.cryptoneo.signtrust.app.dto.PaymentInitResponse;
import ci.cryptoneo.signtrust.app.dto.PaymentVerifyResponse;
import ci.cryptoneo.signtrust.app.entity.UserProfileEntity;
import ci.cryptoneo.signtrust.app.service.MockPaymentService;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/api/payments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PaymentResource {

    @Inject
    MockPaymentService paymentService;

    @Inject
    EntityManager em;

    @Inject
    JsonWebToken jwt;

    @POST
    @Path("/initialize")
    public Response initialize(PaymentInitRequest req) {
        try {
            PaymentInitRequest effective = req;
            // If userId not provided or 0, resolve from JWT token
            if (req.userId() == null || req.userId() <= 0) {
                String keycloakId = jwt.getSubject();
                if (keycloakId != null) {
                    UserProfileEntity user = em.createQuery(
                            "SELECT u FROM UserProfileEntity u WHERE u.keycloakId = :kid", UserProfileEntity.class)
                            .setParameter("kid", keycloakId).getSingleResult();
                    effective = new PaymentInitRequest(user.getId(), req.planId(), req.paymentMethod(), req.mobileOperator(), req.amount());
                }
            }
            PaymentInitResponse resp = paymentService.initializePayment(effective);
            return Response.ok(resp).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur paiement: " + e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/verify/{reference}")
    public Response verify(@PathParam("reference") String reference) {
        try {
            PaymentVerifyResponse resp = paymentService.verifyPayment(reference);
            return Response.ok(resp).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur vérification: " + e.getMessage()))
                    .build();
        }
    }
}
