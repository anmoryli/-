package com.anmory.yunji.health;

import com.anmory.yunji.entity.FetalUltrasoundRecord;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 胎儿 B 超参考标准
 */
public final class FetalReference {

    private static final BigDecimal FETAL_RANGE_RATIO = new BigDecimal("0.10");
    private static final Map<Integer, FetalRef> MAP = new HashMap<>();

    static {
        put(12, 15, 56, 51, 7, 9);
        put(13, 19, 72, 63, 10, 19);
        put(14, 24, 89, 75, 14, 38);
        put(15, 28, 105, 87, 17, 62);
        put(16, 32, 120, 100, 20, 95);
        put(17, 36, 135, 112, 23, 136);
        put(18, 39, 149, 124, 26, 183);
        put(19, 43, 162, 135, 29, 243);
        put(20, 46, 175, 147, 32, 311);
        put(21, 50, 187, 159, 35, 399);
        put(22, 53, 198, 170, 37, 480);
        put(23, 56, 209, 182, 40, 585);
        put(24, 59, 220, 193, 43, 700);
        put(25, 62, 230, 204, 45, 816);
        put(26, 64, 239, 215, 48, 946);
        put(27, 67, 249, 226, 50, 1087);
        put(28, 70, 258, 237, 53, 1260);
        put(29, 72, 266, 248, 55, 1414);
        put(30, 75, 275, 258, 57, 1589);
        put(31, 77, 283, 269, 60, 1790);
        put(32, 80, 290, 279, 62, 1995);
        put(33, 82, 298, 290, 64, 2204);
        put(34, 85, 305, 300, 66, 2439);
        put(35, 87, 312, 311, 68, 2677);
        put(36, 89, 319, 321, 70, 2918);
        put(37, 91, 326, 331, 72, 3172);
        put(38, 93, 333, 341, 74, 3442);
        put(39, 96, 339, 351, 76, 3775);
        put(40, 98, 345, 361, 78, 4056);
    }

    private static void put(int week, double bpd, double hc, double ac, double fl, int efw) {
        MAP.put(week, new FetalRef(
                week,
                new BigDecimal(String.valueOf(bpd)),
                new BigDecimal(String.valueOf(hc)),
                new BigDecimal(String.valueOf(ac)),
                new BigDecimal(String.valueOf(fl)),
                efw
        ));
    }

    private FetalReference() {
    }

    public static FetalRef byWeek(int week) {
        return MAP.get(week);
    }

    public static Map<String, Object> status(FetalUltrasoundRecord r, FetalRef ref) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("bpdMm", metricStatus(r.getBpdMm(), ref.bpd));
        s.put("hcMm", metricStatus(r.getHcMm(), ref.hc));
        s.put("acMm", metricStatus(r.getAcMm(), ref.ac));
        s.put("flMm", metricStatus(r.getFlMm(), ref.fl));
        s.put("efwG", intStatus(r.getEfwG(), ref.efw));
        return s;
    }

    public static String overallStatus(Map<String, Object> status) {
        if (status == null || status.isEmpty()) return "unknown";
        boolean anyAbove = status.values().stream().anyMatch(v -> "above".equals(v));
        boolean anyBelow = status.values().stream().anyMatch(v -> "below".equals(v));
        if (anyAbove) return "above";
        if (anyBelow) return "below";
        return "within";
    }

    public static String advice(Map<String, Object> status) {
        if (status == null || status.isEmpty()) return "暂无建议。";
        boolean anyAbove = status.values().stream().anyMatch(v -> "above".equals(v));
        boolean anyBelow = status.values().stream().anyMatch(v -> "below".equals(v));
        if (anyAbove || anyBelow) {
            return "有指标超出参考范围：建议结合B超测量误差与孕周校准复核；如多项持续偏离或伴随不适，请尽快咨询产科医生（本建议仅供参考）。";
        }
        return "指标在参考范围内：继续按时产检，保持均衡饮食与规律作息即可。";
    }

    private static String metricStatus(BigDecimal actual, BigDecimal base) {
        if (actual == null || base == null) return "unknown";
        BigDecimal min = base.multiply(BigDecimal.ONE.subtract(FETAL_RANGE_RATIO));
        BigDecimal max = base.multiply(BigDecimal.ONE.add(FETAL_RANGE_RATIO));
        if (actual.compareTo(min) < 0) return "below";
        if (actual.compareTo(max) > 0) return "above";
        return "within";
    }

    private static String intStatus(Integer actual, Integer base) {
        if (actual == null || base == null) return "unknown";
        int min = (int) Math.floor(base * (1.0 - FETAL_RANGE_RATIO.doubleValue()));
        int max = (int) Math.ceil(base * (1.0 + FETAL_RANGE_RATIO.doubleValue()));
        if (actual < min) return "below";
        if (actual > max) return "above";
        return "within";
    }

    public record FetalRef(int week, BigDecimal bpd, BigDecimal hc, BigDecimal ac, BigDecimal fl, Integer efw) {
        public Map<String, Object> toMapWithRange() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("week", week);
            m.put("bpd", metric("bpdMm", bpd));
            m.put("hc", metric("hcMm", hc));
            m.put("ac", metric("acMm", ac));
            m.put("fl", metric("flMm", fl));
            m.put("efw", efw == null ? null : Map.of("value", efw, "range", rangeInt(efw)));
            return m;
        }

        private Map<String, Object> metric(String key, BigDecimal v) {
            if (v == null) return null;
            return Map.of("value", v, "range", range(v));
        }

        private Map<String, Object> range(BigDecimal base) {
            BigDecimal min = base.multiply(BigDecimal.ONE.subtract(FETAL_RANGE_RATIO)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal max = base.multiply(BigDecimal.ONE.add(FETAL_RANGE_RATIO)).setScale(2, RoundingMode.HALF_UP);
            return Map.of("min", min, "max", max);
        }

        private Map<String, Object> rangeInt(int base) {
            int min = (int) Math.floor(base * (1.0 - FETAL_RANGE_RATIO.doubleValue()));
            int max = (int) Math.ceil(base * (1.0 + FETAL_RANGE_RATIO.doubleValue()));
            return Map.of("min", min, "max", max);
        }
    }
}
