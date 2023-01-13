FROM quay.io/keycloak/keycloak:19.0 as builder

ENV KC_METRICS_ENABLED=true
ENV KC_FEATURES=token-exchange
ENV KC_DB=postgres
COPY ./libs/keycloak-bcrypt-1.5.0.jar /opt/keycloak/providers/
COPY ./themes/opencampus /opt/keycloak/themes/opencampus
COPY ./themes/edu-hub /opt/keycloak/themes/edu-hub
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:19.0
COPY --from=builder /opt/keycloak/lib/quarkus/ /opt/keycloak/lib/quarkus/
COPY ./libs/keycloak-bcrypt-1.5.0.jar /opt/keycloak/providers/
COPY ./themes/opencampus /opt/keycloak/themes/opencampus

WORKDIR /opt/keycloak
# for demonstration purposes only, please make sure to use proper certificates in production instead
RUN keytool -genkeypair -storepass password -storetype PKCS12 -keyalg RSA -keysize 2048 -dname "CN=server" -alias server -ext "SAN:c=DNS:localhost,IP:127.0.0.1" -keystore conf/server.keystore

ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start"]
