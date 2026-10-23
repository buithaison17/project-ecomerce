package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.constants.OrderStatus;
import com.example.ecomerce_backend.constants.PaymentMethod;
import com.example.ecomerce_backend.constants.PaymentStatus;
import com.example.ecomerce_backend.exception.BadRequestException;
import com.example.ecomerce_backend.exception.InsufficientStockException;
import com.example.ecomerce_backend.exception.PaymentFailedException;
import com.example.ecomerce_backend.exception.ResourceNotFoundException;
import com.example.ecomerce_backend.model.dto.request.CheckoutRequest;
import com.example.ecomerce_backend.model.dto.response.OrderDetailResponse;
import com.example.ecomerce_backend.model.entity.*;
import com.example.ecomerce_backend.model.mapper.CatalogMapper;
import com.example.ecomerce_backend.model.mapper.OrderMapper;
import com.example.ecomerce_backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    private static final Long USER_ID = 7L;

    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private UserDeliveryRepository userDeliveryRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private InventoryService inventoryService;

    private OrderService orderService;
    private final Cart cart = Cart.builder().id(1L).build();
    private final User user = User.builder().id(USER_ID).username("congdt").email("cong@example.com").build();

    @BeforeEach
    void setUp() {
        orderService = new OrderService(cartRepository, cartItemRepository, orderRepository,
                userDeliveryRepository, userRepository, inventoryService, new PaymentService(),
                new OrderMapper(new CatalogMapper()));
        ReflectionTestUtils.setField(orderService, "shippingFee", 30000L);
    }

    private CartItem cartItem(long productId, String price, int quantity) {
        Product product = Product.builder().id(productId).name("SP " + productId).price(new BigDecimal(price)).build();
        return CartItem.builder().id(productId).cart(cart).product(product).quantity(quantity).build();
    }

    private CheckoutRequest request(PaymentMethod method, String card) {
        return new CheckoutRequest("Nguyễn Văn A", "0912345678", "1 Đường ABC, Hà Nội", method, card, null);
    }

    /** Dựng các mock cần cho một lần checkout đi đến bước tạo đơn. */
    private void givenCart(CartItem... items) {
        when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartId(1L)).thenReturn(List.of(items));
    }

    private void givenPersistence() {
        when(userRepository.getReferenceById(USER_ID)).thenReturn(user);
        when(userDeliveryRepository.save(any(UserDelivery.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void checkout_withoutCart_isBadRequest() {
        when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class, () -> orderService.checkout(USER_ID, request(PaymentMethod.COD, null)));
    }

    @Test
    void checkout_emptyCart_isBadRequest() {
        givenCart();
        assertThrows(BadRequestException.class, () -> orderService.checkout(USER_ID, request(PaymentMethod.COD, null)));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void checkout_cod_createsPendingOrderDeductsStockAndClearsCart() {
        CartItem a = cartItem(2L, "100000", 2);
        CartItem b = cartItem(1L, "50000", 1);
        givenCart(a, b);
        givenPersistence();

        OrderDetailResponse response = orderService.checkout(USER_ID, request(PaymentMethod.COD, null));

        assertEquals(OrderStatus.PENDING, response.orderStatus());
        assertEquals(PaymentStatus.PENDING, response.paymentStatus());
        assertEquals(0, new BigDecimal("250000").compareTo(response.totalAmount()));
        assertEquals(0, new BigDecimal("30000").compareTo(response.shippingAmount()));
        assertEquals(0, new BigDecimal("280000").compareTo(response.finalAmount()));
        assertEquals(2, response.items().size());
        assertEquals("Nguyễn Văn A", response.receiverName());
        verify(inventoryService).decreaseStock(2L, 2);
        verify(inventoryService).decreaseStock(1L, 1);
        verify(cartItemRepository).deleteAll(anyList());
    }

    @Test
    void checkout_locksInventoryInAscendingProductIdOrder() {
        givenCart(cartItem(5L, "10000", 1), cartItem(3L, "10000", 1), cartItem(9L, "10000", 1));
        givenPersistence();

        orderService.checkout(USER_ID, request(PaymentMethod.COD, null));

        ArgumentCaptor<Long> ids = ArgumentCaptor.forClass(Long.class);
        verify(inventoryService, times(3)).decreaseStock(ids.capture(), anyInt());
        assertEquals(List.of(3L, 5L, 9L), ids.getAllValues());
    }

    @Test
    void checkout_mockCardSuccess_marksOrderPaid() {
        givenCart(cartItem(1L, "100000", 1));
        givenPersistence();

        OrderDetailResponse response = orderService.checkout(USER_ID,
                request(PaymentMethod.MOCK_CARD, PaymentService.CARD_SUCCESS));

        assertEquals(PaymentStatus.PAID, response.paymentStatus());
        assertEquals(OrderStatus.PENDING, response.orderStatus());
    }

    @Test
    void checkout_insufficientStock_propagatesAndCreatesNoOrder() {
        givenCart(cartItem(1L, "100000", 5));
        doThrow(new InsufficientStockException("hết hàng")).when(inventoryService).decreaseStock(1L, 5);

        assertThrows(InsufficientStockException.class,
                () -> orderService.checkout(USER_ID, request(PaymentMethod.COD, null)));

        verify(orderRepository, never()).save(any());
        verify(cartItemRepository, never()).deleteAll(anyList());
    }

    @Test
    void checkout_cardDeclined_throwsAndCreatesNoOrderNorClearsCart() {
        givenCart(cartItem(1L, "100000", 1));

        assertThrows(PaymentFailedException.class, () -> orderService.checkout(USER_ID,
                request(PaymentMethod.MOCK_CARD, PaymentService.CARD_DECLINED)));

        verify(orderRepository, never()).save(any());
        verify(userDeliveryRepository, never()).save(any());
        verify(cartItemRepository, never()).deleteAll(anyList());
    }

    @Test
    void checkout_productHiddenAfterAddedToCart_isRejectedBeforeTouchingStock() {
        CartItem item = cartItem(1L, "100000", 1);
        item.getProduct().setIsDeleted(true);
        givenCart(item);

        assertThrows(BadRequestException.class, () -> orderService.checkout(USER_ID, request(PaymentMethod.COD, null)));
        verify(inventoryService, never()).decreaseStock(anyLong(), anyInt());
    }

    @Test
    void getMyOrder_ofAnotherUser_isNotFound() {
        User other = User.builder().id(99L).build();
        Order order = Order.builder().id(10L).user(other).build();
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        assertThrows(ResourceNotFoundException.class, () -> orderService.getMyOrder(USER_ID, 10L));
    }

    @Test
    void getOrder_deletedOrder_isNotFound() {
        Order order = Order.builder().id(10L).user(user).isDeleted(true).build();
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        assertThrows(ResourceNotFoundException.class, () -> orderService.getOrder(10L));
    }

    @Test
    void listAllOrders_fromAfterTo_isBadRequest() {
        assertThrows(BadRequestException.class, () -> orderService.listAllOrders(null,
                java.time.LocalDate.of(2026, 10, 20), java.time.LocalDate.of(2026, 10, 1), 0, 10));
    }

    // ------------------------------------------------------------ cập nhật trạng thái (admin)

    private Order order(OrderStatus status, PaymentMethod method, PaymentStatus paymentStatus, OrderItem... items) {
        Order order = Order.builder()
                .id(10L)
                .user(user)
                .delivery(UserDelivery.builder().receiverName("A").phoneNumber("0912345678").address("HN").build())
                .totalAmount(BigDecimal.ZERO).shippingAmount(BigDecimal.ZERO).finalAmount(BigDecimal.ZERO)
                .paymentMethod(method)
                .paymentStatus(paymentStatus)
                .orderStatus(status)
                .build();
        order.getItems().addAll(List.of(items));
        return order;
    }

    private OrderItem orderItem(long productId, int quantity) {
        Product product = Product.builder().id(productId).name("SP " + productId).build();
        return OrderItem.builder().id(productId).product(product).quantity(quantity)
                .unitPrice(BigDecimal.TEN).totalAmount(BigDecimal.TEN).build();
    }

    private void givenOrder(Order order) {
        when(orderRepository.findWithLockById(10L)).thenReturn(Optional.of(order));
    }

    @Test
    void updateStatus_followsLifecycleStepByStep() {
        Order order = order(OrderStatus.PENDING, PaymentMethod.MOCK_CARD, PaymentStatus.PAID, orderItem(1L, 1));
        givenOrder(order);

        assertEquals(OrderStatus.PROCESSING, orderService.updateStatus(10L, OrderStatus.PROCESSING).orderStatus());
        assertEquals(OrderStatus.SHIPPING, orderService.updateStatus(10L, OrderStatus.SHIPPING).orderStatus());
        assertEquals(OrderStatus.COMPLETED, orderService.updateStatus(10L, OrderStatus.COMPLETED).orderStatus());
        verify(inventoryService, never()).increaseStock(anyLong(), anyInt());
    }

    @Test
    void updateStatus_skippingAStep_isRejected() {
        givenOrder(order(OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.PENDING, orderItem(1L, 1)));
        assertThrows(BadRequestException.class, () -> orderService.updateStatus(10L, OrderStatus.SHIPPING));
        assertThrows(BadRequestException.class, () -> orderService.updateStatus(10L, OrderStatus.COMPLETED));
    }

    @Test
    void updateStatus_goingBackwards_isRejected() {
        givenOrder(order(OrderStatus.SHIPPING, PaymentMethod.COD, PaymentStatus.PENDING, orderItem(1L, 1)));
        assertThrows(BadRequestException.class, () -> orderService.updateStatus(10L, OrderStatus.PENDING));
    }

    @Test
    void updateStatus_sameStatus_isRejected() {
        givenOrder(order(OrderStatus.PROCESSING, PaymentMethod.COD, PaymentStatus.PENDING, orderItem(1L, 1)));
        assertThrows(BadRequestException.class, () -> orderService.updateStatus(10L, OrderStatus.PROCESSING));
    }

    @Test
    void updateStatus_cancel_restocksEveryLineInProductIdOrder() {
        Order order = order(OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.PENDING,
                orderItem(9L, 3), orderItem(2L, 5), orderItem(4L, 1));
        givenOrder(order);

        OrderDetailResponse response = orderService.updateStatus(10L, OrderStatus.CANCELLED);

        assertEquals(OrderStatus.CANCELLED, response.orderStatus());
        org.mockito.InOrder inOrder = inOrder(inventoryService);
        inOrder.verify(inventoryService).increaseStock(2L, 5);
        inOrder.verify(inventoryService).increaseStock(4L, 1);
        inOrder.verify(inventoryService).increaseStock(9L, 3);
    }

    @Test
    void updateStatus_cancelFromProcessingAndShipping_isAllowed() {
        for (OrderStatus from : new OrderStatus[]{OrderStatus.PROCESSING, OrderStatus.SHIPPING}) {
            givenOrder(order(from, PaymentMethod.COD, PaymentStatus.PENDING, orderItem(1L, 2)));
            assertEquals(OrderStatus.CANCELLED, orderService.updateStatus(10L, OrderStatus.CANCELLED).orderStatus());
        }
        verify(inventoryService, times(2)).increaseStock(1L, 2);
    }

    @Test
    void updateStatus_finalStates_cannotChangeAndNeverRestockTwice() {
        givenOrder(order(OrderStatus.CANCELLED, PaymentMethod.COD, PaymentStatus.PENDING, orderItem(1L, 2)));
        assertThrows(BadRequestException.class, () -> orderService.updateStatus(10L, OrderStatus.CANCELLED));
        assertThrows(BadRequestException.class, () -> orderService.updateStatus(10L, OrderStatus.PROCESSING));

        givenOrder(order(OrderStatus.COMPLETED, PaymentMethod.COD, PaymentStatus.PAID, orderItem(1L, 2)));
        assertThrows(BadRequestException.class, () -> orderService.updateStatus(10L, OrderStatus.CANCELLED));
        verify(inventoryService, never()).increaseStock(anyLong(), anyInt());
    }

    @Test
    void updateStatus_completingCodOrder_marksPaymentPaid() {
        Order order = order(OrderStatus.SHIPPING, PaymentMethod.COD, PaymentStatus.PENDING, orderItem(1L, 1));
        givenOrder(order);

        OrderDetailResponse response = orderService.updateStatus(10L, OrderStatus.COMPLETED);

        assertEquals(PaymentStatus.PAID, response.paymentStatus());
    }

    @Test
    void updateStatus_unknownOrDeletedOrder_isNotFound() {
        when(orderRepository.findWithLockById(10L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> orderService.updateStatus(10L, OrderStatus.PROCESSING));

        Order deleted = order(OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.PENDING);
        deleted.setIsDeleted(true);
        givenOrder(deleted);
        assertThrows(ResourceNotFoundException.class, () -> orderService.updateStatus(10L, OrderStatus.PROCESSING));
    }
}
