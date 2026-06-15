package com.kisanconnect.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Render provides DATABASE_URL as postgres://user:pass@host:port/db
 * Spring Boot needs  jdbc:postgresql://host:port/db
 * This config converts the URL automatically.
 */
@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:#{null}}")
    private String renderDatabaseUrl;

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        DataSourceProperties props = new DataSourceProperties();
        if (renderDatabaseUrl != null && renderDatabaseUrl.startsWith("postgres://")) {
            // Convert: postgres://user:pass@host:port/db
            //      to: jdbc:postgresql://host:port/db
            String withoutScheme = renderDatabaseUrl.substring("postgres://".length());
            String[] userAndRest = withoutScheme.split("@", 2);
            String hostAndDb = userAndRest.length > 1 ? userAndRest[1] : withoutScheme;
            props.setUrl("jdbc:postgresql://" + hostAndDb);
            if (userAndRest.length > 1) {
                String[] credentials = userAndRest[0].split(":", 2);
                props.setUsername(credentials[0]);
                if (credentials.length > 1) props.setPassword(credentials[1]);
            }
        }
        return props;
    }
}
