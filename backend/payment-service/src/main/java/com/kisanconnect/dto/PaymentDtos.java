package com.kisanconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class PaymentDtos {
    public record CreateOrderRequest(
            @NotEmpty List<@Valid Item> items
    ) {}

    public record Item(
            @NotNull UUID productId,
            @NotNull @Positive BigDecimal quantity
    ) {}

    public record CreateOrderResponse(
            String orderId,
            String keyId,
            String currency,
            Long amount,
            String name,
            String description,
            String callbackUrl
    ) {}

    public record VerifyPaymentRequest(
            @NotBlank String razorpayOrderId,
            @NotBlank String razorpayPaymentId,
            @NotBlank String razorpaySignature
    ) {}

    public record InternalVerifyPaymentRequest(
            @NotBlank String razorpayOrderId,
            @NotBlank String razorpayPaymentId,
            @NotBlank String razorpaySignature,
            @NotBlank String buyerId,
            @NotNull @Positive Long expectedAmount
    ) {}

    public record VerifyPaymentResponse(
            boolean verified,
            String message
    ) {}
}
