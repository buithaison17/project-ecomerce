package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.constants.OrderStatus;
import com.example.ecomerce_backend.constants.PaymentMethod;
import com.example.ecomerce_backend.constants.PaymentStatus;
import com.example.ecomerce_backend.exception.BadRequestException;
import com.example.ecomerce_backend.exception.InsufficientStockException;
import com.example.ecomerce_backend.exception.ResourceNotFoundException;
import com.example.ecomerce_backend.model.dto.request.CreateOrderItemRequest;
import com.example.ecomerce_backend.model.dto.request.CreateOrderRequest;
import com.example.ecomerce_backend.model.dto.request.OrderUpdateStatusRequest;
import com.example.ecomerce_backend.model.dto.response.OrderItemResponse;
import com.example.ecomerce_backend.model.dto.response.OrderResponse;
import com.example.ecomerce_backend.model.entity.*;
import com.example.ecomerce_backend.model.mapper.OrderMapper;
import com.example.ecomerce_backend.repository.InventoryRepository;
import com.example.ecomerce_backend.repository.OrderItemRepository;
import com.example.ecomerce_backend.repository.OrderRepository;
import com.example.ecomerce_backend.repository.UserDeliveryRepository;
import com.example.ecomerce_backend.security.principal.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final InventoryService inventoryService;
    private final InventoryRepository inventoryRepository;
    private final BigDecimal SHIPPING_AMOUNT = BigDecimal.valueOf(20000);
    private final UserDeliveryRepository userDeliveryRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderMapper orderMapper;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        // Lấy thông tin người dùng
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userPrincipal.getUser();
        // Lấy tồn kho
        List<Inventory> inventories = request.items().stream().map(item ->
                inventoryRepository.findByProductId(item.productId())
                        .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"))
        ).toList();
        // Tạo map product
        Map<Long, Product> productMap = inventories.stream()
                .collect(Collectors.toMap(
                        inventory -> inventory.getProduct().getId(),
                        Inventory::getProduct));
        Map<Long, Integer> quantityMap = request.items().stream()
                .collect(Collectors.toMap(
                        CreateOrderItemRequest::productId,
                        CreateOrderItemRequest::quantity));
        // Kiểm tra tồn kho
        for (Inventory inventory : inventories) {
            if (inventory.getQuantity() < quantityMap.get(inventory.getProduct().getId())) {
                throw new InsufficientStockException("Số lượng sản phẩm không đủ");
            }
        }
        // Tính tổng tiền
        BigDecimal totalAmount = productMap.values().stream()
                .map(product -> product.getPrice().multiply(BigDecimal.valueOf(quantityMap.get(product.getId()))))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        // Lấy địa chỉ nhận hàng
        UserDelivery userDelivery = userDeliveryRepository.findByIdAndUser(request.deliveryId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("Địa chỉ nhận hàng không tồn tại"));
        PaymentMethod paymentMethod = PaymentMethod.valueOf(request.paymentMethod().toUpperCase());
        PaymentStatus paymentStatus = null;

        if (paymentMethod.equals(PaymentMethod.CASH)) {
            paymentStatus = PaymentStatus.PENDING;
        } else if (paymentMethod.equals(PaymentMethod.CREDIT_CARD)) {
            paymentStatus = PaymentStatus.COMPLETED;
        }
        // Tạo order
        Order order = Order.builder()
                .totalAmount(totalAmount)
                .user(user)
                .totalAmount(totalAmount)
                .shippingAmount(SHIPPING_AMOUNT)
                .finalAmount(totalAmount.add(SHIPPING_AMOUNT))
                .delivery(userDelivery)
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
                .note(request.note())
                .build();
        Order finalOrder = orderRepository.save(order);
        // Tạo danh sách order item
        List<OrderItem> orderItems = request.items().stream().map(item -> {
                    // Trừ tồn kho
                    inventoryService.decreaseStock(item.productId(), item.quantity());
                    return OrderItem.builder()
                            .order(finalOrder)
                            .product(productMap.get(item.productId()))
                            .quantity(item.quantity())
                            .unitPrice(productMap.get(item.productId()).getPrice())
                            .totalAmount(productMap.get(item.productId()).getPrice().multiply(BigDecimal.valueOf(item.quantity())))
                            .build();
                }
        ).toList();
        List<OrderItem> finalOrderItems = orderItemRepository.saveAll(orderItems);
        // Tạo response
        List<OrderItemResponse> orderItemResponses = orderMapper.toOrderItemResponseList(finalOrderItems);
        return orderMapper.toOrderResponse(finalOrder, orderItemResponses);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderUpdateStatusRequest request) {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userPrincipal.getUser();
        Order order = orderRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));
        order.setOrderStatus(OrderStatus.valueOf(request.status()));
        List<OrderItem> orderItems = orderItemRepository.findByOrder(order);
        orderRepository.save(order);
        if (order.getOrderStatus().equals(OrderStatus.CANCELLED)) {
            return cancelOrder(id);
        }
        List<OrderItemResponse> orderItemResponses = orderMapper.toOrderItemResponseList(orderItems);
        return orderMapper.toOrderResponse(order, orderItemResponses);
    }

    @Transactional
    public OrderResponse cancelOrder(Long id) {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userPrincipal.getUser();
        Order order = orderRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));
        if (order.getOrderStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Đơn hàng không thể hủy");
        }
        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Đơn hàng đã hủy trước đó");
        }
        order.setOrderStatus(OrderStatus.CANCELLED);
        List<OrderItem> orderItems = orderItemRepository.findByOrder(order);
        // Hoàn trả số lượng
        orderItems.forEach(item -> inventoryService.increaseStock(
                item.getProduct().getId(),
                item.getQuantity()
        ));
        orderRepository.save(order);
        List<OrderItemResponse> orderItemResponses = orderMapper.toOrderItemResponseList(orderItems);
        return orderMapper.toOrderResponse(order, orderItemResponses);
    }
}
