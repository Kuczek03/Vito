package com.clinic.medical.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LinkAccountRequest {
    @NotNull
    private Long userId;
}
