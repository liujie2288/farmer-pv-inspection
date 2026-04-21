package com.pv.inspection.auth;

import com.pv.inspection.auth.dto.ChangePasswordDTO;
import com.pv.inspection.auth.dto.LoginDTO;
import com.pv.inspection.auth.dto.ResetPasswordDTO;
import com.pv.inspection.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginDTO dto) {
        return ApiResponse.success(authService.login(dto));
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordDTO dto) {
        authService.changePassword(dto);
        return ApiResponse.success();
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordDTO dto) {
        authService.resetPassword(dto.getUserId());
        return ApiResponse.success();
    }
}
