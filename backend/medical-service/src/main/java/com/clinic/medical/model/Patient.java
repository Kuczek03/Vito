package com.clinic.medical.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false, length = 512)
    private String firstName;

    @Column(nullable = false, length = 512)
    private String lastName;

    @Column(nullable = false, unique = true, length = 512)
    private String pesel;

    @Column(nullable = false, unique = true, length = 128)
    private String peselHash;

    @Column(length = 512)
    private String phoneNumber;

    private Instant createdAt;
}
