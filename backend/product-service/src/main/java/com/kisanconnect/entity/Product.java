package com.kisanconnect.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity @Table(name="products",schema="product_svc")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false) private UUID farmerId;
    @Column(nullable=false) private String name;
    private String description;
    private String category;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Scale scale;
    @Column(nullable=false) private BigDecimal price;
    @Column(nullable=false) private String unit;
    private BigDecimal stockQty;
    private String imageUrl;
    @Column(nullable=false) private String status = "ACTIVE";
    @Column(updatable=false) private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @PrePersist void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate  void onUpdate() { updatedAt = LocalDateTime.now(); }
    public enum Scale { SMALL, MEDIUM, LARGE }
}
