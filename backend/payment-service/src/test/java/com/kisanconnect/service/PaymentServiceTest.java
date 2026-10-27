package com.kisanconnect.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.kisanconnect.dto.PaymentDtos.VerifyPaymentRequest;
import com.kisanconnect.dto.PaymentDtos.InternalVerifyPaymentRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

class PaymentServiceTest {
    private RestClient.Builder restClientBuilder;
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        restClientBuilder = mock(RestClient.Builder.class);
        paymentService = new PaymentService(restClientBuilder);
    }

    @Test
    void rejectsPaymentVerificationWhenCredentialsAreMissing() {
        assertThrows(IllegalStateException.class, () -> paymentService.verifyPayment(
            new VerifyPaymentRequest("order_123", "pay_123", "signature"), "buyer-123"));
        verifyNoInteractions(restClientBuilder);
    }

    @Test
    void rejectsInvalidSignatureWithoutCallingGateway() {
        ReflectionTestUtils.setField(paymentService, "razorpayKeyId", "rzp_test_key");
        ReflectionTestUtils.setField(paymentService, "razorpayKeySecret", "test_secret");

        var result = paymentService.verifyPayment(
            new VerifyPaymentRequest("order_123", "pay_123", "invalid_signature"), "buyer-123");

        assertFalse(result.verified());
        assertTrue(result.message().contains("signature mismatch"));
        verifyNoInteractions(restClientBuilder);
    }

    @Test
    void rejectsInvalidInternalPaymentProofWithoutGatewayCall() {
        ReflectionTestUtils.setField(paymentService, "razorpayKeyId", "rzp_test_key");
        ReflectionTestUtils.setField(paymentService, "razorpayKeySecret", "test_secret");

        var result = paymentService.verifyPaymentInternally(new InternalVerifyPaymentRequest(
                "order_123", "pay_123", "bad-signature", "buyer-123", 100L));

        assertFalse(result.verified());
        verifyNoInteractions(restClientBuilder);
    }
}