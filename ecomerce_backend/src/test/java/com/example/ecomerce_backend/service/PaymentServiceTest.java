package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.constants.PaymentMethod;
import com.example.ecomerce_backend.constants.PaymentStatus;
import com.example.ecomerce_backend.exception.BadRequestException;
import com.example.ecomerce_backend.exception.PaymentFailedException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class PaymentServiceTest {
    private final PaymentService paymentService = new PaymentService();
    private static final BigDecimal AMOUNT = new BigDecimal("100000");

    @Test
    void cod_isPendingAndIgnoresCardNumber() {
        assertEquals(PaymentStatus.PENDING, paymentService.process(PaymentMethod.COD, null, AMOUNT));
    }

    @Test
    void mockCard_successCard_isPaid() {
        assertEquals(PaymentStatus.PAID,
                paymentService.process(PaymentMethod.MOCK_CARD, PaymentService.CARD_SUCCESS, AMOUNT));
    }

    @Test
    void mockCard_acceptsSpacesAndDashes() {
        assertEquals(PaymentStatus.PAID,
                paymentService.process(PaymentMethod.MOCK_CARD, "4242 4242-4242 4242", AMOUNT));
    }

    @Test
    void mockCard_declinedScenarios_throwPaymentFailed() {
        for (String card : new String[]{PaymentService.CARD_DECLINED,
                PaymentService.CARD_INSUFFICIENT_FUNDS, PaymentService.CARD_EXPIRED}) {
            assertThrows(PaymentFailedException.class,
                    () -> paymentService.process(PaymentMethod.MOCK_CARD, card, AMOUNT));
        }
    }

    @Test
    void mockCard_missingOrUnknownCard_isBadRequest() {
        assertThrows(BadRequestException.class, () -> paymentService.process(PaymentMethod.MOCK_CARD, null, AMOUNT));
        assertThrows(BadRequestException.class, () -> paymentService.process(PaymentMethod.MOCK_CARD, "  ", AMOUNT));
        assertThrows(BadRequestException.class, () -> paymentService.process(PaymentMethod.MOCK_CARD, "1234567812345678", AMOUNT));
    }
}
