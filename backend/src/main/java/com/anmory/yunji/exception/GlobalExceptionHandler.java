package com.anmory.yunji.exception;

import com.anmory.yunji.common.ErrorCode;
import com.anmory.yunji.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.PrintWriter;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static boolean isClientAbort(Throwable t) {
        while (t != null) {
            String msg = t.getMessage();
            if (msg != null && (msg.contains("中止了一个已建立的连接") || msg.contains("Connection reset") || msg.contains("Broken pipe"))) {
                return true;
            }
            if (t.getClass().getName().contains("ClientAbortException")) {
                return true;
            }
            t = t.getCause();
        }
        return false;
    }

    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException ex) {
        int code = ex.getCode() != null ? ex.getCode() : ErrorCode.BAD_REQUEST.code();
        String errorCode = ex.getErrorCode() != null ? ex.getErrorCode() : guessErrorCodeByMessage(ex.getMessage());
        return Result.error(code, errorCode, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidationException(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getDefaultMessage())
                .orElse("参数校验失败");
        return Result.error(ErrorCode.VALIDATION_ERROR.code(), ErrorCode.VALIDATION_ERROR.key(), msg);
    }

    @ExceptionHandler(Throwable.class)
    public Object handleThrowable(Throwable ex, HttpServletRequest request, HttpServletResponse response) {
        // 任何未捕获的异常/错误都打完整堆栈，便于排查 500 无日志
        log.error("[GlobalException] >>> 未捕获异常 Throwable uri={} method={} msg={}", request != null ? request.getRequestURI() : "", request != null ? request.getMethod() : "", ex.getMessage(), ex);
        if (response.isCommitted()) return null;
        return Result.error(ErrorCode.INTERNAL_ERROR.code(), ErrorCode.INTERNAL_ERROR.key(), "系统繁忙，请稍后重试");
    }

    @ExceptionHandler(Exception.class)
    public Object handleException(Exception ex, HttpServletRequest request, HttpServletResponse response) {
        if (isClientAbort(ex)) {
            log.debug("Client aborted connection (e.g. user left during PDF export): {}", ex.getMessage());
            return null;
        }
        if (response.isCommitted()) {
            log.error("[GlobalException] >>> Response 已提交，无法写错误体 msg={}", ex.getMessage(), ex);
            return null;
        }
        String uri = request != null ? request.getRequestURI() : "";
        if (uri != null && (uri.contains("exportPdf") || uri.contains("exportDateRangePdf"))) {
            try {
                response.setStatus(500);
                response.setContentType("text/plain; charset=UTF-8");
                PrintWriter w = response.getWriter();
                w.write("PDF 导出失败，请稍后重试");
                w.flush();
                return null;
            } catch (Exception e) {
                log.warn("Failed to write PDF error response", e);
            }
        }
        log.error("[GlobalException] >>> 未捕获异常 Exception uri={} msg={}", request != null ? request.getRequestURI() : "", ex.getMessage(), ex);
        return Result.error(ErrorCode.INTERNAL_ERROR.code(), ErrorCode.INTERNAL_ERROR.key(), "系统繁忙，请稍后重试");
    }

    private String guessErrorCodeByMessage(String message) {
        if (message == null) return ErrorCode.BAD_REQUEST.key();
        if (message.contains("用户不存在")) return ErrorCode.NOT_FOUND.key();
        if (message.contains("已被使用") || message.contains("已存在") || message.contains("已被绑定")) {
            return ErrorCode.CONFLICT.key();
        }
        if (message.contains("无权限")) return ErrorCode.FORBIDDEN.key();
        if (message.contains("AI")) return ErrorCode.AI_SERVICE_ERROR.key();
        return ErrorCode.BAD_REQUEST.key();
    }
}

