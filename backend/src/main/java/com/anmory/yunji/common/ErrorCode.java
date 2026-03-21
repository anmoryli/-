package com.anmory.yunji.common;

public enum ErrorCode {
    BAD_REQUEST(400, "BAD_REQUEST"),
    UNAUTHORIZED(401, "UNAUTHORIZED"),
    FORBIDDEN(403, "FORBIDDEN"),
    NOT_FOUND(404, "NOT_FOUND"),
    CONFLICT(409, "CONFLICT"),
    VALIDATION_ERROR(422, "VALIDATION_ERROR"),
    AI_SERVICE_ERROR(520, "AI_SERVICE_ERROR"),
    FILE_PROCESS_ERROR(521, "FILE_PROCESS_ERROR"),
    INTERNAL_ERROR(500, "INTERNAL_ERROR");

    private final int code;
    private final String key;

    ErrorCode(int code, String key) {
        this.code = code;
        this.key = key;
    }

    public int code() {
        return code;
    }

    public String key() {
        return key;
    }
}

