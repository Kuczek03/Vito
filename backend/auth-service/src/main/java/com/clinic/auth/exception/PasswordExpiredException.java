package com.clinic.auth.exception;

public class PasswordExpiredException extends RuntimeException {
    public PasswordExpiredException(String message) { super(message); }
}
