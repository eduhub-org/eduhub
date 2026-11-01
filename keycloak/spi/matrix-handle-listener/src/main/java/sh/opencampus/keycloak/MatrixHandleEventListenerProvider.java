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
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Keycloak Event Listener that assigns an immutable {@code matrix_user_handle}
 * attribute to users upon registration.
 *
 * The handle format is: {@code firstname.lastname.uuid6} where uuid6 is the
 * first 6 hex characters of the user's Keycloak UUID (hyphens stripped).
 *
 * Must produce the same handle as computeMatrixHandle in
 * functions/shared_libs/node/matrixHandle.cjs; keep the two in sync.
 *
 * Once set, the attribute is never overwritten.
 */
public class MatrixHandleEventListenerProvider implements EventListenerProvider {

    private static final Logger LOG = Logger.getLogger(MatrixHandleEventListenerProvider.class);
    private static final String ATTRIBUTE_NAME = "matrix_user_handle";

    // Greek digraphs (ELOT 743), applied before the per-letter map. αυ/ευ/ηυ
    // become af/ef/if before a voiceless consonant or at the end of a word, and
    // av/ev/iv otherwise; rewriting υ to φ/β lets the letter map finish the job.
    private static final String[][] DIGRAPHS = {
            {"([αεη])υ(?=[θκξπσςτφχψ]|[^α-ω]|$)", "$1φ"},
            {"([αεη])υ", "$1β"},
            {"ου", "ou"},
            {"γγ", "ng"},
    };

    // Lowercase, after NFD + mark stripping (so й -> и, ё -> е, ά -> α already).
    private static final Map<Character, String> TRANSLITERATION = new HashMap<>();

    static {
        String[] pairs = {
                // Cyrillic (Russian, Ukrainian, Belarusian, Serbian, Macedonian, Bulgarian)
                "а", "a", "б", "b", "в", "v", "г", "g", "д", "d", "е", "e", "ж", "zh",
                "з", "z", "и", "i", "к", "k", "л", "l", "м", "m", "н", "n", "о", "o",
                "п", "p", "р", "r", "с", "s", "т", "t", "у", "u", "ф", "f", "х", "kh",
                "ц", "ts", "ч", "ch", "ш", "sh", "щ", "shch", "ъ", "ie", "ы", "y",
                "ь", "", "э", "e", "ю", "iu", "я", "ia", "і", "i", "є", "ie", "ґ", "g",
                "ђ", "dj", "ј", "j", "љ", "lj", "њ", "nj", "ћ", "c", "џ", "dz", "ѕ", "dz",
                // Greek
                "α", "a", "β", "v", "γ", "g", "δ", "d", "ε", "e", "ζ", "z", "η", "i",
                "θ", "th", "ι", "i", "κ", "k", "λ", "l", "μ", "m", "ν", "n", "ξ", "x",
                "ο", "o", "π", "p", "ρ", "r", "σ", "s", "ς", "s", "τ", "t", "υ", "y",
                "φ", "f", "χ", "ch", "ψ", "ps", "ω", "o",
                // Latin letters that NFD does not decompose
                "ß", "ss", "æ", "ae", "ø", "o", "œ", "oe", "ł", "l", "đ", "d", "ð", "d",
                "þ", "th", "ı", "i",
        };
        for (int i = 0; i < pairs.length; i += 2) {
            TRANSLITERATION.put(pairs[i].charAt(0), pairs[i + 1]);
        }
    }

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
            LOG.infof("Assigned %s to user %s", ATTRIBUTE_NAME, userId);
            LOG.debugf("Assigned %s = %s to user %s", ATTRIBUTE_NAME, handle, userId);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to assign matrix handle to user %s", userId);
        }
    }

    static String computeHandle(String firstName, String lastName, String userId) {
        String first = sanitize(firstName);
        String last = sanitize(lastName);
        if (first.isEmpty()) first = "user";
        if (last.isEmpty()) last = "user";
        String uuidPrefix = userId.replace("-", "").substring(0, 6);
        return first + "." + last + "." + uuidPrefix;
    }

    /**
     * Sanitize a name for use in a Matrix localpart.
     * Strips diacritics (u-umlaut -> u), lowercases, transliterates Cyrillic,
     * Greek and a few undecomposable Latin letters (sharp s -> ss), then strips
     * characters not in [a-z0-9._-]. May return an empty string.
     */
    static String sanitize(String input) {
        if (input == null) return "";
        String lowered = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        for (String[] digraph : DIGRAPHS) {
            lowered = lowered.replaceAll(digraph[0], digraph[1]);
        }
        StringBuilder out = new StringBuilder(lowered.length());
        for (int i = 0; i < lowered.length(); i++) {
            char ch = lowered.charAt(i);
            String mapped = TRANSLITERATION.get(ch);
            out.append(mapped != null ? mapped : String.valueOf(ch));
        }
        return out.toString().replaceAll("[^a-z0-9._\\-]", "");
    }
}
