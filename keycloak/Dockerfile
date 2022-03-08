FROM quay.io/keycloak/keycloak:17.0.0 as builder

ENV KC_METRICS_ENABLED=true
ENV KC_FEATURES=token-exchange
ENV KC_DB=postgres
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:17.0.0
COPY --from=builder /opt/keycloak/lib/quarkus/ /opt/keycloak/lib/quarkus/
COPY ./libs/keycloak-bcrypt-1.5.0.jar /opt/keycloak/providers/ 
WORKDIR /opt/keycloak
ENV KEYCLOAK_ADMIN=admin
ENV KEYCLOAK_ADMIN_PASSWORD=admin
ENV KC_DB_USERNAME=keycloak
ENV KC_DB_PASSWORD=password
ENV KC_HOSTNAME_STRICT=false
ENV KC_HTTP_ENABLED=true
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start-dev"]
COPY ./libs/keycloak-bcrypt-1.5.0.jar /opt/keycloak/providers/

