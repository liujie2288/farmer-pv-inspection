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

    public static SysUser getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }

        return auth.getPrincipal() instanceof SysUser ? (SysUser) auth.getPrincipal() : null;
    }
}
