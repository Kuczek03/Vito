package com.clinic.medical.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "medical_staff")
public class MedicalStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    // nick użytkownika – wyświetlany przy wyborze lekarza w formularzu wizyty
    @Column(unique = true, length = 64)
    private String username;

    @Column(nullable = false, length = 512)
    private String firstName;

    @Column(nullable = false, length = 512)
    private String lastName;

    @Column(length = 128)
    private String specialization;

    @Column(unique = true, length = 64)
    private String licenseNumber;
}
