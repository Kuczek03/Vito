package com.clinic.medical.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NurseNotesRequest {

    @NotBlank
    @Size(max = 2000, message = "Notatki nie mogą przekraczać 2000 znaków.")
    private String notes;
}
