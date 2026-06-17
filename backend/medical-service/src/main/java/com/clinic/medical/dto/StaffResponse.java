package com.clinic.medical.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class StaffResponse {
    private Long   id;
    private Long   userId;
    private String username;
    private String firstName;
    private String lastName;
    private String specialization;
    private String licenseNumber;
}
