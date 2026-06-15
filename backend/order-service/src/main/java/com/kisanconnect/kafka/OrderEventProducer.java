package com.kisanconnect.kafka;
import com.kisanconnect.entity.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component @RequiredArgsConstructor @Slf4j
public class OrderEventProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final String TOPIC = "order-events";

    public void publishOrderCreated(Order o)       { send("ORDER_CREATED", o); }
    public void publishOrderStatusUpdated(Order o) { send("ORDER_STATUS_UPDATED", o); }

    private void send(String eventType, Order o) {
        Map<String, Object> event = Map.of(
            "eventType", eventType, "orderId", o.getId().toString(),
            "buyerId", o.getBuyerId().toString(), "totalAmount", o.getTotalAmount(),
            "status", o.getStatus().name());
        try {
            kafkaTemplate.send(TOPIC, o.getId().toString(), event);
            log.info("Published {} for orderId={}", eventType, o.getId());
        } catch (Exception e) { log.warn("Kafka unavailable: {}", e.getMessage()); }
    }
}
