package sh.opencampus.keycloak;

import org.keycloak.Config;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventListenerProviderFactory;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;

public class MatrixHandleEventListenerProviderFactory implements EventListenerProviderFactory {

    public static final String PROVIDER_ID = "matrix-handle-listener";

    @Override
    public EventListenerProvider create(KeycloakSession session) {
        return new MatrixHandleEventListenerProvider(session);
    }

    @Override
    public void init(Config.Scope config) {
        // no configuration needed
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
        // no-op
    }

    @Override
    public void close() {
        // no-op
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }
}
