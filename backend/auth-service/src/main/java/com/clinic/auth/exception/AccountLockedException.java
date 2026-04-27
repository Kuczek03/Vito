package com.clinic.auth.exception;

public class AccountLockedException extends RuntimeException {
    public AccountLockedException(String message) { super(message); }
}
