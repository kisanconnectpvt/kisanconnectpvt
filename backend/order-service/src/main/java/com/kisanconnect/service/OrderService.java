package com.kisanconnect.service;
import com.kisanconnect.dto.OrderDto.*;
import com.kisanconnect.entity.Order;
import com.kisanconnect.entity.OrderItem;
import com.kisanconnect.kafka.OrderEventProducer;
import com.kisanconnect.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class OrderService {
    private final OrderRepository repo;
    private final OrderEventProducer eventProducer;
    private final RestTemplate restTemplate;

    @Value("${internal.api-key:}")
    private String internalApiKey;

    @Value("${product.service.url:${PRODUCT_SERVICE_URL:http://localhost:8082}}")
    private String productServiceUrl;

    @Value("${user.service.url:${USER_SERVICE_URL:http://localhost:8081}}")
    private String userServiceUrl;

    @Value("${payment.service.url:${PAYMENT_SERVICE_URL:http://localhost:8085}}")
    private String paymentServiceUrl;

    @Transactional
    public OrderResponse createOrder(UUID buyerId, CreateOrderRequest req) {
        ensureBuyerHasAddress(buyerId);
        List<OrderItem> items = req.getItems().stream().map(this::buildTrustedItem)
            .collect(Collectors.toList());
        BigDecimal total = items.stream()
            .map(i -> i.getUnitPrice().multiply(i.getQuantity())).reduce(BigDecimal.ZERO, BigDecimal::add);
        verifyPayment(req, total, buyerId);
        Order order = Order.builder().buyerId(buyerId).totalAmount(total)
            .razorpayPaymentId(req.getRazorpayPaymentId())
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
                HttpHeaders headers = new HttpHeaders();
                headers.set("X-Internal-Api-Key", internalApiKey);
                restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Void.class);
            } catch (RestClientException ex) {
                throw new IllegalStateException("Failed to update stock for product " + item.getProductId(), ex);
            }
        }
    }

    private OrderItem buildTrustedItem(OrderItemRequest item) {
        ProductSnapshot product = getProduct(item.getProductId());
        if (!"ACTIVE".equals(product.status())) {
            throw new IllegalArgumentException("Product is not available: " + item.getProductId());
        }
        return OrderItem.builder().productId(item.getProductId()).farmerId(product.farmerId())
                .quantity(item.getQuantity()).unitPrice(product.price()).scale(product.scale()).build();
    }

    private ProductSnapshot getProduct(UUID productId) {
        try {
            String url = productServiceUrl + "/api/v1/products/" + productId;
            @SuppressWarnings("unchecked")
            Map<String, Object> product = restTemplate.getForObject(url, Map.class);
            if (product == null) throw new IllegalArgumentException("Product not found: " + productId);
            return new ProductSnapshot(UUID.fromString(product.get("farmerId").toString()),
                    new BigDecimal(product.get("price").toString()), product.get("scale").toString(),
                    product.get("status").toString());
        } catch (RestClientException ex) {
            throw new IllegalStateException("Unable to validate product " + productId, ex);
        }
    }

    private record ProductSnapshot(UUID farmerId, BigDecimal price, String scale, String status) {}

    private void verifyPayment(CreateOrderRequest request, BigDecimal total, UUID buyerId) {
        long expectedAmount = total.movePointRight(2).longValueExact();
        String url = paymentServiceUrl + "/api/v1/payments/internal/verify";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Api-Key", internalApiKey);
        Map<String, Object> body = Map.of(
                "razorpayOrderId", request.getRazorpayOrderId(),
                "razorpayPaymentId", request.getRazorpayPaymentId(),
                "razorpaySignature", request.getRazorpaySignature(),
                "buyerId", buyerId.toString(),
                "expectedAmount", expectedAmount);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(body, headers), Map.class);
        if (response.getBody() == null || !Boolean.TRUE.equals(response.getBody().get("verified"))) {
            throw new org.springframework.security.access.AccessDeniedException("Payment verification failed");
        }
    }

    public List<OrderResponse> getMyOrders(UUID buyerId) {
        return repo.findByBuyerIdOrderByCreatedAtDesc(buyerId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public OrderResponse getById(UUID id, UUID userId, String role) {
        Order order = repo.findById(id).orElseThrow(() -> new RuntimeException("Order not found: " + id));
        boolean buyerOwnsOrder = order.getBuyerId().equals(userId);
        boolean farmerOwnsItem = order.getItems().stream().anyMatch(item -> item.getFarmerId().equals(userId));
        if (!"ADMIN".equals(role) && !buyerOwnsOrder && !farmerOwnsItem) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view this order");
        }
        if ("FARMER".equals(role) && !buyerOwnsOrder) {
            List<OrderItem> visibleItems = order.getItems().stream()
                .filter(item -> item.getFarmerId().equals(userId)).toList();
            BigDecimal visibleTotal = visibleItems.stream()
                .map(item -> item.getUnitPrice().multiply(item.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            return toResponse(order, visibleItems, visibleTotal);
        }
        return toResponse(order);
    }

    private void ensureBuyerHasAddress(UUID buyerId) {
        try {
            String url = userServiceUrl + "/api/v1/users/internal/" + buyerId;
                @SuppressWarnings("unchecked")
                Map<String, Object> user = restTemplate.exchange(url, HttpMethod.GET,
                    internalRequest(), Map.class).getBody();
            if (user == null || !"BUYER".equals(user.get("role")) || !hasAddress(user)) {
                throw new RuntimeException("Buyer address is required before placing an order.");
            }
        } catch (RestClientException ex) {
            throw new RuntimeException("Unable to validate buyer address with user service.", ex);
        }
    }

    private HttpEntity<Void> internalRequest() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Api-Key", internalApiKey);
        return new HttpEntity<>(headers);
    }

    private boolean hasAddress(Map<String, Object> user) {
        return !isBlank((String) user.get("addressLine1"))
            && !isBlank((String) user.get("city"))
            && !isBlank((String) user.get("state"))
            && !isBlank((String) user.get("postalCode"));
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    @Transactional
    public OrderResponse updateStatus(UUID id, String status, UUID userId, String role) {
        Order order = repo.findById(id).orElseThrow(() -> new RuntimeException("Order not found: " + id));
        Order.OrderStatus requested = Order.OrderStatus.valueOf(status.toUpperCase());
        boolean buyerCancelsPending = order.getBuyerId().equals(userId)
                && order.getStatus() == Order.OrderStatus.PENDING
                && requested == Order.OrderStatus.CANCELLED;
        boolean owningFarmerUpdates = !order.getItems().isEmpty()
            && order.getItems().stream().allMatch(item -> item.getFarmerId().equals(userId));
        boolean farmerTransition = owningFarmerUpdates && switch (order.getStatus()) {
            case PENDING -> requested == Order.OrderStatus.CONFIRMED;
            case CONFIRMED -> requested == Order.OrderStatus.SHIPPED;
            case SHIPPED -> requested == Order.OrderStatus.DELIVERED;
            default -> false;
        };
        if (!"ADMIN".equals(role) && !buyerCancelsPending && !farmerTransition) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to change this order status");
        }
        order.setStatus(requested);
        Order saved = repo.save(order);
        eventProducer.publishOrderStatusUpdated(saved);
        return toResponse(saved);
    }

    private OrderResponse toResponse(Order o) {
        return toResponse(o, o.getItems(), o.getTotalAmount());
    }

    private OrderResponse toResponse(Order o, List<OrderItem> visibleItems, BigDecimal visibleTotal) {
        List<OrderItemResponse> items = visibleItems.stream().map(i -> OrderItemResponse.builder()
            .id(i.getId()).productId(i.getProductId()).farmerId(i.getFarmerId())
            .quantity(i.getQuantity()).unitPrice(i.getUnitPrice()).scale(i.getScale())
            .lineTotal(i.getUnitPrice().multiply(i.getQuantity())).build()).collect(Collectors.toList());
        return OrderResponse.builder().id(o.getId()).buyerId(o.getBuyerId())
            .totalAmount(visibleTotal).status(o.getStatus()).items(items)
            .createdAt(o.getCreatedAt()).updatedAt(o.getUpdatedAt()).build();
    }
}
