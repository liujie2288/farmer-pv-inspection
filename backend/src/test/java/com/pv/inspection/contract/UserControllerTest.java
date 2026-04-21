package com.pv.inspection.contract;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private String getAdminToken() throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andReturn().getResponse().getContentAsString();
        // Extract token from JSON response
        return response.split("\"token\":\"")[1].split("\"")[0];
    }

    @Test
    void listUsers_returnsPagedResult() throws Exception {
        String token = getAdminToken();
        mockMvc.perform(get("/api/users?page=1&size=10")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    void createUser_withValidData_returns201() throws Exception {
        String token = getAdminToken();
        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"username\":\"testuser\",\"password\":\"test123456\",\"realName\":\"测试用户\",\"role\":\"inspector\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(201))
                .andExpect(jsonPath("$.data.id").exists());
    }

    @Test
    void updateUser_withValidData_returns200() throws Exception {
        String token = getAdminToken();
        mockMvc.perform(put("/api/users/1")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"realName\":\"管理员\",\"phone\":\"13800138000\",\"role\":\"admin\",\"status\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void toggleStatus_returns200() throws Exception {
        String token = getAdminToken();
        mockMvc.perform(put("/api/users/1/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"status\":1}"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteUser_returns200() throws Exception {
        String token = getAdminToken();
        // First create a user to delete
        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"username\":\"todelete\",\"password\":\"del123456\",\"realName\":\"待删除\",\"role\":\"inspector\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/users/2")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void listUsers_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }
}
