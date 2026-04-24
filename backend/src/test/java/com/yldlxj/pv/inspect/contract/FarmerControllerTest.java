package com.yldlxj.pv.inspect.contract;

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
class FarmerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private String getAdminToken() throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andReturn().getResponse().getContentAsString();
        return response.split("\"token\":\"")[1].split("\"")[0];
    }

    private Long createTestProject(String token) throws Exception {
        String res = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"projectName\":\"测试项目Farmer\",\"propertyCompany\":\"测试\",\"stationType\":\"户用\"}"))
                .andReturn().getResponse().getContentAsString();
        String idStr = res.split("\"id\":")[1].split("}")[0];
        return Long.parseLong(idStr);
    }

    @Test
    void listFarmers_returnsOk() throws Exception {
        String token = getAdminToken();
        Long projectId = createTestProject(token);
        mockMvc.perform(get("/api/projects/" + projectId + "/farmers?page=1&size=20")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void createFarmer_returns201() throws Exception {
        String token = getAdminToken();
        Long projectId = createTestProject(token);
        mockMvc.perform(post("/api/projects/" + projectId + "/farmers")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"farmerCode\":\"F001\",\"farmerName\":\"张三\",\"powerAccount\":\"PA001\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(201))
                .andExpect(jsonPath("$.data.id").exists());
    }

    @Test
    void getFarmerDetail_returnsOk() throws Exception {
        String token = getAdminToken();
        Long projectId = createTestProject(token);
        // Create first
        String res = mockMvc.perform(post("/api/projects/" + projectId + "/farmers")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"farmerCode\":\"F002\",\"farmerName\":\"李四\"}"))
                .andReturn().getResponse().getContentAsString();
        String farmerId = res.split("\"id\":")[1].split("}")[0];

        mockMvc.perform(get("/api/projects/" + projectId + "/farmers/" + farmerId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.farmerName").value("李四"));
    }
}
