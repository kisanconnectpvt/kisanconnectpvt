package com.kisanconnect.dto;
import com.kisanconnect.entity.Order;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

public class OrderDto {
    @Data public static class OrderItemRequest {
        @NotNull private UUID productId;
        @NotNull @DecimalMin("0.01") private BigDecimal quantity;
    }
    @Data public static class CreateOrderRequest {
        @NotEmpty @Valid private List<OrderItemRequest> items;
        @NotBlank private String razorpayOrderId;
        @NotBlank private String razorpayPaymentId;
        @NotBlank private String razorpaySignature;
    }
    @Data @lombok.Builder public static class OrderItemResponse {
        private UUID id; private UUID productId; private UUID farmerId;
        private BigDecimal quantity; private BigDecimal unitPrice; private BigDecimal lineTotal; private String scale;
    }
    @Data @lombok.Builder public static class OrderResponse {
        private UUID id; private UUID buyerId; private BigDecimal totalAmount;
        private Order.OrderStatus status; private List<OrderItemResponse> items;
        private LocalDateTime createdAt; private LocalDateTime updatedAt;
    }
}
