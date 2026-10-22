package com.example.ecomerce_backend.model.mapper;

import com.example.ecomerce_backend.model.dto.response.UserDeliveryResponse;
import com.example.ecomerce_backend.model.dto.response.UserRegisterResponse;
import com.example.ecomerce_backend.model.dto.response.UserResponse;
import com.example.ecomerce_backend.model.dto.response.UserInformationResponse;
import com.example.ecomerce_backend.model.entity.User;
import com.example.ecomerce_backend.model.entity.UserDelivery;
import com.example.ecomerce_backend.model.entity.UserInformation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(source = "role.name", target = "role")
    UserResponse toUserResponse(User user);

    UserInformationResponse toUserInformationResponse(UserInformation userInformation);

    @Mapping(source = "user", target = "user")
    @Mapping(source = "userInformation", target = "userInformation")
    UserRegisterResponse mapToUserRegisterResponse(User user, UserInformation userInformation);

    UserDeliveryResponse toUserDeliveryResponse(UserDelivery userDelivery);

    List<UserDeliveryResponse> toUserDeliveryResponseList(List<UserDelivery> userDeliveries);
}