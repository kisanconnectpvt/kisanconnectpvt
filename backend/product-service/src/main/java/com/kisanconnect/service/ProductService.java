package com.kisanconnect.service;
import com.kisanconnect.dto.ProductDto.*;
import com.kisanconnect.entity.Product;
import com.kisanconnect.kafka.ProductEventProducer;
import com.kisanconnect.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class ProductService {
    private final ProductRepository repo;
    private final ProductEventProducer eventProducer;

    @Transactional
    public ProductResponse create(UUID farmerId, CreateRequest req) {
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
        return repo.search(scaleEnum, category, categoryLower, keywordPattern).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProductResponse> listByFarmer(UUID farmerId) {
        return repo.findByFarmerIdAndStatus(farmerId, "ACTIVE").stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ProductResponse getById(UUID id) {
        return toResponse(repo.findById(id).orElseThrow(() -> new RuntimeException("Product not found: " + id)));
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
