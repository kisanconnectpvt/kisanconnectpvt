package com.kisanconnect.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.kisanconnect.entity.Order;
import com.kisanconnect.entity.OrderItem;
import com.kisanconnect.kafka.OrderEventProducer;
import com.kisanconnect.repository.OrderRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.client.RestTemplate;

class OrderServiceTest {
    private OrderRepository repository;
    private OrderService service;

    @BeforeEach
    void setUp() {
        repository = mock(OrderRepository.class);
        service = new OrderService(repository, mock(OrderEventProducer.class), mock(RestTemplate.class));
    }

    @Test
    void deniesOrderReadToUnrelatedBuyer() {
        Order order = orderOwnedBy(UUID.randomUUID());
        when(repository.findById(order.getId())).thenReturn(Optional.of(order));

        assertThrows(AccessDeniedException.class,
                () -> service.getById(order.getId(), UUID.randomUUID(), "BUYER"));
    }

    @Test
    void deniesFarmerStatusChangeWhenOrderContainsAnotherFarmersItems() {
        Order order = orderOwnedBy(UUID.randomUUID());
        OrderItem otherFarmersItem = OrderItem.builder().farmerId(UUID.randomUUID()).build();
        order.setItems(List.of(order.getItems().get(0), otherFarmersItem));
        when(repository.findById(order.getId())).thenReturn(Optional.of(order));

        assertThrows(AccessDeniedException.class,
                () -> service.updateStatus(order.getId(), "CONFIRMED", UUID.randomUUID(), "FARMER"));
    }

    private Order orderOwnedBy(UUID buyerId) {
        OrderItem item = OrderItem.builder().farmerId(UUID.randomUUID()).productId(UUID.randomUUID())
                .quantity(BigDecimal.ONE).unitPrice(BigDecimal.TEN).scale("SMALL").build();
        Order order = Order.builder().id(UUID.randomUUID()).buyerId(buyerId)
                .totalAmount(BigDecimal.TEN).status(Order.OrderStatus.PENDING).items(List.of(item)).build();
        item.setOrder(order);
        return order;
    }
}