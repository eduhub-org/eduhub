package sh.opencampus.keycloak;

import org.keycloak.events.Event;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventType;
import org.keycloak.events.admin.AdminEvent;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.jboss.logging.Logger;

import java.text.Normalizer;

/**
 * Keycloak Event Listener that assigns an immutable {@code matrix_user_handle}
 * attribute to users upon registration.
 *
 * The handle format is: {@code firstname.lastname.uuid6} where uuid6 is the
 * first 6 hex characters of the user's Keycloak UUID (hyphens stripped).
 *
 * Once set, the attribute is never overwritten.
 */
public class MatrixHandleEventListenerProvider implements EventListenerProvider {

    private static final Logger LOG = Logger.getLogger(MatrixHandleEventListenerProvider.class);
    private static final String ATTRIBUTE_NAME = "matrix_user_handle";

    private final KeycloakSession session;

    public MatrixHandleEventListenerProvider(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public void onEvent(Event event) {
        if (event.getType() == EventType.REGISTER) {
            assignHandleIfMissing(event.getRealmId(), event.getUserId());
        }
    }

    @Override
    public void onEvent(AdminEvent event, boolean includeRepresentation) {
        // Admin-created users are handled by the EduHub createUser function
    }

    @Override
    public void close() {
        // no-op
    }

    private void assignHandleIfMissing(String realmId, String userId) {
        try {
            RealmModel realm = session.realms().getRealm(realmId);
            if (realm == null) {
                LOG.warnf("Realm not found: %s", realmId);
                return;
            }

            UserModel user = session.users().getUserById(realm, userId);
            if (user == null) {
                LOG.warnf("User not found: %s", userId);
                return;
            }

            String existing = user.getFirstAttribute(ATTRIBUTE_NAME);
            if (existing != null && !existing.isEmpty()) {
                LOG.debugf("User %s already has %s = %s, skipping", userId, ATTRIBUTE_NAME, existing);
                return;
            }

            String handle = computeHandle(user.getFirstName(), user.getLastName(), userId);
            user.setSingleAttribute(ATTRIBUTE_NAME, handle);
            LOG.infof("Assigned %s = %s to user %s", ATTRIBUTE_NAME, handle, userId);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to assign matrix handle to user %s", userId);
        }
    }

    static String computeHandle(String firstName, String lastName, String userId) {
        String first = sanitize(firstName != null && !firstName.isEmpty() ? firstName : "user");
        String last = sanitize(lastName != null && !lastName.isEmpty() ? lastName : "user");
        String uuidPrefix = userId.replace("-", "").substring(0, 6);
        return first + "." + last + "." + uuidPrefix;
    }

    /**
     * Sanitize a name for use in a Matrix localpart.
     * Normalizes unicode (e.g. u-umlaut -> u), lowercases, and strips
     * characters not in [a-z0-9._-].
     */
    static String sanitize(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase().replaceAll("[^a-z0-9._\\-]", "");
    }
}
