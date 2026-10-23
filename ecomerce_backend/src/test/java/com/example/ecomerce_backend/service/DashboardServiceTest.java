package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.constants.OrderStatus;
import com.example.ecomerce_backend.model.dto.response.DashboardSummaryResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DashboardServiceTest {

    @Test
    void buildSummary_withNoOrders_returnsZerosForEveryStatus() {
        DashboardSummaryResponse summary = DashboardService.buildSummary(List.of(), 0, 0, 0, 0, 5);

        assertEquals(0, summary.totalOrders());
        assertEquals(0, BigDecimal.ZERO.compareTo(summary.totalRevenue()));
        assertEquals(OrderStatus.values().length, summary.ordersByStatus().size());
        summary.ordersByStatus().values().forEach(count -> assertEquals(0L, count));
    }

    @Test
    void buildSummary_revenueCountsOnlyCompletedOrders() {
        List<DashboardService.StatusAggregate> aggregates = List.of(
                new DashboardService.StatusAggregate(OrderStatus.PENDING, 3, new BigDecimal("300000")),
                new DashboardService.StatusAggregate(OrderStatus.COMPLETED, 2, new BigDecimal("500000")),
                new DashboardService.StatusAggregate(OrderStatus.CANCELLED, 1, new BigDecimal("999999")));

        DashboardSummaryResponse summary = DashboardService.buildSummary(aggregates, 4, 10, 2, 1, 5);

        assertEquals(6, summary.totalOrders());
        assertEquals(4, summary.ordersToday());
        assertEquals(0, new BigDecimal("500000").compareTo(summary.totalRevenue()));
        assertEquals(3L, summary.ordersByStatus().get(OrderStatus.PENDING));
        assertEquals(2L, summary.ordersByStatus().get(OrderStatus.COMPLETED));
        assertEquals(1L, summary.ordersByStatus().get(OrderStatus.CANCELLED));
        assertEquals(0L, summary.ordersByStatus().get(OrderStatus.SHIPPING));
        assertEquals(10, summary.totalProducts());
        assertEquals(2, summary.lowStockProducts());
        assertEquals(1, summary.outOfStockProducts());
        assertEquals(5, summary.lowStockThreshold());
    }
}
