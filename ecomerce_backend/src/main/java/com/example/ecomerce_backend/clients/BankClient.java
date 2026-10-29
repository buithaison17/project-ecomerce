package com.example.ecomerce_backend.clients;

import com.example.ecomerce_backend.model.dto.response.ListBankResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "bank", url = "https://api.vietqr.io/v2/banks")
public interface BankClient {
    @GetMapping
    ListBankResponse getAllBank();
}
