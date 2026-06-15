package com.kisanconnect.kafka;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component @Slf4j
public class NotificationConsumer {

    @KafkaListener(topics="user-events", groupId="kisan-notification-group")
    public void handleUserEvent(Map<String, Object> event) {
        String type = (String) event.get("eventType");
        log.info("[NOTIFICATION] user-events: {}", type);
        if ("USER_REGISTERED".equals(type)) {
            log.info("[EMAIL] Welcome to KisanConnect, {}! ({}). Role: {}",
                event.get("name"), event.get("email"), event.get("role"));
        }
    }

    @KafkaListener(topics="order-events", groupId="kisan-notification-group")
    public void handleOrderEvent(Map<String, Object> event) {
        String type = (String) event.get("eventType");
        log.info("[NOTIFICATION] order-events: {}", type);
        switch (type) {
            case "ORDER_CREATED" ->
                log.info("[SMS] Your order #{} placed. Total: Rs.{}", event.get("orderId"), event.get("totalAmount"));
            case "ORDER_STATUS_UPDATED" ->
                log.info("[PUSH] Order #{} status: {}", event.get("orderId"), event.get("status"));
        }
    }

    @KafkaListener(topics="product-events", groupId="kisan-notification-group")
    public void handleProductEvent(Map<String, Object> event) {
        String type = (String) event.get("eventType");
        log.info("[NOTIFICATION] product-events: {}", type);
        if ("PRODUCT_CREATED".equals(type))
            log.info("[EMAIL] New product listed: '{}'. Notifying buyers.", event.get("name"));
    }
}
