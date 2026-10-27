package com.kisanconnect.controller;

import com.kisanconnect.dto.PaymentDtos.CreateOrderRequest;
import com.kisanconnect.dto.PaymentDtos.CreateOrderResponse;
import com.kisanconnect.dto.PaymentDtos.InternalVerifyPaymentRequest;
import com.kisanconnect.dto.PaymentDtos.VerifyPaymentRequest;
import com.kisanconnect.dto.PaymentDtos.VerifyPaymentResponse;
import com.kisanconnect.service.PaymentService;
import com.kisanconnect.security.InternalApiKeyVerifier;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Razorpay payment order creation and verification")
public class PaymentController {
    private final PaymentService paymentService;
    private final InternalApiKeyVerifier internalApiKeyVerifier;

    @PostMapping("/orders")
    @Operation(summary = "Create a Razorpay order")
    public ResponseEntity<CreateOrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.createOrder(request, authentication.getDetails().toString()));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify Razorpay payment signature")
    public ResponseEntity<VerifyPaymentResponse> verify(@Valid @RequestBody VerifyPaymentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(paymentService.verifyPayment(request, authentication.getDetails().toString()));
    }

    @PostMapping("/internal/verify")
    @Operation(summary = "Verify a captured payment against an expected order amount")
    public ResponseEntity<VerifyPaymentResponse> verifyInternally(
            @RequestHeader(value = "X-Internal-Api-Key", required = false) String internalApiKey,
            @Valid @RequestBody InternalVerifyPaymentRequest request) {
        if (!internalApiKeyVerifier.isValid(internalApiKey)) {
            throw new org.springframework.security.access.AccessDeniedException("Internal service authentication required");
        }
        return ResponseEntity.ok(paymentService.verifyPaymentInternally(request));
    }

}
