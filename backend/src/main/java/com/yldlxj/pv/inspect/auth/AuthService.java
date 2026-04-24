package com.yldlxj.pv.inspect.auth;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yldlxj.pv.inspect.auth.dto.ChangePasswordDto;
import com.yldlxj.pv.inspect.auth.dto.LoginDto;
import com.yldlxj.pv.inspect.common.BusinessException;
import com.yldlxj.pv.inspect.common.ForbiddenException;
import com.yldlxj.pv.inspect.common.UnauthorizedException;
import com.yldlxj.pv.inspect.user.SysUser;
import com.yldlxj.pv.inspect.user.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SysUserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    private static final String DEFAULT_PASSWORD = "123456";

    public void changePassword(ChangePasswordDto dto) {
        SysUser user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("用户不存在");
        } else if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new BusinessException("原密码错误");
        } else if (passwordEncoder.matches(dto.getNewPassword(), user.getPassword())) {
            throw new BusinessException("新密码不能与原密码相同");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        user.setNeedResetPwd(false);

        userMapper.updateById(user);
    }

    public void resetPassword(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        user.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
        user.setNeedResetPwd(true);
        userMapper.updateById(user);
    }

    public Long getCurrentUserId() {
        SysUser user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("用户不存在");
        }
        return user.getId();
    }
}
