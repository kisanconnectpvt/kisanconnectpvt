package com.kisanconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class PaymentDtos {
    public record CreateOrderRequest(
            @NotNull UUID orderId,
            @NotBlank String currency,
            @NotNull Long amount,
            @NotBlank String description
    ) {}

    public record CreateOrderResponse(
            String orderId,
            String key,
            String currency,
            Long amount,
            String name,
            String email,
            String contact,
            String notes,
            String callbackUrl
    ) {}

    public record StripeIntentRequest(
            @NotNull UUID orderId,
            @NotBlank String currency,
            @NotNull Long amount,
            @NotBlank String description
    ) {}

    public record StripeIntentResponse(
            String clientSecret,
            String publishableKey,
            String paymentIntentId,
            Long amount,
            String currency
    ) {}

    public record StripeVerifyRequest(
            @NotBlank String paymentIntentId
    ) {}

    public record VerifyPaymentRequest(
            @NotBlank String razorpayOrderId,
            @NotBlank String razorpayPaymentId,
            @NotBlank String razorpaySignature
    ) {}

    public record VerifyPaymentResponse(
            boolean verified,
            String message
    ) {}
}
