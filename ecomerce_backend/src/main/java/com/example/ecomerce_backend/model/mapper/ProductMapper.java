package com.example.ecomerce_backend.model.mapper;

import com.example.ecomerce_backend.model.dto.response.ProductResponse;
import com.example.ecomerce_backend.model.entity.Product;
import com.example.ecomerce_backend.model.entity.ProductImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ProductMapper {
    @Mapping(source = "productImages", target = "images")
    @Mapping(target = "thumbnailUrl", expression = "java(mapThumbnail(product))")
    ProductResponse toProductResponse(Product product);

    default String mapThumbnail(Product product) {
        if (product == null || product.getProductImages() == null || product.getProductImages().isEmpty()) {
            return null;
        }
        return product.getProductImages().stream()
                .filter(img -> !Boolean.TRUE.equals(img.getIsDeleted()))
                .findFirst()
                .map(ProductImage::getUrl)
                .orElse(null);
    }
}
