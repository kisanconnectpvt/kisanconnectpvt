package com.kisanconnect.service;
import com.kisanconnect.dto.ProductDto.*;
import com.kisanconnect.entity.Product;
import com.kisanconnect.kafka.ProductEventProducer;
import com.kisanconnect.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
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
public class ProductService {
    private final ProductRepository repo;
    private final ProductEventProducer eventProducer;
    private final RestTemplate restTemplate;

    @Value("${user.service.url:${USER_SERVICE_URL:http://localhost:8081}}")
    private String userServiceUrl;

    @Value("${internal.api-key:}")
    private String internalApiKey;

    @Transactional
    public ProductResponse create(UUID farmerId, CreateRequest req) {
        ensureFarmerHasAddress(farmerId);
        Product p = Product.builder().farmerId(farmerId).name(req.getName())
            .description(req.getDescription()).category(req.getCategory())
            .scale(req.getScale()).price(req.getPrice()).unit(req.getUnit())
            .stockQty(req.getStockQty()).imageUrl(req.getImageUrl()).status("ACTIVE").build();
        p = repo.save(p);
        eventProducer.publishProductCreated(p);
        return toResponse(p);
    }

    public List<ProductResponse> listAll(String scale, String category, String keyword) {
        Product.Scale scaleEnum = scale != null ? Product.Scale.valueOf(scale.toUpperCase()) : null;
        String categoryLower = category != null ? category.toLowerCase() : null;
        String keywordPattern = keyword != null ? "%" + keyword.toLowerCase() + "%" : null;
        return repo.search(scaleEnum, categoryLower, keywordPattern).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void decreaseStock(UUID productId, BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        Product product = repo.findById(productId).orElseThrow(() -> new RuntimeException("Product not found: " + productId));
        BigDecimal currentStock = product.getStockQty() == null ? BigDecimal.ZERO : product.getStockQty();

        if (currentStock.compareTo(quantity) < 0) {
            throw new RuntimeException("Insufficient stock for product: " + productId);
        }

        product.setStockQty(currentStock.subtract(quantity));
        repo.save(product);
        eventProducer.publishProductUpdated(product);
    }

    public List<ProductResponse> listByFarmer(UUID farmerId) {
        return repo.findByFarmerIdAndStatus(farmerId, "ACTIVE").stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ProductResponse getById(UUID id) {
        return toResponse(repo.findById(id).orElseThrow(() -> new RuntimeException("Product not found: " + id)));
    }

    private void ensureFarmerHasAddress(UUID farmerId) {
        try {
            String url = userServiceUrl + "/api/v1/users/internal/" + farmerId;
            @SuppressWarnings("unchecked")
                HttpHeaders headers = new HttpHeaders();
                headers.set("X-Internal-Api-Key", internalApiKey);
                Map<String, Object> user = restTemplate.exchange(url, HttpMethod.GET,
                    new HttpEntity<>(headers), Map.class).getBody();
            if (user == null || !"FARMER".equals(user.get("role")) || !hasAddress(user)) {
                throw new RuntimeException("Farmer address is required before creating a product listing.");
            }
        } catch (RestClientException ex) {
            throw new RuntimeException("Unable to validate farmer address with user service.", ex);
        }
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
    public ProductResponse update(UUID id, UUID farmerId, UpdateRequest req) {
        Product p = repo.findById(id).orElseThrow(() -> new RuntimeException("Product not found: " + id));
        if (!p.getFarmerId().equals(farmerId)) throw new RuntimeException("Not authorized to update this product");
        if (req.getName()        != null) p.setName(req.getName());
        if (req.getDescription() != null) p.setDescription(req.getDescription());
        if (req.getCategory()    != null) p.setCategory(req.getCategory());
        if (req.getScale()       != null) p.setScale(req.getScale());
        if (req.getPrice()       != null) p.setPrice(req.getPrice());
        if (req.getUnit()        != null) p.setUnit(req.getUnit());
        if (req.getStockQty()    != null) p.setStockQty(req.getStockQty());
        if (req.getImageUrl()    != null) p.setImageUrl(req.getImageUrl());
        if (req.getStatus()      != null) p.setStatus(req.getStatus());
        p = repo.save(p);
        eventProducer.publishProductUpdated(p);
        return toResponse(p);
    }

    @Transactional
    public void delete(UUID id, UUID farmerId) {
        Product p = repo.findById(id).orElseThrow(() -> new RuntimeException("Product not found: " + id));
        if (!p.getFarmerId().equals(farmerId)) throw new RuntimeException("Not authorized to delete this product");
        p.setStatus("DELETED");
        repo.save(p);
    }

    private ProductResponse toResponse(Product p) {
        return ProductResponse.builder().id(p.getId()).farmerId(p.getFarmerId())
            .name(p.getName()).description(p.getDescription()).category(p.getCategory())
            .scale(p.getScale()).price(p.getPrice()).unit(p.getUnit()).stockQty(p.getStockQty())
            .imageUrl(p.getImageUrl()).status(p.getStatus())
            .createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt()).build();
    }
}
