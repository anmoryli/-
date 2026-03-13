package com.anmory.yunji.exception;

public class BusinessException extends RuntimeException {
    private final Integer code;
    private final String errorCode;

    public BusinessException(String message) {
        this(400, null, message);
    }

    public BusinessException(Integer code, String errorCode, String message) {
        super(message);
        this.code = code;
        this.errorCode = errorCode;
    }

    public Integer getCode() {
        return code;
    }

    public String getErrorCode() {
        return errorCode;
    }
}