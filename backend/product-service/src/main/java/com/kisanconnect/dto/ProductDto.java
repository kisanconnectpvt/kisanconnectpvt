package com.kisanconnect.dto;
import com.kisanconnect.entity.Product;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class ProductDto {
    @Data public static class CreateRequest {
        @NotBlank @Size(max=200) private String name;
        private String description;
        private String category;
        @NotNull private Product.Scale scale;
        @NotNull @DecimalMin("0.01") private BigDecimal price;
        @NotBlank private String unit;
        @NotNull @DecimalMin("0") private BigDecimal stockQty;
        private String imageUrl;
    }
    @Data public static class UpdateRequest {
        private String name; private String description; private String category;
        private Product.Scale scale; private BigDecimal price; private String unit;
        private BigDecimal stockQty; private String imageUrl; private String status;
    }
    @Data @lombok.Builder public static class ProductResponse {
        private UUID id; private UUID farmerId; private String name; private String description;
        private String category; private Product.Scale scale; private BigDecimal price;
        private String unit; private BigDecimal stockQty; private String imageUrl;
        private String status; private LocalDateTime createdAt; private LocalDateTime updatedAt;
    }
}
