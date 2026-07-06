package com.kisanconnect.service;

import com.kisanconnect.dto.PaymentDtos.CreateOrderRequest;
import com.kisanconnect.dto.PaymentDtos.CreateOrderResponse;
import com.kisanconnect.dto.PaymentDtos.StripeIntentRequest;
import com.kisanconnect.dto.PaymentDtos.StripeIntentResponse;
import com.kisanconnect.dto.PaymentDtos.StripeVerifyRequest;
import com.kisanconnect.dto.PaymentDtos.VerifyPaymentRequest;
import com.kisanconnect.dto.PaymentDtos.VerifyPaymentResponse;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {
    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${stripe.publishable-key:}")
    private String stripePublishableKey;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    public StripeIntentResponse createStripeIntent(StripeIntentRequest request) {
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            throw new IllegalStateException("Stripe secret key is not configured for payment-service.");
        }
        if (stripePublishableKey == null || stripePublishableKey.isBlank()) {
            throw new IllegalStateException("Stripe publishable key is not configured for payment-service.");
        }

        Stripe.apiKey = stripeSecretKey;

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(request.amount())
                    .setCurrency(request.currency().toLowerCase())
                    .setDescription(request.description())
                    .addPaymentMethodType("card")
                    .addPaymentMethodType("upi")
                    .putMetadata("order_id", request.orderId().toString())
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);
            return new StripeIntentResponse(
                    intent.getClientSecret(),
                    stripePublishableKey,
                    intent.getId(),
                    intent.getAmount(),
                    intent.getCurrency()
            );
        } catch (StripeException e) {
            throw new IllegalStateException("Unable to create Stripe payment intent", e);
        }
    }

    public VerifyPaymentResponse verifyStripePayment(StripeVerifyRequest request) {
        Stripe.apiKey = stripeSecretKey;

        try {
            PaymentIntent intent = PaymentIntent.retrieve(request.paymentIntentId());
            boolean verified = "succeeded".equals(intent.getStatus());
            return new VerifyPaymentResponse(verified,
                    verified ? "Payment succeeded" : "Payment status is " + intent.getStatus());
        } catch (StripeException e) {
            throw new IllegalStateException("Unable to verify Stripe payment", e);
        }
    }

    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        String orderId = "rzp_order_" + request.orderId();
        return new CreateOrderResponse(
                orderId,
                stripePublishableKey,
                request.currency(),
                request.amount(),
                "KisanConnect",
                "buyer@example.com",
                "9999999999",
                "orderId=" + request.orderId(),
                baseUrl + "/payment/success"
        );
    }

    public VerifyPaymentResponse verifyPayment(VerifyPaymentRequest request) {
        String generatedSignature = generateHmacSha256(
                request.razorpayOrderId() + "|" + request.razorpayPaymentId(),
                stripeSecretKey
        );

        boolean verified = generatedSignature.equals(request.razorpaySignature());
        return new VerifyPaymentResponse(verified, verified ? "Payment verified" : "Payment signature mismatch");
    }

    private String generateHmacSha256(String data, String secret) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKeySpec = new javax.crypto.spec.SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] bytes = mac.doFinal(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            java.util.Formatter formatter = new java.util.Formatter();
            for (byte b : bytes) {
                formatter.format("%02x", b);
            }
            return formatter.toString();
        } catch (java.security.NoSuchAlgorithmException | java.security.InvalidKeyException e) {
            throw new IllegalStateException("Unable to verify Razorpay signature", e);
        }
    }
}
