# ============================================
# 孕期宝 · 后端 Dockerfile (多阶段构建)
# ============================================

# ---------- 阶段1: Maven 构建 ----------
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
# 先复制 pom.xml 利用 Docker 缓存下载依赖
COPY pom.xml .
RUN mvn dependency:go-offline -B
# 再复制源码编译
COPY src ./src
RUN mvn package -DskipTests -B

# ---------- 阶段2: 运行时 ----------
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /build/target/YunJi-0.0.1-SNAPSHOT.jar app.jar

# 时区设为上海
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

EXPOSE 9677

ENTRYPOINT ["java", \
  "-Xms256m", "-Xmx512m", \
  "-Dfile.encoding=UTF-8", \
  "-jar", "app.jar"]
