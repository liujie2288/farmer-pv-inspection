package com.yldlxj.pv.inspect.common;

import java.util.Random;
import java.util.regex.Pattern;

public class CommonUtils {

    private static final Random RANDOM = new Random();
    private static final String LETTERS = "abcdefghijklmnopqrstuvwxyz";
    private static final Pattern SAFE_NAME_REG = Pattern.compile("[\\\\/:*?\"<>|\\s]+");

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

    public static String truncateFileName(String name) {
        if (name == null || name.isBlank()) {
            return "unknown";
        }
        String safeName = SAFE_NAME_REG.matcher(name).replaceAll("");
        return safeName.isEmpty() ? "unknown" : safeName;
    }

    public static String truncateFileName(String name, int length) {
        String safeName = truncateFileName(name);
        return safeName.length() > length ? safeName.substring(0, length) : safeName;
    }

    public static String getExtension(String key) {
        int dotIdx = key.lastIndexOf('.');
        if (dotIdx > 0 && dotIdx > key.lastIndexOf('/')) {
            String ext = key.substring(dotIdx).toLowerCase();
            if (ext.length() <= 5) return ext;
        }
        return ".jpg";
    }

}
