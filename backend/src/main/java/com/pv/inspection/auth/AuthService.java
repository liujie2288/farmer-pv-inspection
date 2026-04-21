package com.pv.inspection.auth;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.pv.inspection.auth.dto.ChangePasswordDTO;
import com.pv.inspection.auth.dto.LoginDTO;
import com.pv.inspection.common.BusinessException;
import com.pv.inspection.common.ForbiddenException;
import com.pv.inspection.common.UnauthorizedException;
import com.pv.inspection.user.SysUser;
import com.pv.inspection.user.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SysUserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    private static final String DEFAULT_PASSWORD = "123456";

    public Map<String, Object> login(LoginDTO dto) {
        SysUser user = userMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, dto.getUsername())
        );

        if (user == null) {
            throw new UnauthorizedException("用户名或密码错误");
        }

        // Compare MD5 hash - passwords stored as MD5
        if (!user.getPassword().equals(md5(dto.getPassword()))) {
            throw new UnauthorizedException("用户名或密码错误");
        }

        if (user.getStatus() == 0) {
            throw new ForbiddenException("账号已被禁用");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userId", user.getId());
        data.put("username", user.getUsername());
        data.put("realName", user.getRealName());
        data.put("role", user.getRole());
        data.put("firstLogin", user.getFirstLogin() == 1);
        return data;
    }

    public void changePassword(ChangePasswordDTO dto) {
        Long currentUserId = getCurrentUserId();
        SysUser user = userMapper.selectById(currentUserId);

        if (user == null) {
            throw new UnauthorizedException("用户不存在");
        }

        if (!user.getPassword().equals(md5(dto.getOldPassword()))) {
            throw new BusinessException("原密码错误");
        }

        user.setPassword(md5(dto.getNewPassword()));
        user.setFirstLogin(0);
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
    }

    public void resetPassword(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        user.setPassword(md5(DEFAULT_PASSWORD));
        user.setFirstLogin(1);
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
    }

    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new UnauthorizedException("未登录");
        }
        return (Long) auth.getPrincipal();
    }

    private String md5(String input) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("MD5加密失败", e);
        }
    }
}
