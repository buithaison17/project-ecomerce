package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.constants.OrderStatus;
import com.example.ecomerce_backend.constants.PaymentStatus;
import com.example.ecomerce_backend.exception.BadRequestException;
import com.example.ecomerce_backend.exception.ResourceNotFoundException;
import com.example.ecomerce_backend.model.dto.request.CheckoutRequest;
import com.example.ecomerce_backend.model.dto.response.OrderDetailResponse;
import com.example.ecomerce_backend.model.dto.response.OrderSummaryResponse;
import com.example.ecomerce_backend.model.dto.response.PageResponse;
import com.example.ecomerce_backend.model.entity.*;
import com.example.ecomerce_backend.model.mapper.OrderMapper;
import com.example.ecomerce_backend.repository.*;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {
    private static final int MAX_PAGE_SIZE = 100;

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final UserDeliveryRepository userDeliveryRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;
    private final PaymentService paymentService;
    private final OrderMapper orderMapper;

    // Phí vận chuyển cố định (VND). SRS chưa quy định nên mặc định 0, đổi bằng app.shipping-fee.
    @Value("${app.shipping-fee:0}")
    private long shippingFee;

    // ------------------------------------------------------------------ Checkout

    /**
     * Đặt hàng từ giỏ hàng trong MỘT transaction: kiểm tra + trừ kho, mô phỏng thanh toán, tạo đơn, xóa giỏ.
     * Bất kỳ bước nào ném RuntimeException (hết hàng, thẻ bị từ chối...) đều rollback toàn bộ:
     * không có đơn nào được tạo, tồn kho không bị trừ và giỏ hàng được giữ nguyên.
     */
    @Transactional
    public OrderDetailResponse checkout(Long userId, CheckoutRequest request) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Giỏ hàng đang trống"));
        List<CartItem> cartItems = new ArrayList<>(cartItemRepository.findByCartId(cart.getId()));
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Giỏ hàng đang trống");
        }
        // Luôn khóa kho theo thứ tự productId tăng dần để hai đơn đồng thời không bị deadlock
        cartItems.sort(Comparator.comparing(item -> item.getProduct().getId()));

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            if (Boolean.TRUE.equals(product.getIsDeleted())) {
                throw new BadRequestException("Sản phẩm \"" + product.getName() + "\" không còn được bán, vui lòng xóa khỏi giỏ hàng");
            }
            totalAmount = totalAmount.add(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }
        BigDecimal shippingAmount = BigDecimal.valueOf(shippingFee);
        BigDecimal finalAmount = totalAmount.add(shippingAmount);

        // 1) Kiểm tra lại và trừ tồn kho (khóa dòng, ném InsufficientStockException nếu thiếu hàng)
        for (CartItem cartItem : cartItems) {
            inventoryService.decreaseStock(cartItem.getProduct().getId(), cartItem.getQuantity());
        }
        // 2) Mô phỏng thanh toán (ném PaymentFailedException nếu thẻ test bị từ chối)
        PaymentStatus paymentStatus = paymentService.process(request.paymentMethod(), request.cardNumber(), finalAmount);

        // 3) Tạo đơn hàng + chi tiết đơn (giá được chốt tại thời điểm đặt)
        User user = userRepository.getReferenceById(userId);
        UserDelivery delivery = userDeliveryRepository.save(UserDelivery.builder()
                .user(user)
                .receiverName(request.receiverName().trim())
                .phoneNumber(request.phoneNumber().trim())
                .address(request.address().trim())
                .build());
        Order order = Order.builder()
                .user(user)
                .delivery(delivery)
                .totalAmount(totalAmount)
                .shippingAmount(shippingAmount)
                .finalAmount(finalAmount)
                .paymentMethod(request.paymentMethod())
                .paymentStatus(paymentStatus)
                .note(request.note())
                .build();
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            order.getItems().add(OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .unitPrice(product.getPrice())
                    .totalAmount(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())))
                    .build());
        }
        order = orderRepository.save(order);

        // 4) Xóa giỏ hàng
        cartItemRepository.deleteAll(cartItems);

        log.info("Đặt hàng thành công orderId={} userId={} số dòng={} tổng={} thanh toán={}/{}",
                order.getId(), userId, cartItems.size(), finalAmount, request.paymentMethod(), paymentStatus);
        return orderMapper.toDetail(order);
    }

    // ------------------------------------------------------------------ Khách hàng

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> listMyOrders(Long userId, OrderStatus status, int page, int size) {
        return search(userId, status, null, null, page, size);
    }

    /** Chi tiết đơn của chính mình. Đơn của người khác trả 404 để không lộ sự tồn tại của đơn. */
    @Transactional(readOnly = true)
    public OrderDetailResponse getMyOrder(Long userId, Long orderId) {
        Order order = findActive(orderId);
        if (!order.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy đơn hàng id=" + orderId);
        }
        return orderMapper.toDetail(order);
    }

    // ------------------------------------------------------------------ Admin

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> listAllOrders(
            OrderStatus status, LocalDate fromDate, LocalDate toDate, int page, int size
    ) {
        return search(null, status, fromDate, toDate, page, size);
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse getOrder(Long orderId) {
        return orderMapper.toDetail(findActive(orderId));
    }

    // ------------------------------------------------------------------ helpers

    private PageResponse<OrderSummaryResponse> search(
            Long userId, OrderStatus status, LocalDate fromDate, LocalDate toDate, int page, int size
    ) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc");
        }
        // Mới nhất trước; id làm tiêu chí phụ để phân trang ổn định
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"));
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE), sort);
        Page<Order> result = orderRepository.findAll(buildSpecification(userId, status, fromDate, toDate), pageRequest);
        return PageResponse.from(result, orderMapper::toSummary);
    }

    private Specification<Order> buildSpecification(
            Long userId, OrderStatus status, LocalDate fromDate, LocalDate toDate
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.<Boolean>get("isDeleted")));
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("orderStatus"), status));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get("createdAt"), fromDate.atStartOfDay()));
            }
            if (toDate != null) {
                // Bao gồm cả ngày kết thúc: createdAt < đầu ngày hôm sau
                predicates.add(cb.lessThan(root.<LocalDateTime>get("createdAt"), toDate.plusDays(1).atStartOfDay()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Order findActive(Long orderId) {
        return orderRepository.findById(orderId)
                .filter(order -> !Boolean.TRUE.equals(order.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng id=" + orderId));
    }
}
