package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.ApiResponse;
import ci.cryptoneo.signtrust.app.dto.PaymentInitRequest;
import ci.cryptoneo.signtrust.app.dto.PaymentInitResponse;
import ci.cryptoneo.signtrust.app.dto.PaymentVerifyResponse;
import ci.cryptoneo.signtrust.app.service.MockPaymentService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/payments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PaymentResource {

    @Inject
    MockPaymentService paymentService;

    @POST
    @Path("/initialize")
    public Response initialize(PaymentInitRequest req) {
        try {
            PaymentInitResponse resp = paymentService.initializePayment(req);
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
