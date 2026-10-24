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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    // Lấy toàn bộ danh sách đơn hàng (ADMIN)
    @Transactional(readOnly = true)
    public Page<OrderResponse> findAll(Integer currentPage, Integer pageSize, OrderStatus orderStatus) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(currentPage - 1, pageSize, sort);
        if (orderStatus == null) {
            Page<Order> orders = orderRepository.findByIsDeleted(false, pageable);
            return orders.map(orderMapper::toOrderResponse);
        }
        Page<Order> orders = orderRepository.findByIsDeletedAndOrderStatus(false, orderStatus, pageable);
        return orders.map(orderMapper::toOrderResponse);
    }

    // Lấy danh sách đơn hàng của người dùng
    @Transactional(readOnly = true)
    public Page<OrderResponse> findAllByUser(Integer currentPage, Integer pageSize, OrderStatus orderStatus) {
        // Lấy thông tin người dùng
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userPrincipal.getUser();
        // Phân trang
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(currentPage - 1, pageSize, sort);
        if (orderStatus == null) {
            return orderRepository.findByIsDeletedAndUser(false, user, pageable)
                    .map(orderMapper::toOrderResponse);
        }
        return orderRepository.findByIsDeletedAndUserAndOrderStatus(false, user, orderStatus, pageable)
                .map(orderMapper::toOrderResponse);
    }

    // Chi tiết đơn hàng
    @Transactional(readOnly = true)
    public List<OrderItemResponse> getOrderDetail(Long id) {
        // Lấy thông tin người dùng
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userPrincipal.getUser();
        boolean isAdmin = user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
        Order order = isAdmin
                ? orderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"))
                : orderRepository.findByIdAndUser(id, user).orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));
        List<OrderItem> orderItems = orderItemRepository.findByOrder(order);
        return orderMapper.toOrderItemResponseList(orderItems);
    }

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
                .shippingAmount(SHIPPING_AMOUNT)
                .finalAmount(totalAmount.add(SHIPPING_AMOUNT))
                .delivery(userDelivery)
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
                .note(request.note())
                .build();
        order = orderRepository.save(order);

        // Trừ tồn kho & lưu OrderItem
        Order finalOrder = order;
        List<OrderItem> orderItems = request.items().stream().map(item -> {
            Product product = productMap.get(item.productId());
            if (Boolean.TRUE.equals(product.getIsDeleted())) {
                throw new ResourceNotFoundException("Sản phẩm không tồn tại");
            }
            inventoryService.decreaseStock(item.productId(), item.quantity());
            return OrderItem.builder()
                    .order(finalOrder)
                    .product(product)
                    .quantity(item.quantity())
                    .unitPrice(product.getPrice())
                    .totalAmount(product.getPrice().multiply(BigDecimal.valueOf(item.quantity())))
                    .build();
        }).toList();
        orderItems = orderItemRepository.saveAll(orderItems);
        finalOrder.setOrderItems(orderItems);

        return orderMapper.toOrderResponse(finalOrder);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderUpdateStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));
        OrderStatus newStatus = OrderStatus.valueOf(request.status());
        if (newStatus.equals(OrderStatus.CANCELLED)) {
            return cancelOrderInternal(order);
        }
        order.setOrderStatus(newStatus);
        orderRepository.save(order);
        return orderMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrder(Long id) {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userPrincipal.getUser();
        boolean isAdmin = user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
        Order order = isAdmin
                ? orderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"))
                : orderRepository.findByIdAndUser(id, user).orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));
        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Đơn hàng đã hủy trước đó");
        }
        if (!isAdmin && order.getOrderStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể hủy đơn hàng đang ở trạng thái chờ xác nhận");
        }
        return cancelOrderInternal(order);
    }

    private OrderResponse cancelOrderInternal(Order order) {
        order.setOrderStatus(OrderStatus.CANCELLED);
        List<OrderItem> orderItems = orderItemRepository.findByOrder(order);
        // Hoàn trả số lượng
        orderItems.forEach(item -> inventoryService.increaseStock(
                item.getProduct().getId(),
                item.getQuantity()
        ));
        order = orderRepository.save(order);
        return orderMapper.toOrderResponse(order);
    }
}
