package com.anmory.yunji.common;

import lombok.Data;

@Data
public class Result<T> {

    /**
     * 响应状态码
     */
    private Integer code;

    /**
     * 响应消息
     */
    private String message;

    /**
     * 业务错误键，供前端映射友好文案
     */
    private String errorCode;

    /**
     * 响应数据
     */
    private T data;

    /**
     * 时间戳
     */
    private Long timestamp;

    /**
     * 成功响应（无数据）
     */
    public static <T> Result<T> success() {
        return success(null, "操作成功");
    }

    /**
     * 成功响应（带数据）
     */
    public static <T> Result<T> success(T data) {
        return success(data, "操作成功");
    }

    /**
     * 成功响应（带数据和消息）
     */
    public static <T> Result<T> success(T data, String message) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage(message);
        result.setErrorCode(null);
        result.setData(data);
        result.setTimestamp(System.currentTimeMillis());
        return result;
    }

    /**
     * 失败响应
     */
    public static <T> Result<T> error(String message) {
        return error(500, message);
    }

    /**
     * 失败响应（带状态码）
     */
    public static <T> Result<T> error(Integer code, String message) {
        return error(code, null, message, null);
    }

    public static <T> Result<T> error(Integer code, String errorCode, String message) {
        return error(code, errorCode, message, null);
    }

    public static <T> Result<T> error(Integer code, String errorCode, String message, T data) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setErrorCode(errorCode);
        result.setMessage(message);
        result.setData(data);
        result.setTimestamp(System.currentTimeMillis());
        return result;
    }

    /**
     * 判断是否成功
     */
    public boolean isSuccess() {
        return code != null && code == 200;
    }
}
