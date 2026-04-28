package com.clinic.medical.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class PatientResponse {
    private Long   id;
    private Long   userId;
    private String firstName;
    private String lastName;
    private String pesel;
    private String phoneNumber;
}
