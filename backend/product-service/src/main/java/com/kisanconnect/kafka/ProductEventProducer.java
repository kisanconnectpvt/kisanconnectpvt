package com.kisanconnect.kafka;
import com.kisanconnect.entity.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component @RequiredArgsConstructor @Slf4j
public class ProductEventProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final String TOPIC = "product-events";

    public void publishProductCreated(Product p) { send("PRODUCT_CREATED", p); }
    public void publishProductUpdated(Product p) { send("PRODUCT_UPDATED", p); }

    private void send(String eventType, Product p) {
        Map<String, Object> event = Map.of(
            "eventType", eventType, "productId", p.getId().toString(),
            "farmerId", p.getFarmerId().toString(), "name", p.getName(),
            "scale", p.getScale().name(), "price", p.getPrice(), "stockQty", p.getStockQty());
        try {
            kafkaTemplate.send(TOPIC, p.getId().toString(), event);
            log.info("Published {} for productId={}", eventType, p.getId());
        } catch (Exception e) { log.warn("Kafka unavailable: {}", e.getMessage()); }
    }
}
