package com.kisanconnect.controller;

import com.kisanconnect.dto.PaymentDtos.CreateOrderRequest;
import com.kisanconnect.dto.PaymentDtos.CreateOrderResponse;
import com.kisanconnect.dto.PaymentDtos.StripeIntentRequest;
import com.kisanconnect.dto.PaymentDtos.StripeIntentResponse;
import com.kisanconnect.dto.PaymentDtos.StripeVerifyRequest;
import com.kisanconnect.dto.PaymentDtos.VerifyPaymentRequest;
import com.kisanconnect.dto.PaymentDtos.VerifyPaymentResponse;
import com.kisanconnect.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Razorpay-based payment order creation and verification")
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping("/orders")
    @Operation(summary = "Create a Razorpay order")
    public ResponseEntity<CreateOrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createOrder(request));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify Razorpay payment signature")
    public ResponseEntity<VerifyPaymentResponse> verify(@Valid @RequestBody VerifyPaymentRequest request) {
        return ResponseEntity.ok(paymentService.verifyPayment(request));
    }

    @PostMapping("/stripe/intent")
    @Operation(summary = "Create a Stripe payment intent for Google Pay")
    public ResponseEntity<StripeIntentResponse> createStripeIntent(@Valid @RequestBody StripeIntentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createStripeIntent(request));
    }

    @PostMapping("/stripe/verify")
    @Operation(summary = "Verify Stripe payment intent status")
    public ResponseEntity<VerifyPaymentResponse> verifyStripePayment(@Valid @RequestBody StripeVerifyRequest request) {
        return ResponseEntity.ok(paymentService.verifyStripePayment(request));
    }
}
