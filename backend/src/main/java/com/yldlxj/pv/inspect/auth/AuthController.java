package com.yldlxj.pv.inspect.auth;

import com.yldlxj.pv.inspect.auth.dto.ChangePasswordDto;
import com.yldlxj.pv.inspect.auth.dto.LoginDto;
import com.yldlxj.pv.inspect.auth.dto.ResetPasswordDto;
import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.common.ForbiddenException;
import com.yldlxj.pv.inspect.common.UnauthorizedException;
import com.yldlxj.pv.inspect.convert.UserConvert;
import com.yldlxj.pv.inspect.user.SysUser;
import com.yldlxj.pv.inspect.user.UserService;
import com.yldlxj.pv.inspect.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtUtil jwtUtil;
    private final AuthService authService;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ApiResponse<UserDto> login(@Valid @RequestBody LoginDto loginDto, HttpServletResponse response) {
        SysUser user = userService.findByUsername(loginDto.getUsername());
        if (user == null) {
            throw new UnauthorizedException("用户名或密码错误");
        } else if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("用户名或密码错误");
        } else if (user.getStatus() == 0) {
            throw new ForbiddenException("账号已被禁用");
        }

        // 生成 JWT 字符串
        String jwtToken = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

        // 构建 Cookie
        ResponseCookie cookie = ResponseCookie.from("accessToken", jwtToken) // Cookie 名称
                .httpOnly(true)         // 关键：防止 JS 读取，防止 XSS 攻击
                .secure(true)           // 关键：仅在 HTTPS 环境下传输
                .path("/")              // 作用域
                .maxAge(3600)           // 过期时间 (秒)，建议与 JWT 有效期一致
                .sameSite("Lax")
                .build();

        // 将 Cookie 写入响应头
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ApiResponse.success(UserConvert.INSTANCE.toDto(user));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
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
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordDto dto) {
        SysUser user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return ApiResponse.error(401, "登录已过期，请重新登录");
        } else if (dto.getNewPassword().equals(user.getPassword())) {
            return ApiResponse.error(456, "新密码不能与原密码相同");
        } else if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            return ApiResponse.error(456, "原密码错误");
        }

        authService.changePassword(user.getId(), dto.getNewPassword());
        return ApiResponse.success();
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordDto dto) {
        authService.resetPassword(dto.getUserId());
        return ApiResponse.success();
    }
}
