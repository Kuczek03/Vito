package com.clinic.auth.exception;

public class PwnedPasswordException extends RuntimeException {
    public PwnedPasswordException(String message) { super(message); }
}
