FROM eclipse-temurin:21-jre-alpine

ARG QUARKUS_APP_DIR=target/quarkus-app

WORKDIR /app

COPY ${QUARKUS_APP_DIR}/lib/ lib/
COPY ${QUARKUS_APP_DIR}/*.jar .
COPY ${QUARKUS_APP_DIR}/app/ app/
COPY ${QUARKUS_APP_DIR}/quarkus/ quarkus/

EXPOSE 8080

ENV JAVA_OPTS="-Xms128m -Xmx512m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar quarkus-run.jar"]
