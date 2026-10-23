package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.constants.OrderStatus;
import com.example.ecomerce_backend.model.dto.response.DashboardSummaryResponse;
import com.example.ecomerce_backend.model.entity.Order;
import com.example.ecomerce_backend.repository.InventoryRepository;
import com.example.ecomerce_backend.repository.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${app.low-stock-threshold:5}")
    private int lowStockThreshold;

    /** Kết quả gom nhóm theo trạng thái: số đơn và tổng tiền của các đơn đó. */
    record StatusAggregate(OrderStatus status, long count, BigDecimal amount) {
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        List<StatusAggregate> aggregates = loadStatusAggregates();
        long ordersToday = countOrdersSince(startOfTodayInServerTime());
        long totalProducts = productRepository.countActive();
        // Tái sử dụng truy vấn cảnh báo kho: chỉ cần tổng số bản ghi nên lấy trang 1 phần tử
        long lowStock = inventoryRepository.findLowStock(lowStockThreshold, PageRequest.of(0, 1)).getTotalElements();
        long outOfStock = inventoryRepository.findLowStock(1, PageRequest.of(0, 1)).getTotalElements();
        return buildSummary(aggregates, ordersToday, totalProducts, lowStock, outOfStock, lowStockThreshold);
    }

    static DashboardSummaryResponse buildSummary(
            List<StatusAggregate> aggregates, long ordersToday, long totalProducts,
            long lowStock, long outOfStock, int threshold
    ) {
        Map<OrderStatus, Long> byStatus = new EnumMap<>(OrderStatus.class);
        for (OrderStatus status : OrderStatus.values()) {
            byStatus.put(status, 0L);
        }
        long totalOrders = 0;
        BigDecimal revenue = BigDecimal.ZERO;
        for (StatusAggregate aggregate : aggregates) {
            byStatus.merge(aggregate.status(), aggregate.count(), Long::sum);
            totalOrders += aggregate.count();
            if (aggregate.status() == OrderStatus.COMPLETED && aggregate.amount() != null) {
                revenue = revenue.add(aggregate.amount());
            }
        }
        return new DashboardSummaryResponse(totalOrders, ordersToday, byStatus, revenue,
                totalProducts, lowStock, outOfStock, threshold);
    }

    private List<StatusAggregate> loadStatusAggregates() {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Object[]> query = cb.createQuery(Object[].class);
        Root<Order> root = query.from(Order.class);
        query.multiselect(root.get("orderStatus"), cb.count(root), cb.sum(root.<BigDecimal>get("finalAmount")))
                .where(cb.isFalse(root.<Boolean>get("isDeleted")))
                .groupBy(root.get("orderStatus"));
        return entityManager.createQuery(query).getResultList().stream()
                .map(row -> new StatusAggregate(
                        (OrderStatus) row[0],
                        ((Number) row[1]).longValue(),
                        row[2] == null ? BigDecimal.ZERO : (BigDecimal) row[2]))
                .toList();
    }

    private long countOrdersSince(LocalDateTime since) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<Order> root = query.from(Order.class);
        query.select(cb.count(root)).where(
                cb.isFalse(root.<Boolean>get("isDeleted")),
                cb.greaterThanOrEqualTo(root.<LocalDateTime>get("createdAt"), since));
        return entityManager.createQuery(query).getSingleResult();
    }

    /**
     * 00:00 hôm nay theo giờ Việt Nam, quy đổi sang múi giờ của JVM
     * (createdAt được lưu theo giờ máy chủ, container Docker thường chạy UTC).
     */
    private LocalDateTime startOfTodayInServerTime() {
        return LocalDate.now(BUSINESS_ZONE).atStartOfDay(BUSINESS_ZONE)
                .withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
    }
}
