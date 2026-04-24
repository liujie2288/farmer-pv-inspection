package com.yldlxj.pv.inspect.auth;

import com.yldlxj.pv.inspect.common.BusinessException;
import com.yldlxj.pv.inspect.common.UnauthorizedException;
import com.yldlxj.pv.inspect.user.SysUser;
import com.yldlxj.pv.inspect.user.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SysUserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    private static final String DEFAULT_PASSWORD = "123456";

    public void changePassword(Long userId, String password) {
        SysUser sysUser = userMapper.selectById(userId);
        if (sysUser != null) {
            sysUser.setPassword(passwordEncoder.encode(password));
            sysUser.setNeedResetPwd(false);
            userMapper.updateById(sysUser);
        }
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
