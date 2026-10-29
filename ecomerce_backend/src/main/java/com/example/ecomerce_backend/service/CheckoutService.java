package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.constants.PaymentStatus;
import com.example.ecomerce_backend.exception.CheckoutException;
import com.example.ecomerce_backend.exception.ResourceNotFoundException;
import com.example.ecomerce_backend.model.dto.request.CreateOrderRequest;
import com.example.ecomerce_backend.model.dto.response.CreateCheckoutResponse;
import com.example.ecomerce_backend.model.dto.response.OrderResponse;
import com.example.ecomerce_backend.model.entity.Transaction;
import com.example.ecomerce_backend.repository.OrderRepository;
import com.example.ecomerce_backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.exception.NotFoundException;
import vn.payos.model.v1.payouts.PayoutRequests;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;
import vn.payos.model.webhooks.WebhookData;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class CheckoutService {
    private final OrderService orderService;
    private final PayOS payOS;
    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;
    private static final AtomicLong ORDER_CODE_GENERATOR =
            new AtomicLong(System.currentTimeMillis() / 1000);
    @Value("${frontend.url}")
    private String frontendUrl;

    private long generateOrderCode() {
        return ORDER_CODE_GENERATOR.incrementAndGet();
    }

    @Transactional
    public CreateCheckoutResponse handleCheckoutOrder(CreateOrderRequest request) {
        try {
            // Tạo đơn hàng
            OrderResponse orderResponse = orderService.createOrder(request);
            // Tạo mã thanh toán
            Long orderCode = generateOrderCode();
            CreatePaymentLinkRequest createPaymentLinkRequest = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(orderResponse.finalAmount().longValue())
                    .description("Thanh toán đơn hàng " + orderResponse.id())
                    .returnUrl(frontendUrl + "/checkout/success")
                    .cancelUrl("")
                    .expiredAt(Instant.now().plus(Duration.ofMinutes(10)).getEpochSecond()) // Hết hạn trong 10 phút
                    .build();
            CreatePaymentLinkResponse createPaymentLinkResponse = payOS.paymentRequests().create(createPaymentLinkRequest);
            // Tạo giao dịch
            Transaction transaction = Transaction.builder()
                    .orderCode(orderCode)
                    .order(orderRepository.findById(orderResponse.id()).get())
                    .paymentLinkId(createPaymentLinkResponse.getPaymentLinkId())
                    .status(createPaymentLinkResponse.getStatus())
                    .build();
            transactionRepository.save(transaction);
            return new CreateCheckoutResponse(
                    orderResponse.id(),
                    orderCode,
                    createPaymentLinkResponse.getCheckoutUrl(),
                    createPaymentLinkResponse.getPaymentLinkId(),
                    createPaymentLinkResponse.getStatus(),
                    createPaymentLinkResponse.getQrCode()
            );
        } catch (RuntimeException e) {
            throw new CheckoutException("Đã xảy ra lỗi khi thanh toán");
        }
    }

    @Transactional
    public void cancelCheckout(Long orderId) {
//        try {
        Transaction transaction = transactionRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch không tồn tại"));
        // Hoàn kho
        orderService.cancelOrder(transaction.getOrder());
        // Cập nhật trạng thái thanh toán
        transaction.getOrder().setPaymentStatus(PaymentStatus.CANCELLED);
        // Cập nhập giao dịch
        transaction.setStatus(PaymentLinkStatus.CANCELLED);
        // Hoàn tiền
        refund(transaction);
//        } catch (Exception e) {
//        throw new CheckoutException("Đã xảy ra lỗi khi hủy thanh toán");
//        }
    }

    @Transactional
    public void handleWebHook(Object object) {
        try {
            WebhookData webhookData = payOS.webhooks().verify(object);
            log.info("{}", webhookData.getOrderCode());
            Transaction transaction = transactionRepository.findByOrderCode(webhookData.getOrderCode())
                    .orElseThrow(() -> new NotFoundException("Đã xảy ra lỗi khi thanh toán"));
//         Lưu thông tin để hoàn tiền khi cần
            if (!webhookData.getReference().isBlank()) {
                String reference = webhookData.getReference();
                transaction.setReference(reference);
            }
            if (!webhookData.getCounterAccountNumber().isBlank()) {
                String accountNumber = webhookData.getCounterAccountNumber();
                transaction.setAccountNumber(accountNumber);
            }

            // Kiểm tra mã trạng thái
            if (!webhookData.getCode().equals("00")) {
                throw new CheckoutException("Giao dịch không thành công với mã code " + webhookData.getCode());
            }
            // Kiểm tra xem đơn hàng đã được xử lý chức tránh trùng lặp
            if (transaction.getStatus() == PaymentLinkStatus.PAID) {
                // Cập nhật trạng thái giao dịch và lưu vào database
                transaction.setStatus(PaymentLinkStatus.PAID);
                transaction.getOrder().setPaymentStatus(PaymentStatus.COMPLETED);
            }
        } catch (Exception e) {
            throw new CheckoutException("Đã xảy ra lỗi khi thanh toán vui lòng thử lại");
        }
    }

    public void refund(Transaction transaction) {
//        try {
        PayoutRequests payoutRequests = PayoutRequests.builder()
                .amount(transaction.getOrder().getFinalAmount().longValue())
                .description("Hoàn tiền cho đơn hàng " + transaction.getOrder().getId())
                .toBin(transaction.getBankBin())
                .referenceId(transaction.getReference())
                .toAccountNumber(transaction.getAccountNumber())
                .build();
        payOS.payouts().create(payoutRequests);
//        } catch (Exception e) {
//            throw new CheckoutException("Đã xảy ra lỗi khi hoàn tiền vui lòng thử lại");
//        }
    }
}
