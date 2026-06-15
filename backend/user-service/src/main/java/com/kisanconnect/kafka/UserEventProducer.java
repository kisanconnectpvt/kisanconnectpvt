package com.kisanconnect.kafka;

import com.kisanconnect.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component @RequiredArgsConstructor @Slf4j
public class UserEventProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final String TOPIC = "user-events";

    public void publishUserRegistered(User user) {
        Map<String, Object> event = Map.of(
            "eventType", "USER_REGISTERED",
            "userId",    user.getId().toString(),
            "name",      user.getName(),
            "email",     user.getEmail(),
            "role",      user.getRole().name()
        );
        try {
            kafkaTemplate.send(TOPIC, user.getId().toString(), event);
            log.info("Published USER_REGISTERED for userId={}", user.getId());
        } catch (Exception e) {
            log.warn("Kafka unavailable, skipping event publish: {}", e.getMessage());
        }
    }
}
