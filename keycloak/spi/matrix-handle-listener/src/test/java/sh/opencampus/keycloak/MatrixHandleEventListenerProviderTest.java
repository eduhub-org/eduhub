package sh.opencampus.keycloak;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * Same cases as functions/shared_libs/node/matrixHandle.test.cjs; update both
 * when the expected handles change.
 */
class MatrixHandleEventListenerProviderTest {

    private static final String UUID = "4f42bd12-3456-7890-abcd-ef0123456789";

    @ParameterizedTest
    @CsvSource(nullValues = "NULL", value = {
            "Anna, Bo, anna.bo.4f42bd",
            "Jürgen, Müller-Lüdenscheidt, jurgen.muller-ludenscheidt.4f42bd",
            "Renée, O'Brien, renee.obrien.4f42bd",
            "Иван, Петров, ivan.petrov.4f42bd",
            "Юлия, Щербакова, iuliia.shcherbakova.4f42bd",
            "Сергей, Ёлкин, sergei.elkin.4f42bd",
            "Олексій, Гнатюк, oleksii.gnatiuk.4f42bd",
            "Ђорђе, Јовановић, djordje.jovanovic.4f42bd",
            "Γιώργος, Παπαδόπουλος, giorgos.papadopoulos.4f42bd",
            "Ευάγγελος, Παύλου, evangelos.pavlou.4f42bd",
            "Ευστάθιος, Αυγερινός, efstathios.avgerinos.4f42bd",
            "Ηύα, Γαλάτσευ, iva.galatsef.4f42bd",
            "Weiß, Ærø, weiss.aero.4f42bd",
            "Łukasz, Kowalski, lukasz.kowalski.4f42bd",
            "小明, 王, user.user.4f42bd",
            "محمد, 😀, user.user.4f42bd",
            "'', NULL, user.user.4f42bd",
    })
    void computesHandle(String firstName, String lastName, String expected) {
        assertEquals(expected, MatrixHandleEventListenerProvider.computeHandle(firstName, lastName, UUID));
    }
}
