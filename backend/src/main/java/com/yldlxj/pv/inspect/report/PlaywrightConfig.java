package com.yldlxj.pv.inspect.report;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Playwright;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PreDestroy;
import java.util.List;

@Slf4j
@Configuration
@ConditionalOnProperty(name = "playwright.enabled", havingValue = "true")
public class PlaywrightConfig {

    private Playwright playwright;
    private Browser browser;

    @Bean
    public Browser playwrightBrowser() {
        log.info("Initializing Playwright and launching Chromium...");
        this.playwright = Playwright.create();
        this.browser = playwright.chromium().launch(
                new BrowserType.LaunchOptions()
                        .setHeadless(true)
                        .setArgs(List.of(
                                "--no-sandbox",
                                "--disable-setuid-sandbox",
                                "--disable-dev-shm-usage",
                                "--disable-gpu"
                        ))
        );
        log.info("Playwright Chromium launched successfully");
        return this.browser;
    }

    @PreDestroy
    public void cleanup() {
        log.info("Shutting down Playwright...");
        if (browser != null) {
            try { browser.close(); } catch (Exception ignored) {}
        }
        if (playwright != null) {
            try { playwright.close(); } catch (Exception ignored) {}
        }
    }
}
