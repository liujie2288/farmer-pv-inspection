package com.yldlxj.pv.inspect.common.exception;

import com.yldlxj.pv.inspect.auth.SecurityUtils;
import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.user.SysUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.servlet.http.HttpServletRequest;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private String requestInfo(HttpServletRequest request) {
        SysUser user = SecurityUtils.getCurrentUser();
        String userId = user != null ? String.valueOf(user.getId()) : "-";
        String username = user != null ? user.getUsername() : "-";
        return String.format("method=%s, uri=%s, ip=%s, userId=%s, username=%s", request.getMethod(), request.getRequestURI(), request.getRemoteAddr(), userId, username);
    }

    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBusinessException(BusinessException e, HttpServletRequest request) {
        log.warn("业务异常: {} ", requestInfo(request), e);
        return ApiResponse.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(UnauthorizedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleUnauthorizedException(UnauthorizedException e, HttpServletRequest request) {
        log.warn("鉴权失败: {}", requestInfo(request), e);
        return ApiResponse.error(401, e.getMessage());
    }

    @ExceptionHandler(ForbiddenException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleForbiddenException(ForbiddenException e, HttpServletRequest request) {
        log.warn("权限不足: {}", requestInfo(request), e);
        return ApiResponse.error(403, e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleException(Exception e, HttpServletRequest request) {
        log.error("未处理异常 | {}", requestInfo(request), e);
        return ApiResponse.error(500, "服务器内部错误");
    }
}
