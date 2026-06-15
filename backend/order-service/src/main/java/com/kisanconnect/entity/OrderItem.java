package com.kisanconnect.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity @Table(name="order_items",schema="order_svc")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="order_id",nullable=false)
    @ToString.Exclude private Order order;
    @Column(nullable=false) private UUID productId;
    @Column(nullable=false) private UUID farmerId;
    @Column(nullable=false) private BigDecimal quantity;
    @Column(nullable=false) private BigDecimal unitPrice;
    @Column(nullable=false) private String scale;
}
