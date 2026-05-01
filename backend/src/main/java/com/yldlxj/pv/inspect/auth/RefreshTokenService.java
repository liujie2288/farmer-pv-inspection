package com.yldlxj.pv.inspect.auth;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final SysUserTokenMapper tokenMapper;

    public String createToken(Long userId, String deviceInfo,long expiryDays) {
        String rawToken = UUID.randomUUID().toString();
        String hash = sha256(rawToken);

        SysUserToken entity = new SysUserToken();
        entity.setUserId(userId);
        entity.setTokenHash(hash);
        entity.setDeviceInfo(deviceInfo);
        entity.setExpiresAt(LocalDateTime.now().plusDays(expiryDays));

        tokenMapper.insert(entity);
        return rawToken;
    }

    public SysUserToken validateToken(String rawToken) {
        return tokenMapper.selectOne(
                new LambdaQueryWrapper<SysUserToken>()
                        .eq(SysUserToken::getTokenHash, sha256(rawToken))
                        .gt(SysUserToken::getExpiresAt, LocalDateTime.now())
        );
    }

    public void deleteByRawToken(String rawToken) {
        String hash = sha256(rawToken);
        tokenMapper.delete(
                new LambdaQueryWrapper<SysUserToken>()
                        .eq(SysUserToken::getTokenHash, hash)
        );
    }

    public void deleteAllByUserId(Long userId) {
        tokenMapper.delete(
                new LambdaQueryWrapper<SysUserToken>()
                        .eq(SysUserToken::getUserId, userId)
        );
    }

    public void deleteByUserIdAndDevice(Long userId, String deviceInfo) {
        tokenMapper.delete(
                new LambdaQueryWrapper<SysUserToken>()
                        .eq(SysUserToken::getUserId, userId)
                        .eq(SysUserToken::getDeviceInfo, deviceInfo)
        );
    }

    public void cleanupExpiredTokens() {
        tokenMapper.delete(
                new LambdaQueryWrapper<SysUserToken>()
                        .lt(SysUserToken::getExpiresAt, LocalDateTime.now())
        );
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 hashing failed", e);
        }
    }
}
