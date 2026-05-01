package com.yldlxj.pv.inspect.common;

import java.util.Random;

public class CommonUtils {

    private static final Random RANDOM = new Random();
    private static final String LETTERS = "abcdefghijklmnopqrstuvwxyz";

    public static String generateTempPassword() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 4; i++) sb.append(LETTERS.charAt(RANDOM.nextInt(LETTERS.length())));
        for (int i = 0; i < 4; i++) sb.append(RANDOM.nextInt(10));
        return sb.toString();
    }

    public static String resolveDevice(String userAgent) {
        if (userAgent == null) return "pc";
        String lower = userAgent.toLowerCase();
        if (lower.contains("mobile") || lower.contains("android") || lower.contains("iphone") || lower.contains("micromessenger")) {
            return "mobile";
        }
        return "pc";
    }

}
