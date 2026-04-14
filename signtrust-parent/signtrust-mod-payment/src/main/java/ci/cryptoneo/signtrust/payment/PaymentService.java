package ci.cryptoneo.signtrust.payment;

public interface PaymentService {
    String initializePayment(String email, long amountKobo, String reference, String callbackUrl);
    PaymentStatus verifyPayment(String reference);
}
