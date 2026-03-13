package com.anmory.yunji.common;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@ConfigurationProperties(prefix = "captcha")
@Configuration
public class Captcha {
    private Integer width;
    private Integer height;
    private Session session;

    @Override
    public String toString() {
        return "Captcha{" +
                "width=" + width +
                ", height=" + height +
                ", session=" + session +
                '}';
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public Session getSession() {
        return session;
    }

    public void setSession(Session session) {
        this.session = session;
    }

    public static class Session { // 将内部类改为 public
        private String key;
        private String date;

        @Override
        public String toString() {
            return "Session{" +
                    "key='" + key + '\'' +
                    ", date='" + date + '\'' +
                    '}';
        }

        public String getKey() {
            return key;
        }

        public Session(String key, String date) {
            this.key = key;
            this.date = date;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }
    }
}

