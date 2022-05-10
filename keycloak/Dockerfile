FROM quay.io/keycloak/keycloak:17.0.0 as builder

ENV KC_METRICS_ENABLED=true
ENV KC_FEATURES=token-exchange
ENV KC_DB=postgres
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:17.0.0
COPY --from=builder /opt/keycloak/lib/quarkus/ /opt/keycloak/lib/quarkus/
COPY ./libs/keycloak-bcrypt-1.5.0.jar /opt/keycloak/providers/

WORKDIR /opt/keycloak
# for demonstration purposes only, please make sure to use proper certificates in production instead
RUN keytool -genkeypair -storepass password -storetype PKCS12 -keyalg RSA -keysize 2048 -dname "CN=server" -alias server -ext "SAN:c=DNS:localhost,IP:127.0.0.1" -keystore conf/server.keystore

USER root
COPY ./gcsfuse.repo /etc/yum.repos.d/
RUN microdnf update -y && microdnf install -y gcsfuse && microdnf clean all

COPY ./start.sh /opt/keycloak/bin/start.sh
RUN chmod +x /opt/keycloak/bin/start.sh

RUN mkdir -p /mnt/bucket
RUN chown keycloak:fuse /mnt/bucket
RUN chmod 777 /mnt/bucket

USER keycloak
ENTRYPOINT ["/opt/keycloak/bin/start.sh", "start"]
