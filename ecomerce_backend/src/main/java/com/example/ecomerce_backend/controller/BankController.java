package com.example.ecomerce_backend.controller;

import com.example.ecomerce_backend.clients.BankClient;
import com.example.ecomerce_backend.model.dto.response.ListBankResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/banks")
@RequiredArgsConstructor
public class BankController {
    private final BankClient bankClient;

    @GetMapping
    public ResponseEntity<ListBankResponse> getAllBank() {
        return new ResponseEntity<>(bankClient.getAllBank(), HttpStatus.OK);
    }
}
