package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.exception.InsufficientStockException;
import com.example.ecomerce_backend.exception.ResourceNotFoundException;
import com.example.ecomerce_backend.model.dto.request.CartItemRequest;
import com.example.ecomerce_backend.model.dto.response.CartResponse;
import com.example.ecomerce_backend.model.entity.*;
import com.example.ecomerce_backend.model.mapper.CatalogMapper;
import com.example.ecomerce_backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {
    private static final Long USER_ID = 7L;
    private static final Long PRODUCT_ID = 1L;

    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private UserRepository userRepository;

    private CartService cartService;
    private final Cart cart = Cart.builder().id(1L).build();
    private final Product product = Product.builder().id(PRODUCT_ID).name("SP 1").price(new BigDecimal("100000")).build();

    @BeforeEach
    void setUp() {
        cartService = new CartService(cartRepository, cartItemRepository, productRepository,
                inventoryRepository, userRepository, new CatalogMapper());
        lenient().when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));
    }

    private void givenStock(int quantity) {
        Inventory inventory = Inventory.builder().product(product).quantity(quantity).reservedQuantity(0).build();
        lenient().when(inventoryRepository.findByProductId(PRODUCT_ID)).thenReturn(Optional.of(inventory));
        lenient().when(inventoryRepository.findByProductIdIn(any())).thenReturn(List.of(inventory));
    }

    private CartItem item(int quantity) {
        return CartItem.builder().id(1L).cart(cart).product(product).quantity(quantity).build();
    }

    @Test
    void addItem_newProduct_createsLine() {
        givenStock(10);
        when(productRepository.findActiveById(PRODUCT_ID)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(1L, PRODUCT_ID)).thenReturn(Optional.empty());
        CartItem saved = item(3);
        when(cartItemRepository.findByCartId(1L)).thenReturn(List.of(saved));

        CartResponse response = cartService.addItem(USER_ID, PRODUCT_ID, 3);

        verify(cartItemRepository).save(any(CartItem.class));
        assertEquals(3, response.totalQuantity());
        assertEquals(0, new BigDecimal("300000").compareTo(response.totalAmount()));
    }

    @Test
    void addItem_existingProduct_accumulatesQuantity() {
        givenStock(10);
        CartItem existing = item(4);
        when(productRepository.findActiveById(PRODUCT_ID)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(1L, PRODUCT_ID)).thenReturn(Optional.of(existing));
        when(cartItemRepository.findByCartId(1L)).thenReturn(List.of(existing));

        cartService.addItem(USER_ID, PRODUCT_ID, 3);

        assertEquals(7, existing.getQuantity());
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void addItem_overStock_isRejectedAndCartUnchanged() {
        givenStock(5);
        CartItem existing = item(4);
        when(productRepository.findActiveById(PRODUCT_ID)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(1L, PRODUCT_ID)).thenReturn(Optional.of(existing));

        assertThrows(InsufficientStockException.class, () -> cartService.addItem(USER_ID, PRODUCT_ID, 2));
        assertEquals(4, existing.getQuantity());
    }

    @Test
    void addItem_unknownOrHiddenProduct_isNotFound() {
        when(productRepository.findActiveById(PRODUCT_ID)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> cartService.addItem(USER_ID, PRODUCT_ID, 1));
    }

    @Test
    void updateItem_setsExactQuantityWithinStock() {
        givenStock(10);
        CartItem existing = item(4);
        when(productRepository.findActiveById(PRODUCT_ID)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(1L, PRODUCT_ID)).thenReturn(Optional.of(existing));
        when(cartItemRepository.findByCartId(1L)).thenReturn(List.of(existing));

        cartService.updateItem(USER_ID, PRODUCT_ID, 2);

        assertEquals(2, existing.getQuantity());
    }

    @Test
    void updateItem_overStock_isRejected() {
        givenStock(3);
        when(productRepository.findActiveById(PRODUCT_ID)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(1L, PRODUCT_ID)).thenReturn(Optional.of(item(1)));

        assertThrows(InsufficientStockException.class, () -> cartService.updateItem(USER_ID, PRODUCT_ID, 4));
    }

    @Test
    void removeItem_notInCart_isNotFound() {
        when(cartItemRepository.findByCartIdAndProductId(1L, PRODUCT_ID)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> cartService.removeItem(USER_ID, PRODUCT_ID));
    }

    @Test
    void getCart_dropsLinesOfHiddenProducts() {
        Product hidden = Product.builder().id(2L).name("Đã ẩn").price(BigDecimal.TEN).isDeleted(true).build();
        CartItem stale = CartItem.builder().id(2L).cart(cart).product(hidden).quantity(1).build();
        givenStock(10);
        when(cartItemRepository.findByCartId(1L)).thenReturn(new ArrayList<>(List.of(item(2), stale)));

        CartResponse response = cartService.getCart(USER_ID);

        assertEquals(1, response.items().size());
        verify(cartItemRepository).deleteAll(List.of(stale));
    }

    @Test
    void sync_mergesDuplicatesAndCapsAtStock() {
        givenStock(5);
        when(productRepository.findActiveById(PRODUCT_ID)).thenReturn(Optional.of(product));
        CartItem existing = item(2);
        when(cartItemRepository.findByCartIdAndProductId(1L, PRODUCT_ID)).thenReturn(Optional.of(existing));
        when(cartItemRepository.findByCartId(1L)).thenReturn(List.of(existing));

        // client gửi 2 dòng cùng sản phẩm: 2 + 3 = 5, cộng với 2 sẵn có = 7 -> chặn ở tồn kho 5
        cartService.sync(USER_ID, List.of(new CartItemRequest(PRODUCT_ID, 2), new CartItemRequest(PRODUCT_ID, 3)));

        assertEquals(5, existing.getQuantity());
    }

    @Test
    void sync_skipsHiddenAndOutOfStockProducts() {
        when(productRepository.findActiveById(PRODUCT_ID)).thenReturn(Optional.empty());
        when(productRepository.findActiveById(2L)).thenReturn(Optional.of(Product.builder().id(2L).name("Hết hàng").build()));
        when(inventoryRepository.findByProductId(2L)).thenReturn(Optional.of(
                Inventory.builder().quantity(0).reservedQuantity(0).build()));
        when(cartItemRepository.findByCartId(1L)).thenReturn(List.of());

        CartResponse response = cartService.sync(USER_ID,
                List.of(new CartItemRequest(PRODUCT_ID, 1), new CartItemRequest(2L, 1)));

        assertTrue(response.items().isEmpty());
        verify(cartItemRepository, never()).save(any());
    }
}
