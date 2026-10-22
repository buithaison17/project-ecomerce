package com.example.ecomerce_backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.example.ecomerce_backend.exception.BadRequestException;
import com.example.ecomerce_backend.exception.ImageStorageException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImageStorageServiceTest {
    @Mock
    private Cloudinary cloudinary;
    @Mock
    private Uploader uploader;

    private ImageStorageService service;

    @BeforeEach
    void setUp() {
        service = new ImageStorageService(cloudinary);
        ReflectionTestUtils.setField(service, "cloudName", "demo");
        ReflectionTestUtils.setField(service, "folder", "ecommerce/products");
    }

    private MockMultipartFile image(String contentType) {
        return new MockMultipartFile("file", "a.jpg", contentType, new byte[]{1, 2, 3});
    }

    @Test
    void upload_returnsSecureUrlAndPublicId() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(), anyMap())).thenReturn(Map.of(
                "secure_url", "https://res.cloudinary.com/demo/image/upload/v1/ecommerce/products/abc.jpg",
                "public_id", "ecommerce/products/abc"));

        ImageStorageService.StoredImage stored = service.upload(image("image/jpeg"));

        assertEquals("https://res.cloudinary.com/demo/image/upload/v1/ecommerce/products/abc.jpg", stored.url());
        assertEquals("ecommerce/products/abc", stored.publicId());
    }

    @Test
    void upload_rejectsEmptyFile() {
        MockMultipartFile empty = new MockMultipartFile("file", "a.jpg", "image/jpeg", new byte[0]);
        assertThrows(BadRequestException.class, () -> service.upload(empty));
        verifyNoInteractions(cloudinary);
    }

    @Test
    void upload_rejectsNonImageContentType() {
        assertThrows(BadRequestException.class, () -> service.upload(image("application/pdf")));
        assertThrows(BadRequestException.class, () -> service.upload(image(null)));
        verifyNoInteractions(cloudinary);
    }

    @Test
    void upload_withoutCloudinaryConfig_failsWithClearMessage() {
        ReflectionTestUtils.setField(service, "cloudName", "");
        ImageStorageException e = assertThrows(ImageStorageException.class, () -> service.upload(image("image/png")));
        assertTrue(e.getMessage().contains("CLOUDINARY"));
        verifyNoInteractions(cloudinary);
    }

    @Test
    void upload_whenCloudinaryFails_wrapsInImageStorageException() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(), anyMap())).thenThrow(new IOException("network down"));
        assertThrows(ImageStorageException.class, () -> service.upload(image("image/webp")));
    }

    @Test
    void upload_whenCloudinaryRejects_wrapsRuntimeException() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(), anyMap())).thenThrow(new RuntimeException("Invalid Signature"));
        assertThrows(ImageStorageException.class, () -> service.upload(image("image/png")));
    }

    @Test
    void delete_callsDestroyWithPublicId() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        service.delete("ecommerce/products/abc");
        verify(uploader).destroy(eq("ecommerce/products/abc"), anyMap());
    }

    @Test
    void delete_ignoresMissingPublicId() {
        service.delete(null);
        service.delete("  ");
        verifyNoInteractions(cloudinary);
    }

    @Test
    void delete_swallowsCloudinaryErrors() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.destroy(any(), anyMap())).thenThrow(new IOException("boom"));
        assertDoesNotThrow(() -> service.delete("ecommerce/products/abc"));
    }
}
