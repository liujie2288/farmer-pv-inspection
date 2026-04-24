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

    public Long getCurrentUserId() {
        SysUser user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("用户不存在");
        }
        return user.getId();
    }
}
