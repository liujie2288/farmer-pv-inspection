package com.yldlxj.pv.inspect.auth;

import com.yldlxj.pv.inspect.auth.dto.ChangePasswordDto;
import com.yldlxj.pv.inspect.auth.dto.LoginDto;
import com.yldlxj.pv.inspect.auth.dto.ResetPasswordDto;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.common.CommonUtils;
import com.yldlxj.pv.inspect.common.annotation.AdminOnly;
import com.yldlxj.pv.inspect.common.annotation.RateLimit;
import com.yldlxj.pv.inspect.common.enums.UserRole;
import com.yldlxj.pv.inspect.common.exception.ForbiddenException;
import com.yldlxj.pv.inspect.common.exception.UnauthorizedException;
import com.yldlxj.pv.inspect.convert.UserConvert;
import com.yldlxj.pv.inspect.user.SysUser;
import com.yldlxj.pv.inspect.user.UserService;
import com.yldlxj.pv.inspect.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MINUTES = 30;

    private final Cache<String, Integer> loginFailCache = Caffeine.newBuilder()
            .expireAfterWrite(LOCK_DURATION_MINUTES, TimeUnit.MINUTES)
            .build();

    @RateLimit(limit = 6)
    @PostMapping("/login")
    public ApiResponse<UserDto> login(@Valid @RequestBody LoginDto loginDto,
                                      HttpServletRequest request,
                                      HttpServletResponse response) {
        String username = loginDto.getUsername();

        Integer failCount = loginFailCache.getIfPresent(username);
        if (failCount != null && failCount >= MAX_LOGIN_ATTEMPTS) {
            return ApiResponse.error(456, "登录失败次数过多，请" + LOCK_DURATION_MINUTES + "分钟后再试");
        }

        SysUser user = userService.findByUsername(username);
        if (user == null || !passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            loginFailCache.put(username, loginFailCache.asMap().getOrDefault(username, 0) + 1);
            log.warn("登录失败: username={}, ip={}", username, request.getRemoteAddr());
            return ApiResponse.error(456, "用户名或密码错误");
        } else if (user.getStatus() == 0) {
            log.warn("登录失败-账号已禁用: username={}, ip={}", username, request.getRemoteAddr());
            return ApiResponse.error(456, "账号已被禁用");
        }

        loginFailCache.invalidate(username);
        log.info("用户登录: userId={}, username={}, ip={}", user.getId(), username, request.getRemoteAddr());

        // Access Token
        String jwtToken = jwtUtil.generateToken(user.getId(), user.getUsername());

        // Refresh Token
        String deviceInfo = CommonUtils.resolveDevice(request.getHeader("User-Agent"));
        String rawRefreshToken = refreshTokenService.createToken(user.getId(), deviceInfo, jwtUtil.getRefreshExpirationDays());

        response.addHeader(HttpHeaders.SET_COOKIE, buildAccessTokenCookie(jwtToken).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(rawRefreshToken).toString());

        return ApiResponse.success(UserConvert.INSTANCE.toDto(user));
    }

    @RateLimit(limit = 6)
    @PostMapping("/refresh")
    public ApiResponse<UserDto> refresh(HttpServletRequest request, HttpServletResponse response) {
        String rawRefreshToken = extractCookie(request, "refreshToken");
        if (rawRefreshToken == null) {
            throw new UnauthorizedException("刷新令牌不存在");
        }

        SysUserToken tokenEntity = refreshTokenService.validateToken(rawRefreshToken);
        if (tokenEntity == null) {
            clearCookie(response, "refreshToken", "/api/auth/refresh");
            throw new UnauthorizedException("刷新令牌无效或已过期");
        }

        SysUser user = userService.findByUserId(tokenEntity.getUserId());
        if (user == null || user.getStatus() == 0) {
            refreshTokenService.deleteAllByUserId(tokenEntity.getUserId());
            clearCookie(response, "refreshToken", "/api/auth/refresh");
            clearCookie(response, "accessToken", "/");
            throw new ForbiddenException("用户不存在或已禁用");
        }

        // New Access Token
        String newJwtToken = jwtUtil.generateToken(user.getId(), user.getUsername());

        response.addHeader(HttpHeaders.SET_COOKIE, buildAccessTokenCookie(newJwtToken).toString());

        return ApiResponse.success(UserConvert.INSTANCE.toDto(user));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        Long userId = SecurityUtils.getCurrentUserId();
        String deviceInfo = CommonUtils.resolveDevice(request.getHeader("User-Agent"));
        refreshTokenService.deleteByUserIdAndDevice(userId, deviceInfo);
        log.info("用户登出: userId={}, device={}", userId, deviceInfo);

        clearCookie(response, "accessToken", "/");
        clearCookie(response, "refreshToken", "/api/auth/refresh");

        return ApiResponse.success();
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> getCurrentUser() {
        SysUser user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("未登录");
        }
        return ApiResponse.success(UserConvert.INSTANCE.toDto(user));
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordDto dto,
                                            HttpServletResponse response) {
        SysUser user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("登录已过期，请重新登录");
        } else if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            return ApiResponse.error(456, "原密码错误");
        } else if (passwordEncoder.matches(dto.getNewPassword(), user.getPassword())) {
            return ApiResponse.error(456, "新密码不能与原密码相同");
        }

        userService.changePassword(user.getId(), dto.getNewPassword());
        refreshTokenService.deleteAllByUserId(user.getId());
        log.info("用户修改密码: userId={}", user.getId());
        clearCookie(response, "accessToken", "/");
        clearCookie(response, "refreshToken", "/api/auth/refresh");
        return ApiResponse.success();
    }

    @PostMapping("/force-change-password")
    public ApiResponse<Void> forceChangePassword(@RequestBody Map<String, String> body,
                                                 HttpServletResponse response) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ApiResponse.error(456, "新密码不能为空");
        }
        if (newPassword.length() < 8) {
            return ApiResponse.error(456, "新密码长度不能少于8位");
        }
        if (!newPassword.matches("^[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};':\",./<>?`~]*$")) {
            return ApiResponse.error(456, "密码只能包含字母、数字和常见符号");
        }
        SysUser user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("登录已过期，请重新登录");
        }
        if (!Boolean.TRUE.equals(user.getNeedResetPwd())) {
            return ApiResponse.error(456, "当前无需强制修改密码");
        }
        userService.changePassword(user.getId(), newPassword);
        refreshTokenService.deleteAllByUserId(user.getId());
        clearCookie(response, "accessToken", "/");
        clearCookie(response, "refreshToken", "/api/auth/refresh");
        log.info("用户强制修改密码: userId={}", user.getId());
        return ApiResponse.success();
    }


    @AdminOnly
    @PostMapping("/reset-password")
    public ApiResponse<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordDto dto) {
        String tempPassword = userService.resetPassword(dto.getUserId());
        refreshTokenService.deleteAllByUserId(dto.getUserId());

        Optional.ofNullable(userService.findByUserId(dto.getUserId()))
                .map(SysUser::getUsername).ifPresent(loginFailCache::invalidate);

        log.info("管理员重置密码: operatorId={}, targetUserId={}", SecurityUtils.getCurrentUserId(), dto.getUserId());
        return ApiResponse.success(Map.of("tempPassword", tempPassword));
    }

    // --- Cookie helpers ---

    private ResponseCookie buildAccessTokenCookie(String token) {
        return ResponseCookie.from("accessToken", token)
                .httpOnly(true)
                .secure(jwtUtil.isCookieSecure())
                .maxAge(jwtUtil.getExpiration() / 1000)
                .path("/")
                .sameSite("Lax")
                .build();
    }

    private ResponseCookie buildRefreshTokenCookie(String token) {
        return ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(jwtUtil.isCookieSecure())
                .maxAge(TimeUnit.DAYS.toSeconds(jwtUtil.getRefreshExpirationDays()))
                .path("/api/auth/refresh")
                .sameSite("Lax")
                .build();
    }

    private void clearCookie(HttpServletResponse response, String name, String path) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(jwtUtil.isCookieSecure())
                .path(path)
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (name.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

}
