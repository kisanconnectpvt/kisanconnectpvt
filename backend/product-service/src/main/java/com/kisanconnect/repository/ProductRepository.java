package com.kisanconnect.repository;
import com.kisanconnect.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByFarmerIdAndStatus(UUID farmerId, String status);
    List<Product> findByStatus(String status);

    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' " +
           "AND (:scale IS NULL OR p.scale = :scale) " +
           "AND (:categoryLower IS NULL OR lower(p.category) = :categoryLower) " +
           "AND (:keyword IS NULL OR lower(p.name) LIKE :keyword)")
    List<Product> search(@Param("scale") Product.Scale scale,
                         @Param("categoryLower") String categoryLower,
                         @Param("keyword") String keyword);
}
