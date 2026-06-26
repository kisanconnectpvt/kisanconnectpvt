package com.kisanconnect.service;
import com.kisanconnect.dto.OrderDto.*;
import com.kisanconnect.entity.Order;
import com.kisanconnect.entity.OrderItem;
import com.kisanconnect.kafka.OrderEventProducer;
import com.kisanconnect.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class OrderService {
    private final OrderRepository repo;
    private final OrderEventProducer eventProducer;
    private final RestTemplate restTemplate;

    @Value("${product.service.url:${PRODUCT_SERVICE_URL:http://localhost:8082}}")
    private String productServiceUrl;

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
        updateProductStock(items);
        eventProducer.publishOrderCreated(saved);
        return toResponse(saved);
    }

    private void updateProductStock(List<OrderItem> items) {
        for (OrderItem item : items) {
            try {
                String url = productServiceUrl + "/api/v1/products/" + item.getProductId() + "/stock?quantity=" + item.getQuantity();
                restTemplate.postForEntity(url, null, Void.class);
            } catch (RestClientException ex) {
                throw new IllegalStateException("Failed to update stock for product " + item.getProductId(), ex);
            }
        }
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
