package com.example.ecomerce_backend.model.mapper;

import com.example.ecomerce_backend.model.dto.response.OrderDetailResponse;
import com.example.ecomerce_backend.model.dto.response.OrderItemResponse;
import com.example.ecomerce_backend.model.dto.response.OrderSummaryResponse;
import com.example.ecomerce_backend.model.entity.Order;
import com.example.ecomerce_backend.model.entity.OrderItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OrderMapper {
    private final CatalogMapper catalogMapper;

    public OrderSummaryResponse toSummary(Order order) {
        return new OrderSummaryResponse(
                order.getId(),
                order.getOrderStatus(),
                order.getPaymentMethod(),
                order.getPaymentStatus(),
                order.getFinalAmount(),
                order.getDelivery().getReceiverName(),
                order.getUser().getId(),
                order.getUser().getUsername(),
                order.getUser().getEmail(),
                order.getCreatedAt()
        );
    }

    public OrderDetailResponse toDetail(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .sorted(Comparator.comparing(OrderItem::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toItem)
                .toList();
        return new OrderDetailResponse(
                order.getId(),
                order.getOrderStatus(),
                order.getPaymentMethod(),
                order.getPaymentStatus(),
                order.getDelivery().getReceiverName(),
                order.getDelivery().getPhoneNumber(),
                order.getDelivery().getAddress(),
                order.getNote(),
                items,
                order.getTotalAmount(),
                order.getShippingAmount(),
                order.getFinalAmount(),
                order.getUser().getId(),
                order.getUser().getUsername(),
                order.getUser().getEmail(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    private OrderItemResponse toItem(OrderItem item) {
        return new OrderItemResponse(
                item.getProduct().getId(),
                item.getProduct().getName(),
                catalogMapper.thumbnailUrl(item.getProduct()),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotalAmount()
        );
    }
}
