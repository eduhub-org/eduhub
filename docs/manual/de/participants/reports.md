---
title: Fehler melden und Ideen vorschlagen
slug: participants/reports
audience: [participant, organizer, admin]
order: 40
language: de
summary: Wie Du über den Assistenten einen Fehler meldest oder eine Idee für EduHub vorschlägst, Dich einer bestehenden Meldung anschließt, siehst, was daraus geworden ist, und wie Admins Meldungen bearbeiten.
---

Wenn auf EduHub etwas nicht so funktioniert, wie Du es erwartest, oder Du eine Idee für etwas Neues oder Besseres hast, sag es dem **Assistenten**. Er macht aus Deiner Beschreibung eine Meldung an das EduHub-Team. Meldungen betreffen nur die Plattform selbst. Für alles rund um einen Kurs, etwa fehlende Folien oder ein Problem mit einem Termin, wende Dich an die Organisator:innen des Kurses.

## Eine Meldung schicken

1. Öffne den Assistenten und beschreib das Problem oder die Idee in Deinen eigenen Worten, am besten auf der Seite, auf der es passiert ist. Die Seite geht mit Deiner Frage mit.
2. Der Assistent prüft zuerst, ob es schon geht, und erklärt Dir dann, wie. Wenn nötig, stellt er ein oder zwei kurze Fragen, etwa was Du erwartet hast.
3. Danach zeigt er eine Karte mit der Art (**Fehler** oder **Idee**), einem Titel und einer Beschreibung. Noch ist nichts gesendet. Klick auf **Senden**, um sie abzuschicken, oder auf **Verwerfen**, wenn Du sie nicht willst. Soll der Text anders sein, sag dem Assistenten, was er ändern soll; er entwirft dann eine neue Karte.

Du kannst bis zu 5 Meldungen am Tag schicken.

## Einer bestehenden Meldung anschließen

Hat schon jemand dasselbe gemeldet, zeigt der Assistent statt einer neuen Meldung eine Karte **Bestehende Meldung** mit einer kurzen Zusammenfassung in seinen eigenen Worten. Klick auf **Mich anschließen**, damit Deine Stimme mitzählt: Je mehr Menschen betroffen sind, desto höher kann das Team die Meldung einplanen. Die Meldungen anderer selbst siehst Du nie.

Nimmt das Team eine Meldung an, veröffentlicht es sie als Issue im öffentlichen Code-Repository von EduHub auf GitHub, damit Entwickler:innen daran arbeiten können. Ein Admin prüft den Text vorher, und das Issue enthält nie Deinen Namen.

## Was aus Deinen Meldungen geworden ist

Frag den Assistenten jederzeit: „Was ist aus meinen Meldungen geworden?“ Er zeigt Dir die Meldungen, die Du geschickt oder denen Du Dich angeschlossen hast, mit ihrem Stand (neu, geplant, in Arbeit, erledigt, abgelehnt oder Duplikat) und der Notiz des EduHub-Teams, falls es eine gibt.

Solange Deine Meldung noch den Stand neu hat und sich niemand angeschlossen hat, kannst Du den Assistenten bitten, sie zurückzuziehen; er zeigt dann eine Karte mit **Zurückziehen**.

## Rückmeldung zu den Antworten des Assistenten

Unter jeder Antwort kannst Du sie mit Daumen hoch oder runter bewerten. Bei Daumen runter kannst Du auch schreiben, was nicht hilfreich war. Dein Kommentar wird ohne Deinen Namen 30 Tage lang aufbewahrt, egal ob Du zustimmst, dass die Unterhaltung aufbewahrt wird. Beides hilft dem Team, den Assistenten und dieses Handbuch zu verbessern.

## Für Admins: die Seite Meldungen

Admins finden alle Meldungen unter **Meldungen** im Benutzermenü. Jeden Montag erscheint dort eine Wochenzusammenfassung auf Englisch: die neuen und offenen Meldungen nach Thema gruppiert, wahrscheinliche Duplikate, vorgeschlagene Prioritäten und wiederkehrende Probleme mit den Antworten des Assistenten. Ein Abschnitt **Production errors** fasst die Fehler zusammen, die die Dienste der Plattform in der Woche protokolliert haben, und ordnet jede Gruppe ein: wahrscheinlicher Bug, Konfigurationsproblem (etwa ein fehlendes oder abgelaufenes Token), Kapazitätsproblem, ausgefallener externer Dienst oder Rauschen, jeweils mit einem Vorschlag für den nächsten Schritt. Die Zusammenfassung erscheint auch in Wochen mit Fehlern, aber ohne Meldungen. Frühere Wochen wählst Du unter **Woche** aus.

Darunter zeigt die Tabelle standardmäßig die offenen Meldungen; filtern kannst Du nach **Art** und **Status**. Für jede Meldung setzt Du **Status** und **Priorität**. Öffne eine Meldung, um ihre Beschreibung, die Seite und Rolle, von der sie kam, und die meldende Person zu sehen, und um:

- sie **Als Duplikat markieren von** einer anderen Meldung. Die Betroffenen zählen beim Original mit.
- eine **Öffentliche Notiz** zu schreiben, die alle sehen, die die Meldung geschickt oder sich angeschlossen haben, wenn sie den Assistenten fragen, zum Beispiel warum sie abgelehnt wurde.

Wer eine Meldung geschickt oder sich angeschlossen hat, wird 6 Monate nach dem Abschluss der Meldung (erledigt, abgelehnt oder Duplikat) entfernt.

### Eine Meldung annehmen: das GitHub-Issue

Ist die Verbindung zu GitHub eingerichtet, legt das Annehmen einer Meldung ihr Issue auf GitHub an:

1. Setz den Status auf **Geplant** oder **In Arbeit**, oder öffne die Meldung und klick auf **Issue erstellen oder verknüpfen**.
2. Wähl im Dialog **Neues Issue erstellen** und prüf Titel und Beschreibung. Das Issue ist öffentlich, also entfern Namen, E-Mail-Adressen und andere persönliche Angaben. Darunter wird eine Fußzeile mit Meldungsnummer, Priorität und der Zahl der Betroffenen ergänzt und aktuell gehalten. Alternativ wählst Du **Bestehendes Issue verknüpfen** und gibst die Nummer eines Issues ein, das das Team schon hat.
3. Klick auf **Issue erstellen** oder **Issue verknüpfen**. Erst dann ändert sich der Status; **Abbrechen** lässt die Meldung, wie sie war.

Neue Issues bekommen die Labels `bug` oder `feature` und `from-assistant` und landen auf dem Projekt-Board in der Spalte, die zum Status passt.

Ab dann bestimmt GitHub den Status:

- Wird das Issue als erledigt geschlossen, wird die Meldung **Erledigt**; als nicht geplant geschlossen, wird sie **Abgelehnt**; als Duplikat geschlossen, wird sie **Duplikat** (verknüpft mit der ursprünglichen Meldung, falls deren Issue eine hat).
- Wird das Issue wieder geöffnet, wird die Meldung wieder **Geplant**; wird die Karte auf dem Board nach **In Progress** verschoben, wird sie **In Arbeit**.
- Wird das Issue gelöscht oder in ein anderes Repository verschoben, verliert die Meldung die Verknüpfung und behält ihren letzten Status.

Du kannst den Status hier weiterhin ändern: Das Issue wird dann passend geschlossen, wieder geöffnet oder verschoben. Eine Meldung mit Issue kann nicht zurück auf **Neu**, und ein Issue gehört nur zu einer Meldung; markier weitere Meldungen zum selben Thema als Duplikate.
