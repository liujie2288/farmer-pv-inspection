package com.yldlxj.pv.inspect.auth;

import com.yldlxj.pv.inspect.common.BaseEntity;
import com.yldlxj.pv.inspect.user.SysUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public class SecurityUtils {

    public static Long getCurrentUserId() {
        return Optional.ofNullable(getCurrentUser()).map(BaseEntity::getId).orElse(null);
    }

    public static Long checkAndGetCurrentUserId() {
        SysUser user = getCurrentUser();
        if (user == null) {
            throw new com.yldlxj.pv.inspect.common.exception.UnauthorizedException("用户不存在");
        }
        return user.getId();
    }

    public static SysUser getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }

        return auth.getPrincipal() instanceof SysUser ? (SysUser) auth.getPrincipal() : null;
    }
}
