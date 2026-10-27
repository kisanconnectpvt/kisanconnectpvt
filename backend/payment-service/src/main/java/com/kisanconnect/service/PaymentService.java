package com.kisanconnect.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.kisanconnect.dto.PaymentDtos.CreateOrderRequest;
import com.kisanconnect.dto.PaymentDtos.CreateOrderResponse;
import com.kisanconnect.dto.PaymentDtos.InternalVerifyPaymentRequest;
import com.kisanconnect.dto.PaymentDtos.Item;
import com.kisanconnect.dto.PaymentDtos.VerifyPaymentRequest;
import com.kisanconnect.dto.PaymentDtos.VerifyPaymentResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.math.BigDecimal;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class PaymentService {
    private final RestClient.Builder restClientBuilder;

    @Value("${razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret:}")
    private String razorpayKeySecret;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    @Value("${product.service.url:${PRODUCT_SERVICE_URL:http://localhost:8082}}")
    private String productServiceUrl;

    public PaymentService(RestClient.Builder restClientBuilder) {
        this.restClientBuilder = restClientBuilder;
    }

    public CreateOrderResponse createOrder(CreateOrderRequest request, String buyerId) {
        requireRazorpayCredentials();
        BigDecimal total = request.items().stream()
                .map(this::trustedLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long amount = total.movePointRight(2).longValueExact();
        if (amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive.");
        }
        String receipt = UUID.randomUUID().toString();
        String description = "KisanConnect order for INR " + total.setScale(2).toPlainString();
        try {
            JsonNode order = restClientBuilder.build().post()
                    .uri("https://api.razorpay.com/v1/orders")
                    .headers(headers -> headers.setBasicAuth(razorpayKeyId, razorpayKeySecret))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "amount", amount,
                            "currency", "INR",
                            "receipt", receipt,
                            "notes", Map.of("description", description, "buyer_id", buyerId)))
                    .retrieve()
                    .body(JsonNode.class);
            if (order == null || order.path("id").asText().isBlank()) {
                throw new IllegalStateException("Razorpay returned an invalid payment order.");
            }
            return new CreateOrderResponse(
                    order.path("id").asText(), razorpayKeyId, "INR",
                    amount, "KisanConnect", description, baseUrl);
        } catch (RestClientException e) {
            throw new IllegalStateException("Unable to create Razorpay payment order.", e);
        }
    }

    private BigDecimal trustedLineTotal(Item item) {
        try {
            JsonNode product = restClientBuilder.build().get()
                    .uri(productServiceUrl + "/api/v1/products/{productId}", item.productId())
                    .retrieve()
                    .body(JsonNode.class);
            if (product == null || !"ACTIVE".equals(product.path("status").asText())) {
                throw new IllegalArgumentException("Product is unavailable: " + item.productId());
            }
            BigDecimal price = new BigDecimal(product.path("price").asText());
            return price.multiply(item.quantity());
        } catch (RestClientException ex) {
            throw new IllegalStateException("Unable to validate product " + item.productId(), ex);
        }
    }

    public VerifyPaymentResponse verifyPayment(VerifyPaymentRequest request, String buyerId) {
        return verifyCapturedPayment(request.razorpayOrderId(), request.razorpayPaymentId(),
            request.razorpaySignature(), null, buyerId);
        }

        public VerifyPaymentResponse verifyPaymentInternally(InternalVerifyPaymentRequest request) {
        return verifyCapturedPayment(request.razorpayOrderId(), request.razorpayPaymentId(),
            request.razorpaySignature(), request.expectedAmount(), request.buyerId());
        }

        private VerifyPaymentResponse verifyCapturedPayment(String orderId, String paymentId,
            String signature, Long expectedAmount) {
            return verifyCapturedPayment(orderId, paymentId, signature, expectedAmount, null);
        }

        private VerifyPaymentResponse verifyCapturedPayment(String orderId, String paymentId,
                String signature, Long expectedAmount, String buyerId) {
        requireRazorpayCredentials();
        String expectedSignature = generateHmacSha256(
            orderId + "|" + paymentId, razorpayKeySecret);
        boolean signatureMatches = MessageDigest.isEqual(
                expectedSignature.getBytes(StandardCharsets.US_ASCII),
            signature.getBytes(StandardCharsets.US_ASCII));
        if (!signatureMatches) {
            return new VerifyPaymentResponse(false, "Payment signature mismatch");
        }

        try {
            JsonNode payment = restClientBuilder.build().get()
                    .uri("https://api.razorpay.com/v1/payments/{paymentId}", paymentId)
                    .headers(headers -> headers.setBasicAuth(razorpayKeyId, razorpayKeySecret))
                    .retrieve()
                    .body(JsonNode.class);
            boolean capturedForOrder = payment != null
                    && "captured".equals(payment.path("status").asText())
                    && orderId.equals(payment.path("order_id").asText())
                    && "INR".equals(payment.path("currency").asText())
                    && (expectedAmount == null || expectedAmount.equals(payment.path("amount").asLong()));
                    JsonNode order = buyerId == null ? null : restClientBuilder.build().get()
                        .uri("https://api.razorpay.com/v1/orders/{orderId}", orderId)
                        .headers(headers -> headers.setBasicAuth(razorpayKeyId, razorpayKeySecret))
                        .retrieve().body(JsonNode.class);
                    boolean orderBoundToBuyer = buyerId == null || (order != null
                        && expectedAmount.equals(order.path("amount").asLong())
                        && "INR".equals(order.path("currency").asText())
                        && buyerId.equals(order.path("notes").path("buyer_id").asText()));
                        boolean amountMatchesGatewayOrder = order == null
                            || payment.path("amount").asLong() == order.path("amount").asLong();
                        boolean verified = capturedForOrder && orderBoundToBuyer && amountMatchesGatewayOrder;
                    return new VerifyPaymentResponse(verified,
                        verified ? "Payment captured and verified" : "Payment does not match the buyer, order, amount, or currency");
        } catch (RestClientException e) {
            throw new IllegalStateException("Unable to verify Razorpay payment status.", e);
        }
    }

    private void requireRazorpayCredentials() {
        if (razorpayKeyId == null || razorpayKeyId.isBlank()
                || razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
            throw new IllegalStateException("Razorpay key ID and key secret are required.");
        }
    }

    private String generateHmacSha256(String data, String secret) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec key = new javax.crypto.spec.SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(key);
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException | java.security.InvalidKeyException e) {
            throw new IllegalStateException("Unable to verify Razorpay signature", e);
        }
    }
}