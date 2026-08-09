# Stage 1: Build the JAR
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Cache dependencies layer before copying source
COPY pom.xml .
RUN mvn dependency:go-offline -B --quiet

COPY src ./src
RUN mvn clean package -DskipTests -B --quiet

# Stage 2: Minimal JRE runtime
FROM eclipse-temurin:21-jre-alpine

# Create non-root user for security
RUN addgroup -S vaultx && adduser -S vaultx -G vaultx

WORKDIR /app

# Copy the built artifact
COPY --from=builder /app/target/vaultx-backend-1.0.0.jar app.jar

# Create logs directory with correct ownership
RUN mkdir -p logs && chown -R vaultx:vaultx /app

USER vaultx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/actuator/health || exit 1

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=55.0", \
    "-XX:+UseG1GC", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
