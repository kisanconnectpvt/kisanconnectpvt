package com.kisanconnect.service;
import com.kisanconnect.dto.OrderDto.*;
import com.kisanconnect.entity.*;
import com.kisanconnect.kafka.OrderEventProducer;
import com.kisanconnect.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class OrderService {
    private final OrderRepository repo;
    private final OrderEventProducer eventProducer;

    @Transactional
    public OrderResponse createOrder(UUID buyerId, CreateOrderRequest req) {
        List<OrderItem> items = req.getItems().stream().map(i -> OrderItem.builder()
            .productId(i.getProductId()).farmerId(i.getFarmerId())
            .quantity(i.getQuantity()).unitPrice(i.getUnitPrice()).scale(i.getScale()).build())
            .collect(Collectors.toList());
        BigDecimal total = items.stream()
            .map(i -> i.getUnitPrice().multiply(i.getQuantity())).reduce(BigDecimal.ZERO, BigDecimal::add);
        Order order = Order.builder().buyerId(buyerId).totalAmount(total)
            .status(Order.OrderStatus.PENDING).build();
        items.forEach(i -> i.setOrder(order));
        order.setItems(items);
        Order saved = repo.save(order);
        eventProducer.publishOrderCreated(saved);
        return toResponse(saved);
    }

    public List<OrderResponse> getMyOrders(UUID buyerId) {
        return repo.findByBuyerIdOrderByCreatedAtDesc(buyerId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public OrderResponse getById(UUID id) {
        return toResponse(repo.findById(id).orElseThrow(() -> new RuntimeException("Order not found: " + id)));
    }

    @Transactional
    public OrderResponse updateStatus(UUID id, String status) {
        Order order = repo.findById(id).orElseThrow(() -> new RuntimeException("Order not found: " + id));
        order.setStatus(Order.OrderStatus.valueOf(status.toUpperCase()));
        Order saved = repo.save(order);
        eventProducer.publishOrderStatusUpdated(saved);
        return toResponse(saved);
    }

    private OrderResponse toResponse(Order o) {
        List<OrderItemResponse> items = o.getItems().stream().map(i -> OrderItemResponse.builder()
            .id(i.getId()).productId(i.getProductId()).farmerId(i.getFarmerId())
            .quantity(i.getQuantity()).unitPrice(i.getUnitPrice()).scale(i.getScale())
            .lineTotal(i.getUnitPrice().multiply(i.getQuantity())).build()).collect(Collectors.toList());
        return OrderResponse.builder().id(o.getId()).buyerId(o.getBuyerId())
            .totalAmount(o.getTotalAmount()).status(o.getStatus()).items(items)
            .createdAt(o.getCreatedAt()).updatedAt(o.getUpdatedAt()).build();
    }
}
