package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.constants.PaymentMethod;
import com.example.ecomerce_backend.constants.PaymentStatus;
import com.example.ecomerce_backend.exception.BadRequestException;
import com.example.ecomerce_backend.exception.PaymentFailedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Cổng mô phỏng thanh toán (Mock Payment Gateway). Không gọi hệ thống bên ngoài;
 * kết quả được quyết định bởi số thẻ test để QA có thể kiểm thử cả kịch bản thành công lẫn thất bại.
 */
@Slf4j
@Service
public class PaymentService {
    public static final String CARD_SUCCESS = "4242424242424242";
    public static final String CARD_DECLINED = "4000000000000002";
    public static final String CARD_INSUFFICIENT_FUNDS = "4000000000009995";
    public static final String CARD_EXPIRED = "4000000000000069";

    /**
     * @return PENDING với COD (thu tiền khi nhận hàng), PAID khi thẻ test thành công.
     * @throws PaymentFailedException thẻ bị từ chối theo kịch bản -> giao dịch đặt hàng bị rollback
     * @throws BadRequestException    thiếu hoặc sai số thẻ test
     */
    public PaymentStatus process(PaymentMethod method, String cardNumber, BigDecimal amount) {
        if (method == PaymentMethod.COD) {
            return PaymentStatus.PENDING;
        }
        String digits = cardNumber == null ? "" : cardNumber.replaceAll("[\\s-]", "");
        if (digits.isEmpty()) {
            throw new BadRequestException("Vui lòng nhập số thẻ test để thanh toán bằng thẻ");
        }
        String masked = "****" + digits.substring(Math.max(0, digits.length() - 4));
        if (digits.equals(CARD_SUCCESS)) {
            log.info("Thanh toán mô phỏng thành công thẻ {} số tiền {}", masked, amount);
            return PaymentStatus.PAID;
        }
        if (digits.equals(CARD_DECLINED)) {
            throw fail(masked, amount, "Thẻ bị từ chối");
        }
        if (digits.equals(CARD_INSUFFICIENT_FUNDS)) {
            throw fail(masked, amount, "Thẻ không đủ số dư");
        }
        if (digits.equals(CARD_EXPIRED)) {
            throw fail(masked, amount, "Thẻ đã hết hạn");
        }
        throw new BadRequestException("Số thẻ test không hợp lệ");
    }

    private PaymentFailedException fail(String maskedCard, BigDecimal amount, String reason) {
        log.warn("Thanh toán mô phỏng thất bại thẻ {} số tiền {}: {}", maskedCard, amount, reason);
        return new PaymentFailedException("Thanh toán thất bại: " + reason);
    }
}
