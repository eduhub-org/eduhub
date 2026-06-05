SET check_function_bodies = false;
INSERT INTO public."AchievementOption" (id, title, description, "recordType", "evaluationScriptUrl", created_at, updated_at, published, "achievementDocumentationTemplateId") VALUES (1, 'online course project', 'Vivamus rutrum congue volutpat. Fusce quis convallis elit, id dictum lacus. Nam volutpat suscipit dapibus. Aliquam nunc diam, fringilla in laoreet eget, luctus quis libero.', 'ONLINE_COURSE', NULL, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00', true, NULL);
INSERT INTO public."AchievementOption" (id, title, description, "recordType", "evaluationScriptUrl", created_at, updated_at, published, "achievementDocumentationTemplateId") VALUES (2, 'regular project', 'Vivamus rutrum congue volutpat. Fusce quis convallis elit, id dictum lacus. Nam volutpat suscipit dapibus. Aliquam nunc diam, fringilla in laoreet eget, luctus quis libero.', 'ONLINE_COURSE', NULL, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00', true, NULL);
INSERT INTO public."AchievementOption" (id, title, description, "recordType", "evaluationScriptUrl", created_at, updated_at, published, "achievementDocumentationTemplateId") VALUES (3, 'online course project present', 'Vivamus rutrum congue volutpat. Fusce quis convallis elit, id dictum lacus. Nam volutpat suscipit dapibus. Aliquam nunc diam, fringilla in laoreet eget, luctus quis libero.', 'ONLINE_COURSE', NULL, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00', true, NULL);
INSERT INTO public."AchievementOption" (id, title, description, "recordType", "evaluationScriptUrl", created_at, updated_at, published, "achievementDocumentationTemplateId") VALUES (4, 'regular project present', 'Vivamus rutrum congue volutpat. Fusce quis convallis elit, id dictum lacus. Nam volutpat suscipit dapibus. Aliquam nunc diam, fringilla in laoreet eget, luctus quis libero.', 'ONLINE_COURSE', NULL, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00', true, NULL);
INSERT INTO public."CertificateTemplate" (id, name, html, created_at, updated_at) VALUES (1, 'achievement certificate example', '<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
  <title>Document Title</title>
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400&display=swap" rel="stylesheet"> 
  <style type="text/css">
    @page {
      size: a4;
      background-image: url("{{ template }}");
      background-position: center center;
      background-size: cover;
      @frame content_frame {
        left: 165pt;
        width: 420pt;
        top: 150pt;
        height:500pt;
      }
    }
    body, html {
      font-family: ''Lato'', sans-serif !important;
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 297mm;
    }
    .content {
      position: absolute;
      top: 0mm;
      left: 63mm;
      width: 130mm;
      height: 100%;
    }
    .content span, .content p, .content ul, .content li {
      color: #777;
      text-align: left;
      width: 100%;
    }
    .big {
      font-size: 7mm;
      font-weight: Black 900;
    }
    .small {
      font-size: 4.2mm;
    }
    .bold {
      font-weight: bold;
    }
  </style>
</head>
<body>
   <div class="content">
    <span class="big bold" style="top:50mm;">{{ full_name }}</span><br><br><br>
    <span class="small" style="top:63mm;">
      hat im {{ semester }} an dem Kurs
    </span><br><br><br>
    <span class="big bold" style="top:50mm;">{{ course_name }}</span><br><br>
    <div class="small" style="top:90mm;">
      <p> teilgenommen.</p>
      <p>
        Bei dem Kurs handelt es sich um ein interdisziplinäres Weiterbildungsangebot im
        Rahmen des Kieler Bildungsclusters opencampus.sh.
        Das Modul wird über das Zentrum für Schlüsselqualifikationen an der Christian-Albrechts-Universität zu Kiel angeboten.
      </p>
      <p>
        Für den Abschluss des Kurses wurde ein Arbeitsumfang entsprechend von {{ ECTS }} Arbeitsstunden erbracht. Dazu hat die/der Teilnehmende
      </p>
       <ul>
        <li>aktiv an den Kursterminen teilgenommen,</li>
        <li>das Praxisprojekt "{{ praxisprojekt }}" erfolgreich abgeschlossen.</li>
      </ul>
    </div>
    <div class="small" style="top:150mm;">
  <p>Durch den erfolgreichen Abschluss des Kurses hat die/der Teilnehmende gelernt:</p>
  <ul>
    {% for goal in learningGoalsList %}
      <li>{{ goal }}</li>
    {% endfor %}
  </ul>
</div>
  </div>
</body>
</html>', '2023-12-14 13:40:34.079378+00', '2023-12-14 13:55:01.645233+00');
INSERT INTO public."CertificateTemplate" (id, name, html, created_at, updated_at) VALUES (2, 'attendance certificate example', '<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
  <title>Document Title</title>
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400&display=swap" rel="stylesheet"> 
  <style type="text/css">
    @page {
      size: a4;
      background-image: url("{{ template }}");
      background-position: center center;
      background-size: cover;
      @frame content_frame {
        left: 165pt;
        width: 420pt;
        top: 150pt;
        height:500pt;
      }
    }
    body, html {
      font-family: ''Lato'', sans-serif !important;
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 297mm;
    }
    .content {
      position: absolute;
      top: 0mm;
      left: 63mm;
      width: 130mm;
      height: 100%;
    }
    .content span, .content p, .content ul, .content li {
      color: #777;
      text-align: left;
      width: 100%;
    }
    .big {
      font-size: 7mm;
    }
    .small {
      font-size: 4.2mm;
    }
    .bold {
      font-weight: bold;
    }
  </style>
</head>
<body>
   <div class="content">
    <span class="big bold" style="top:50mm;">{{ full_name }}</span><br>
    <span class="small" style="top:63mm;">
      hat im {{semester}} an dem Kurs
    </span><br>
    <span class="big bold" style="top: 64mm;">{{course_name}}</span>
    <div class="small" style="top: 90mm;">
      <p>an folgenden Terminen teilgenommen:</p>
      <ul>
       {% for entry in event_entries %}
      <li>{{ entry }}</li>
    {% endfor %}
    </ul>
      <p>
        Bei dem Kurs handelt es sich um ein interdisziplinäres Weiterbildungsangebot im
        Rahmen des Kieler Bildungsclusters opencampus.sh.
        Das Modul wird über das Zentrum für Schlüsselqualifikationen an der Christian-Albrechts-Universität zu Kiel angeboten.
      </p>
</div>
  </div>
</body>
</html>', '2023-12-14 13:40:34.079378+00', '2023-12-14 13:55:01.645233+00');
INSERT INTO public."Program" (id, title, "lectureStart", "lectureEnd", "applicationStart", "defaultApplicationEnd", "achievementRecordUploadDeadline", visibility, "startQuestionnaire", "speakerQuestionnaire", "closingQuestionnaire", "attendanceCertificateTemplateURL", "achievementCertificateTemplateURL", "shortTitle", "defaultMaxMissedSessions", published, type) VALUES (1, 'Unpublished Semester 2022', '2022-09-26', '2022-09-30', NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, 'UNPUB2022', 2, true, 'COURSES');
INSERT INTO public."Program" (id, title, "lectureStart", "lectureEnd", "applicationStart", "defaultApplicationEnd", "achievementRecordUploadDeadline", visibility, "startQuestionnaire", "speakerQuestionnaire", "closingQuestionnaire", "attendanceCertificateTemplateURL", "achievementCertificateTemplateURL", "shortTitle", "defaultMaxMissedSessions", published, type) VALUES (4, 'Past Semester', '2024-05-02', '2024-09-02', NULL, NULL, NULL, true, NULL, NULL, NULL, '/programid_4/participation_certificate_template/opencampus_certificate_template_WS2022.png', '/programid_4/participation_certificate_template/opencampus_attendencecert_template_WS2022.png', 'PAST', 2, false, 'COURSES');
INSERT INTO public."Program" (id, title, "lectureStart", "lectureEnd", "applicationStart", "defaultApplicationEnd", "achievementRecordUploadDeadline", visibility, "startQuestionnaire", "speakerQuestionnaire", "closingQuestionnaire", "attendanceCertificateTemplateURL", "achievementCertificateTemplateURL", "shortTitle", "defaultMaxMissedSessions", published, type) VALUES (6, 'Future Semester', '2025-05-02', '2025-09-02', NULL, NULL, NULL, false, NULL, '', NULL, NULL, NULL, 'FUTURE', 2, false, 'COURSES');
INSERT INTO public."Program" (id, title, "lectureStart", "lectureEnd", "applicationStart", "defaultApplicationEnd", "achievementRecordUploadDeadline", visibility, "startQuestionnaire", "speakerQuestionnaire", "closingQuestionnaire", "attendanceCertificateTemplateURL", "achievementCertificateTemplateURL", "shortTitle", "defaultMaxMissedSessions", published, type) VALUES (3, 'Events', '2023-04-01', '2024-03-13', '2023-03-13', '2023-12-31', '2023-08-01', false, NULL, NULL, NULL, NULL, NULL, 'EVENTS', 2, true, 'EVENTS');
INSERT INTO public."Program" (id, title, "lectureStart", "lectureEnd", "applicationStart", "defaultApplicationEnd", "achievementRecordUploadDeadline", visibility, "startQuestionnaire", "speakerQuestionnaire", "closingQuestionnaire", "attendanceCertificateTemplateURL", "achievementCertificateTemplateURL", "shortTitle", "defaultMaxMissedSessions", published, type) VALUES (2, 'Degrees', '2023-04-17', '2024-06-30', NULL, '2023-04-16', NULL, false, NULL, NULL, NULL, NULL, NULL, 'DEGREES', 2, true, 'DEGREES');
INSERT INTO public."Program" (id, title, "lectureStart", "lectureEnd", "applicationStart", "defaultApplicationEnd", "achievementRecordUploadDeadline", visibility, "startQuestionnaire", "speakerQuestionnaire", "closingQuestionnaire", "attendanceCertificateTemplateURL", "achievementCertificateTemplateURL", "shortTitle", "defaultMaxMissedSessions", published, type) VALUES (5, 'Current Semester', '2024-10-02', '2025-04-02', '2024-09-02', '2024-10-02', '2025-04-02', false, 'https://survey.opencampus.sh/', '', 'https://survey.opencampus.sh/', 'programs/program-5/private/attendance-certificate-template/sprotte.jpg', 'programs/program-5/private/achievement-certificate-template/sprotte.jpg', 'PRESENT', 2, true, 'COURSES');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (6, 'Present Course 3', 'APPLICANTS_INVITED', '3', 'Sed leo libero, bibendum non viverra et, suscipit at quam. Fusce augue est, molestie ut dapibus quis, accumsan at lectus. In id malesuada quam', 'DE', '2025-01-02', '120€', true, true, 2, 'MONDAY', NULL, '2022-12-17 22:19:57.676901+00', '2022-12-19 13:55:11.89556+00', 5, 'test', 'test', 'test', 'test', 'test', 'https://chat.opencampus.sh', 20, '14:00:00', '11:45:00', true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (7, 'This is a Degree', 'APPLICANTS_INVITED', '12,5', 'Sed leo libero, bibendum non viverra et, suscipit at quam. Fusce augue est, molestie ut dapibus quis, accumsan at lectus. In id malesuada quam', 'DE', '2024-12-02', '0', true, false, 2, 'NONE', NULL, '2022-12-17 22:19:57.676901+00', '2022-12-19 13:55:11.89556+00', 2, 'headingDescriptionField1', 'headingDescriptionField2', 'Content Description Field 1', 'Content Description Field 2', 'Lerning Goal 1\nLerning Goal 2', 'https://chat.opencampus.sh', 200, '18:00:00', '20:00:00', true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (8, 'This is an Event', 'APPLICANTS_INVITED', 'NONE', 'Sed leo libero, bibendum non viverra et, suscipit at quam. Fusce augue est, molestie ut dapibus quis, accumsan at lectus. In id malesuada quam', 'DE', '2024-12-02', '0', false, true, 2, 'NONE', NULL, '2022-12-17 22:19:57.676901+00', '2022-12-19 13:55:11.89556+00', 3, 'headingDescriptionField1', 'headingDescriptionField2', 'Content Description Field 1', 'Content Description Field 2', 'Lerning Goal 1\nLerning Goal 2', NULL, 200, '14:00:00', '12:00:00', true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (5, 'Present Course 2', 'APPLICANTS_INVITED', '2.5', '', 'EN', '2025-01-02', '', false, false, 2, 'NONE', NULL, '2022-12-17 22:19:57.676901+00', '2024-11-25 15:43:19.890591+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 20, NULL, NULL, true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (4, 'Present Course 1', 'APPLICANTS_INVITED', '5', 'Integer ornare mauris feugiat malesuada auctor. Integer id justo sit amet metus tristique tincidunt. Donec eu commodo nulla. Donec eros elit, pretium vel nisi', 'DE', '2025-01-02', 'NO_COST', true, true, 2, 'TUESDAY', 'http://localhost:4001/emulated-bucket/public/courseid_4/cover_image/cover_image.jpg', '2022-12-17 22:19:57.676901+00', '2024-11-25 15:36:09.754231+00', 5, 'Morbi sed', 'Sed quis', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam lacinia sapien quis tellus posuere egestas dignissim a quam. Quisque viverra purus vel cursus pulvinar. Nam maximus, ex vel egestas volutpat, libero metus interdum urna, ac tincidunt nisi sem a ligula. Etiam lacus dui, consequat feugiat dui vel, rhoncus sagittis elit. Proin convallis placerat magna eu maximus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Phasellus aliquam euismod diam, nec varius odio semper egestas. Duis ornare luctus mauris, ac scelerisque massa euismod sed. Aliquam lacinia tortor in faucibus dapibus. Ut suscipit tempus nunc vitae aliquet. Sed gravida hendrerit fringilla. Nulla ullamcorper purus eget libero maximus cursus. Ut non iaculis nibh, quis feugiat mi. Quisque gravida lectus enim, ultrices aliquam erat venenatis in. Donec id nisi ullamcorper, rutrum libero et, ullamcorper felis. ', 'Integer ornare mauris feugiat malesuada auctor. Integer id justo sit amet metus tristique tincidunt. Donec eu commodo nulla. Donec eros elit, pretium vel nisi at, euismod pulvinar nisi. Vivamus sit amet felis consequat felis iaculis sodales. Proin volutpat nisl sit amet magna congue, ut auctor orci laoreet. Nullam consectetur ut libero ac congue. Phasellus posuere est quis interdum fermentum. Morbi laoreet purus id diam vestibulum faucibus. Curabitur sollicitudin tortor nec accumsan lacinia. Donec ut dui vitae elit dictum pretium. Sed vel tincidunt leo, in pretium risus. Nunc velit nibh, imperdiet ac libero a, semper accumsan mauris. In vulputate eu neque eget mattis. Nulla auctor sodales cursus. Nunc eu nibh vel turpis interdum blandit eu sed nisi.', 'Sed quis sapien eget urna mattis imperdiet sed ut turpis. Aenean id sem nunc. Praesent efficitur ex in nunc tincidunt, vel lobortis metus feugiat. Quisque ultricies justo non sollicitudin porttitor. Praesent sit amet condimentum velit, a congue velit. Nullam rutrum at nisl sed interdum. Ut ut felis id nulla porttitor imperdiet. Nullam convallis lorem in ex luctus, nec lacinia massa lacinia. Suspendisse pretium sed dolor sit amet iaculis. ', 'https://chat.opencampus.sh', 20, '21:00:00', '19:00:00', true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (1, 'Past Course 1', 'APPLICANTS_INVITED', '5', 'Integer ornare mauris feugiat malesuada auctor. Integer id justo sit amet metus tristique tincidunt. Donec eu commodo nulla. Donec eros elit, pretium vel nisi', 'DE', '2024-05-02', 'NO_COST', true, true, 2, 'TUESDAY', 'http://localhost:4001/emulated-bucket/public/courseid_1/cover_image/cover_image.jpg', '2022-12-17 22:19:57.676901+00', '2024-11-25 15:38:17.18885+00', 4, 'Morbi sed', 'Sed quis', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam lacinia sapien quis tellus posuere egestas dignissim a quam. Quisque viverra purus vel cursus pulvinar. Nam maximus, ex vel egestas volutpat, libero metus interdum urna, ac tincidunt nisi sem a ligula. Etiam lacus dui, consequat feugiat dui vel, rhoncus sagittis elit. Proin convallis placerat magna eu maximus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Phasellus aliquam euismod diam, nec varius odio semper egestas. Duis ornare luctus mauris, ac scelerisque massa euismod sed. Aliquam lacinia tortor in faucibus dapibus. Ut suscipit tempus nunc vitae aliquet. Sed gravida hendrerit fringilla. Nulla ullamcorper purus eget libero maximus cursus. Ut non iaculis nibh, quis feugiat mi. Quisque gravida lectus enim, ultrices aliquam erat venenatis in. Donec id nisi ullamcorper, rutrum libero et, ullamcorper felis. ', 'Integer ornare mauris feugiat malesuada auctor. Integer id justo sit amet metus tristique tincidunt. Donec eu commodo nulla. Donec eros elit, pretium vel nisi at, euismod pulvinar nisi. Vivamus sit amet felis consequat felis iaculis sodales. Proin volutpat nisl sit amet magna congue, ut auctor orci laoreet. Nullam consectetur ut libero ac congue. Phasellus posuere est quis interdum fermentum. Morbi laoreet purus id diam vestibulum faucibus. Curabitur sollicitudin tortor nec accumsan lacinia. Donec ut dui vitae elit dictum pretium. Sed vel tincidunt leo, in pretium risus. Nunc velit nibh, imperdiet ac libero a, semper accumsan mauris. In vulputate eu neque eget mattis. Nulla auctor sodales cursus. Nunc eu nibh vel turpis interdum blandit eu sed nisi.', 'Sed quis sapien eget urna mattis imperdiet sed ut turpis. Aenean id sem nunc. Praesent efficitur ex in nunc tincidunt, vel lobortis metus feugiat. Quisque ultricies justo non sollicitudin porttitor. Praesent sit amet condimentum velit, a congue velit. Nullam rutrum at nisl sed interdum. Ut ut felis id nulla porttitor imperdiet. Nullam convallis lorem in ex luctus, nec lacinia massa lacinia. Suspendisse pretium sed dolor sit amet iaculis. ', 'https://chat.opencampus.sh', 20, '20:00:00', '18:00:00', true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (301, 'Current Course A', 'APPLICANTS_INVITED', '2.5', 'First course of the current semester', 'EN', '2024-10-02', '', false, false, 2, 'NONE', NULL, '2022-12-17 22:19:57.676901+00', '2024-11-25 15:43:19.890591+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 20, NULL, NULL, true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (3, 'Past Course 3', 'APPLICANTS_INVITED', '3', 'Sed leo libero, bibendum non viverra et, suscipit at quam. Fusce augue est, molestie ut dapibus quis, accumsan at lectus. In id malesuada quam', 'DE', '2024-05-02', '120€', true, true, 2, 'MONDAY', NULL, '2022-12-17 22:19:57.676901+00', '2024-12-30 10:15:27.631776+00', 4, 'test', 'test', 'test', 'test', 'test', 'https://chat.opencampus.sh', 20, '20:00:00', '18:00:00', true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (101, 'Introduction to Computer Science', 'APPLICANTS_INVITED', '2.5', 'Fundamental concepts of computer science and programming', 'EN', '2024-04-16', '', false, false, 2, 'NONE', NULL, '2022-12-17 22:19:57.676901+00', '2024-11-25 15:43:19.890591+00', 2, NULL, NULL, NULL, NULL, NULL, NULL, 20, NULL, NULL, true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (201, 'Past Course A', 'APPLICANTS_INVITED', '2.5', 'First course of the past semester', 'EN', '2024-05-02', '', false, false, 2, 'NONE', NULL, '2022-12-17 22:19:57.676901+00', '2024-11-25 15:43:19.890591+00', 4, NULL, NULL, NULL, NULL, NULL, NULL, 20, NULL, NULL, true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (203, 'Past Course C', 'APPLICANTS_INVITED', '2.5', 'Third course of the past semester', 'EN', '2024-05-02', '', false, false, 2, 'NONE', NULL, '2022-12-17 22:19:57.676901+00', '2024-11-25 15:43:19.890591+00', 4, NULL, NULL, NULL, NULL, NULL, NULL, 20, NULL, NULL, true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (303, 'Current Course C', 'APPLICANTS_INVITED', '2.5', 'Third course of the current semester', 'EN', '2024-10-02', '', false, false, 2, 'NONE', NULL, '2022-12-17 22:19:57.676901+00', '2024-11-25 15:43:19.890591+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 20, NULL, NULL, true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (2, 'Past Course 2', 'APPLICANTS_INVITED', '2.5', '', 'EN', '2024-05-02', '', false, false, 2, 'NONE', NULL, '2022-12-17 22:19:57.676901+00', '2025-01-10 23:38:58.596346+00', 4, NULL, NULL, NULL, NULL, NULL, NULL, 20, NULL, NULL, false, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (202, 'Past Course B', 'APPLICANTS_INVITED', '2.5', 'Second course of the past semester', 'EN', '2024-05-02', '', true, true, 2, 'NONE', NULL, '2022-12-17 22:19:57.676901+00', '2025-02-17 14:18:25.768458+00', 4, NULL, NULL, NULL, NULL, NULL, NULL, 20, NULL, NULL, true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES (302, 'Current Course B', 'APPLICANTS_INVITED', '2.5', 'Second course of the current semester', 'EN', '2025-04-02', '', true, true, 2, 'NONE', NULL, '2022-12-17 22:19:57.676901+00', '2025-02-28 11:24:53.954043+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 20, NULL, NULL, true, NULL, 'APPROVAL_WITH_INPUT');
INSERT INTO public."AchievementOptionCourse" (id, "achievementOptionId", "courseId", created_at, updated_at) VALUES (1, 1, 1, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00');
INSERT INTO public."AchievementOptionCourse" (id, "achievementOptionId", "courseId", created_at, updated_at) VALUES (2, 2, 1, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00');
INSERT INTO public."AchievementOptionCourse" (id, "achievementOptionId", "courseId", created_at, updated_at) VALUES (3, 2, 2, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00');
INSERT INTO public."AchievementOptionCourse" (id, "achievementOptionId", "courseId", created_at, updated_at) VALUES (4, 3, 4, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00');
INSERT INTO public."AchievementOptionCourse" (id, "achievementOptionId", "courseId", created_at, updated_at) VALUES (5, 4, 4, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00');
INSERT INTO public."AchievementOptionCourse" (id, "achievementOptionId", "courseId", created_at, updated_at) VALUES (7, 2, 302, '2025-02-19 17:13:19.621394+00', '2025-02-19 17:13:19.621394+00');
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (1, 'Robotics Research Center', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-01-17 20:39:00+00', '2022-04-20 20:33:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (2, 'General Organization', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-05-17 02:43:00+00', '2022-01-31 23:01:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (3, 'National Defense Department', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-01-31 18:03:00+00', '2020-10-19 16:54:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (4, 'Technical South College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-10-02 02:39:00+00', '2021-09-22 17:50:00+00', NULL, '["TECHNICAL SOUTH COLLEGE"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (5, 'Robotics Research Center 592', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-02-14 05:07:00+00', '2022-02-25 03:00:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (6, 'Independent Marketing Consulting', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-11-15 04:54:00+00', '2021-03-21 00:19:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (7, 'Wildlife Association', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-01-18 08:36:00+00', '2022-09-30 22:32:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (8, 'State Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-03-09 00:02:00+00', '2020-06-08 17:25:00+00', NULL, '["STATE INSTITUTE OF TECHNOLOGY", "State_Institute_of_Technology"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (9, 'National Health Agency', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-01-13 18:44:00+00', '2021-01-05 08:41:00+00', NULL, '["NATIONAL HEALTH AGENCY", "National_Health_Agency"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (10, 'DataIndustries', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-06-24 17:35:00+00', '2023-05-15 20:05:00+00', NULL, '["DATAINDUSTRIES", "DataIndustries", "D"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (11, 'Independent Consulting Solutions', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-08-21 06:39:00+00', '2021-03-15 09:39:00+00', NULL, '["INDEPENDENT CONSULTING SOLUTIONS", "Independent_Consulting_Solutions"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (12, 'State East College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-05-11 12:30:00+00', '2022-11-26 14:42:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (13, 'High School', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-04-08 01:08:00+00', '2022-05-24 02:10:00+00', NULL, '["HIGH SCHOOL", "High_School"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (14, 'Elementary School', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-05-24 10:48:00+00', '2022-11-02 19:57:00+00', NULL, '["ELEMENTARY SCHOOL", "Elementary_School"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (15, 'Elementary Academy', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-09-09 16:43:00+00', '2022-08-29 08:06:00+00', NULL, '["ELEMENTARY ACADEMY", "Elementary_Academy", "EA"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (16, 'Ocean Research Center', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-02-09 05:50:00+00', '2020-07-26 23:57:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (17, 'General Services', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-01-14 08:33:00+00', '2021-03-11 21:36:00+00', NULL, '["GENERAL SERVICES", "General_Services", "GS"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (18, 'International School', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-12-26 22:34:00+00', '2022-01-17 09:14:00+00', NULL, '["INTERNATIONAL SCHOOL", "International_School"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (19, 'Independent Research Services', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-08-25 04:48:00+00', '2022-06-03 04:23:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (20, 'Quantum Research Center', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-01-01 09:54:00+00', '2022-06-22 05:56:00+00', NULL, '["QUANTUM RESEARCH CENTER"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (21, 'West Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-07-23 02:25:00+00', '2023-05-12 04:32:00+00', NULL, '["WEST INSTITUTE OF TECHNOLOGY", "West_Institute_of_Technology"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (22, 'Global Health Initiative', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-11-05 20:33:00+00', '2021-01-03 06:23:00+00', NULL, '["GLOBAL HEALTH INITIATIVE", "Global_Health_Initiative"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (23, 'High School 110', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-09-02 11:08:00+00', '2021-08-30 02:42:00+00', NULL, '["HIGH SCHOOL 110", "High_School_110", "HS1"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (24, 'AI Research Institute', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-02-08 01:28:00+00', '2021-03-21 04:52:00+00', NULL, '["AI RESEARCH INSTITUTE"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (25, 'General Solutions', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-04-15 05:19:00+00', '2021-03-21 09:25:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (26, 'Biomedical Institute for Advanced Studies', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-11-07 11:09:00+00', '2021-06-02 20:22:00+00', NULL, '["BIOMEDICAL INSTITUTE FOR ADVANCED STUDIES"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (27, 'Preparatory Academy', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-01-22 20:15:00+00', '2020-09-09 11:55:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (28, 'GreenTechnologies', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-10-31 05:38:00+00', '2020-11-19 17:38:00+00', NULL, '["GREENTECHNOLOGIES", "GreenTechnologies"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (29, 'TechIndustries', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-07-09 02:13:00+00', '2023-06-04 22:01:00+00', NULL, '["TECHINDUSTRIES", "TechIndustries", "T"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (30, 'National Education Commission', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-04-05 03:52:00+00', '2022-02-10 12:21:00+00', NULL, '["NATIONAL EDUCATION COMMISSION", "National_Education_Commission", "NEC"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (31, 'National Transport Authority', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-01-15 17:16:00+00', '2021-01-13 03:15:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (32, 'Independent Consulting Solutions 46', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-04-23 08:58:00+00', '2021-01-27 13:44:00+00', NULL, '["INDEPENDENT CONSULTING SOLUTIONS 46", "Independent_Consulting_Solutions_46"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (33, 'Wildlife Trust', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-08-11 11:18:00+00', '2021-08-29 09:03:00+00', NULL, '["WILDLIFE TRUST", "Wildlife_Trust", "WT"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (34, 'National Environmental Agency', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-01-19 02:34:00+00', '2022-11-25 22:26:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (35, 'National West College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-12-03 01:05:00+00', '2021-07-29 17:51:00+00', NULL, '["NATIONAL WEST COLLEGE"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (36, 'Quantum Institute for Advanced Studies', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-01-19 16:48:00+00', '2022-11-16 23:14:00+00', NULL, '["QUANTUM INSTITUTE FOR ADVANCED STUDIES", "Quantum_Institute_for_Advanced_Studies", "QIFAS"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (37, 'Specialized Solutions', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-09-24 03:50:00+00', '2023-03-22 01:51:00+00', NULL, '["SPECIALIZED SOLUTIONS", "Specialized_Solutions", "SS"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (38, 'DataTechnologies', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-12-28 12:11:00+00', '2022-05-14 17:38:00+00', NULL, '["DATATECHNOLOGIES", "DataTechnologies"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (39, 'International South University', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-07-22 17:20:00+00', '2021-09-20 15:54:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (40, 'TechSolutions', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-07-01 18:21:00+00', '2021-10-09 01:05:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (41, 'State Central University', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-02-11 09:48:00+00', '2020-02-24 00:55:00+00', NULL, '["STATE CENTRAL UNIVERSITY", "State_Central_University"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (42, 'Advanced Services', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-04-10 07:01:00+00', '2023-03-29 22:55:00+00', NULL, '["ADVANCED SERVICES", "Advanced_Services"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (43, 'Quantum Research Institute', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-09-09 03:31:00+00', '2023-01-06 00:50:00+00', NULL, '["QUANTUM RESEARCH INSTITUTE", "Quantum_Research_Institute"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (44, 'National Energy Commission', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-07-09 09:29:00+00', '2023-03-29 16:11:00+00', NULL, '["NATIONAL ENERGY COMMISSION"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (45, 'General Organization 417', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-05-19 04:23:00+00', '2021-11-06 19:36:00+00', NULL, '["GENERAL ORGANIZATION 417"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (46, 'High Academy', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-01-18 06:53:00+00', '2021-04-24 04:01:00+00', NULL, '["HIGH ACADEMY"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (47, 'High Academy 892', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-08-08 12:09:00+00', '2022-05-29 01:46:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (48, 'Independent Research Solutions', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-08-12 23:00:00+00', '2022-04-16 20:48:00+00', NULL, '["INDEPENDENT RESEARCH SOLUTIONS", "Independent_Research_Solutions"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (49, 'Ocean Research Center 750', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-09-22 08:33:00+00', '2022-04-17 15:51:00+00', NULL, '["OCEAN RESEARCH CENTER 750", "Ocean_Research_Center_750", "ORC7"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (50, 'State Institute of Technology 595', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-09-08 11:02:00+00', '2022-06-09 05:16:00+00', NULL, '["STATE INSTITUTE OF TECHNOLOGY 595"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (51, 'Independent Marketing Services', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-01-28 03:52:00+00', '2020-11-03 05:16:00+00', NULL, '["INDEPENDENT MARKETING SERVICES", "Independent_Marketing_Services", "IMS"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (52, 'General Organization 440', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-10-22 03:59:00+00', '2021-04-06 08:15:00+00', NULL, '["GENERAL ORGANIZATION 440", "General_Organization_440"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (53, 'Wildlife Trust 983', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-03-04 18:07:00+00', '2023-01-06 13:21:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (54, 'State East College 211', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-06-25 15:00:00+00', '2021-07-23 13:48:00+00', NULL, '["STATE EAST COLLEGE 211", "State_East_College_211"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (55, 'Elementary Academy 214', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-08-16 23:53:00+00', '2021-01-04 21:59:00+00', NULL, '["ELEMENTARY ACADEMY 214", "Elementary_Academy_214"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (56, 'BioSystems', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-06-29 18:36:00+00', '2021-06-04 13:45:00+00', NULL, '["BIOSYSTEMS", "BioSystems", "B"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (57, 'National West University', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-07-04 20:07:00+00', '2020-09-02 07:39:00+00', NULL, '["NATIONAL WEST UNIVERSITY", "National_West_University"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (58, 'National Agriculture Bureau', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-05-17 18:28:00+00', '2021-10-05 06:01:00+00', NULL, '["NATIONAL AGRICULTURE BUREAU", "National_Agriculture_Bureau"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (59, 'International School 835', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-09-07 14:27:00+00', '2022-10-12 18:25:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (60, 'MedSystems', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-05-22 07:54:00+00', '2023-04-05 06:02:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (61, 'National Energy Authority', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-08-18 01:34:00+00', '2021-07-22 14:52:00+00', NULL, '["NATIONAL ENERGY AUTHORITY"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (62, 'National East Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-05-23 18:31:00+00', '2021-12-25 18:08:00+00', NULL, '["NATIONAL EAST INSTITUTE OF TECHNOLOGY"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (63, 'National Environmental Agency 926', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-04-14 15:00:00+00', '2021-11-08 18:50:00+00', NULL, '["NATIONAL ENVIRONMENTAL AGENCY 926"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (64, 'TechCorporation', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-06-11 06:52:00+00', '2021-08-31 13:19:00+00', NULL, '["TECHCORPORATION"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (65, 'Independent Marketing Solutions', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2022-05-26 01:49:00+00', '2023-02-09 08:44:00+00', NULL, '["INDEPENDENT MARKETING SOLUTIONS"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (66, 'Independent Research Consulting', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-10-17 17:37:00+00', '2021-12-28 17:51:00+00', NULL, '["INDEPENDENT RESEARCH CONSULTING", "Independent_Research_Consulting", "IRC"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (67, 'Independent Consulting Solutions 717', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2022-07-21 22:36:00+00', '2022-10-07 17:18:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (68, 'Quantum Institute for Advanced Studies 543', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-10-10 01:58:00+00', '2022-07-04 09:45:00+00', NULL, '["QUANTUM INSTITUTE FOR ADVANCED STUDIES 543", "Quantum_Institute_for_Advanced_Studies_543", "QIFAS5"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (69, 'High Academy 139', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-04-10 21:39:00+00', '2022-11-16 23:34:00+00', NULL, '["HIGH ACADEMY 139", "High_Academy_139", "HA1"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (70, 'West Institute of Technology 422', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-06-09 00:47:00+00', '2022-08-08 12:33:00+00', NULL, '["WEST INSTITUTE OF TECHNOLOGY 422", "West_Institute_of_Technology_422", "WIOT4"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (71, 'Children''s Association', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-05-14 10:05:00+00', '2023-03-12 16:20:00+00', NULL, '["CHILDREN''S ASSOCIATION"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (72, 'National Defense Agency', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-02-21 14:43:00+00', '2021-12-28 23:25:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (73, 'International Academy', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-05-15 11:34:00+00', '2020-10-21 22:04:00+00', NULL, '["INTERNATIONAL ACADEMY", "International_Academy"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (74, 'Elementary School 881', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-07-07 21:34:00+00', '2020-12-03 21:42:00+00', NULL, '["ELEMENTARY SCHOOL 881"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (75, 'Humanitarian Foundation', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-06-03 09:21:00+00', '2022-08-12 17:36:00+00', NULL, '["HUMANITARIAN FOUNDATION"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (76, 'East Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-09-08 14:08:00+00', '2022-04-17 00:15:00+00', NULL, '["EAST INSTITUTE OF TECHNOLOGY"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (77, 'Humanitarian Association', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-08-26 22:08:00+00', '2022-09-30 12:45:00+00', NULL, '["HUMANITARIAN ASSOCIATION"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (78, 'DigitalSystems', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-04-28 14:51:00+00', '2021-02-02 10:08:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (79, 'Professional Services', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-02-24 02:54:00+00', '2022-04-07 10:38:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (80, 'International Academy 834', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-12-13 12:36:00+00', '2021-06-23 04:01:00+00', NULL, '["INTERNATIONAL ACADEMY 834"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (81, 'Advanced Organization', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-12-10 21:44:00+00', '2021-09-23 07:07:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (82, 'Humanitarian Association 374', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-06-20 09:09:00+00', '2022-10-24 15:17:00+00', NULL, '["HUMANITARIAN ASSOCIATION 374"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (83, 'Independent Marketing Solutions 620', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-06-23 10:38:00+00', '2021-06-25 03:10:00+00', NULL, '["INDEPENDENT MARKETING SOLUTIONS 620", "Independent_Marketing_Solutions_620", "IMS6"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (84, 'Space Research Center', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-08-14 01:32:00+00', '2021-02-22 17:47:00+00', NULL, '["SPACE RESEARCH CENTER", "Space_Research_Center"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (85, 'BioCorporation', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-03-22 07:17:00+00', '2022-10-27 13:20:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (86, 'Elementary School 375', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-01-25 16:37:00+00', '2022-04-26 04:37:00+00', NULL, '["ELEMENTARY SCHOOL 375"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (87, 'BioSystems 994', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-05-23 18:54:00+00', '2021-09-21 13:33:00+00', NULL, '["BIOSYSTEMS 994", "BioSystems_994"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (88, 'General Organization 101', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-10-27 03:45:00+00', '2021-10-02 16:16:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (89, 'Preparatory Academy 934', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-11-12 13:11:00+00', '2022-06-28 08:40:00+00', NULL, '["PREPARATORY ACADEMY 934", "Preparatory_Academy_934"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (90, 'Independent Software Studio', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2022-07-27 00:50:00+00', '2022-08-02 20:52:00+00', NULL, '["INDEPENDENT SOFTWARE STUDIO"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (91, 'AITechnologies', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-05-12 13:58:00+00', '2021-09-21 19:58:00+00', NULL, '["AITECHNOLOGIES", "AITechnologies", "A"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (92, 'GreenCorporation', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-08-09 09:51:00+00', '2020-12-06 08:57:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (93, 'Education Association', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-10-08 09:29:00+00', '2022-07-20 16:02:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (94, 'Wildlife Alliance', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-07-13 21:57:00+00', '2022-10-30 21:52:00+00', NULL, '["WILDLIFE ALLIANCE", "Wildlife_Alliance"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (95, 'DataSystems', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-06-29 17:39:00+00', '2021-11-04 02:20:00+00', NULL, '["DATASYSTEMS", "DataSystems"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (96, 'Wildlife Foundation', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-05-30 22:47:00+00', '2021-03-31 03:55:00+00', NULL, '["WILDLIFE FOUNDATION", "Wildlife_Foundation"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (97, 'Independent Content Solutions', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-01-01 20:38:00+00', '2021-01-03 08:19:00+00', NULL, '["INDEPENDENT CONTENT SOLUTIONS", "Independent_Content_Solutions"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (98, 'GreenTechnologies 233', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-04-24 16:25:00+00', '2023-02-24 14:21:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (99, 'Independent Design Solutions', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-07-28 12:11:00+00', '2022-04-23 08:59:00+00', NULL, '["INDEPENDENT DESIGN SOLUTIONS", "Independent_Design_Solutions", "IDS"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (100, 'National Education Agency', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-10-10 07:29:00+00', '2021-02-15 16:45:00+00', NULL, '["NATIONAL EDUCATION AGENCY", "National_Education_Agency"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (101, 'High School 389', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-07-14 11:03:00+00', '2023-05-09 08:30:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (102, 'National Energy Agency', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-04-13 16:45:00+00', '2022-03-26 16:31:00+00', NULL, '["NATIONAL ENERGY AGENCY", "National_Energy_Agency"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (103, 'High Academy 719', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-09-04 16:00:00+00', '2020-09-10 14:04:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (104, 'Independent Software Consulting', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-06-02 00:50:00+00', '2022-02-21 00:31:00+00', NULL, '["INDEPENDENT SOFTWARE CONSULTING", "Independent_Software_Consulting", "ISC"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (105, 'Specialized Solutions 147', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-01-06 19:56:00+00', '2021-03-13 16:18:00+00', NULL, '["SPECIALIZED SOLUTIONS 147", "Specialized_Solutions_147"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (106, 'Independent Design Consulting', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-05-29 23:53:00+00', '2021-05-02 08:34:00+00', NULL, '["INDEPENDENT DESIGN CONSULTING", "Independent_Design_Consulting"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (107, 'BioTechnologies', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-02-29 03:57:00+00', '2020-07-25 06:10:00+00', NULL, '["BIOTECHNOLOGIES", "BioTechnologies"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (108, 'Children''s Foundation', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-09-06 02:16:00+00', '2021-04-18 22:19:00+00', NULL, '["CHILDREN''S FOUNDATION", "Children''s_Foundation"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (109, 'Quantum Institute for Advanced Studies 164', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-07-17 03:28:00+00', '2023-01-13 04:56:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (110, 'GreenIndustries', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-06-23 04:01:00+00', '2023-01-02 08:03:00+00', NULL, '["GREENINDUSTRIES", "GreenIndustries"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (111, 'Humanitarian Alliance', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-09-13 18:06:00+00', '2020-12-03 07:34:00+00', NULL, '["HUMANITARIAN ALLIANCE", "Humanitarian_Alliance"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (112, 'AISystems', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-02-20 15:36:00+00', '2022-06-08 04:08:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (113, 'Wildlife Alliance 403', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-03-29 11:55:00+00', '2022-07-20 12:23:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (114, 'Independent Research Services 447', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-05-27 05:34:00+00', '2022-05-10 15:31:00+00', NULL, '["INDEPENDENT RESEARCH SERVICES 447", "Independent_Research_Services_447", "IRS4"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (115, 'Children''s Foundation 944', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-10-20 03:00:00+00', '2021-08-31 12:31:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (116, 'Robotics Research Center 48', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-03-11 05:16:00+00', '2020-11-28 02:40:00+00', NULL, '["ROBOTICS RESEARCH CENTER 48", "Robotics_Research_Center_48"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (117, 'Specialized Solutions 508', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-10-27 19:48:00+00', '2021-01-22 13:10:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (118, 'Children''s Initiative', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-01-25 11:01:00+00', '2022-02-18 11:24:00+00', NULL, '["CHILDREN''S INITIATIVE"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (119, 'Global Health Foundation', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-01-16 10:28:00+00', '2021-12-30 11:10:00+00', NULL, '["GLOBAL HEALTH FOUNDATION", "Global_Health_Foundation", "GHF"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (120, 'QuantumSolutions', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-08-20 19:24:00+00', '2023-07-28 15:11:00+00', NULL, '["QUANTUMSOLUTIONS"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (121, 'Space Institute for Advanced Studies', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-04-12 20:46:00+00', '2020-08-13 15:53:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (122, 'Elementary School 370', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-09-08 07:24:00+00', '2021-02-02 07:18:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (123, ' Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-01-12 22:55:00+00', '2022-10-11 11:59:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (124, 'Advanced Group', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-03-30 16:43:00+00', '2021-08-05 08:31:00+00', NULL, '["ADVANCED GROUP", "Advanced_Group", "AG"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (125, 'BioIndustries', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-07-11 15:45:00+00', '2023-04-03 08:27:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (126, 'National Health Authority', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-12-02 00:11:00+00', '2021-12-31 11:21:00+00', NULL, '["NATIONAL HEALTH AUTHORITY", "National_Health_Authority"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (127, 'National Transport Bureau', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-01-24 10:42:00+00', '2021-02-06 17:53:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (128, 'High Academy 916', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-09-13 06:43:00+00', '2021-01-20 21:03:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (129, 'Space Institute for Advanced Studies 1', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-01-08 07:15:00+00', '2021-08-11 20:57:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (130, 'TechIndustries 77', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-08-02 01:13:00+00', '2021-12-17 12:50:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (131, 'Education Foundation', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-04-12 07:13:00+00', '2023-02-09 02:43:00+00', NULL, '["EDUCATION FOUNDATION", "Education_Foundation"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (132, 'Neural Research Institute', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-05-17 10:19:00+00', '2021-07-19 02:49:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (133, 'Elementary School 129', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-04-08 13:46:00+00', '2021-02-22 23:36:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (134, 'Independent Design Studio', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2022-02-07 22:36:00+00', '2022-03-17 05:46:00+00', NULL, '["INDEPENDENT DESIGN STUDIO", "Independent_Design_Studio"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (135, 'Elementary School 729', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-08-04 09:11:00+00', '2020-11-02 14:51:00+00', NULL, '["ELEMENTARY SCHOOL 729", "Elementary_School_729", "ES7"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (136, 'Humanitarian Initiative', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-11-30 21:54:00+00', '2021-04-14 01:37:00+00', NULL, '["HUMANITARIAN INITIATIVE"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (137, 'Advanced Solutions', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-03-09 20:11:00+00', '2022-05-16 03:23:00+00', NULL, '["ADVANCED SOLUTIONS"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (138, 'Advanced Organization 316', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-06-23 15:00:00+00', '2020-09-15 17:03:00+00', NULL, '["ADVANCED ORGANIZATION 316"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (139, 'Independent Consulting Solutions 236', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-08-23 03:32:00+00', '2021-06-18 14:25:00+00', NULL, '["INDEPENDENT CONSULTING SOLUTIONS 236", "Independent_Consulting_Solutions_236"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (140, 'National Agriculture Commission', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-12-07 14:37:00+00', '2021-01-31 20:06:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (141, 'AI Institute for Advanced Studies', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-11-19 02:40:00+00', '2021-05-03 17:10:00+00', NULL, '["AI INSTITUTE FOR ADVANCED STUDIES", "AI_Institute_for_Advanced_Studies"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (142, 'TechIndustries 703', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-07-14 19:55:00+00', '2021-11-27 04:36:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (143, 'GreenSystems', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-06-23 15:54:00+00', '2022-05-03 15:42:00+00', NULL, '["GREENSYSTEMS", "GreenSystems"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (144, 'Preparatory Academy 21', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-01-18 07:47:00+00', '2020-04-15 15:27:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (145, 'Advanced Organization 475', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-02-10 09:37:00+00', '2021-01-03 23:08:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (146, 'General Organization 492', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-09-25 22:29:00+00', '2021-06-01 15:13:00+00', NULL, '["GENERAL ORGANIZATION 492", "General_Organization_492"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (147, 'National Health Bureau', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-05-29 09:54:00+00', '2020-11-29 15:52:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (148, 'Elementary Academy 841', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-12-03 02:22:00+00', '2021-09-22 10:33:00+00', NULL, '["ELEMENTARY ACADEMY 841", "Elementary_Academy_841", "EA8"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (149, 'GreenCorporation 967', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-05-31 04:31:00+00', '2022-10-06 15:56:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (150, 'QuantumSystems', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-11-07 11:33:00+00', '2021-02-05 07:38:00+00', NULL, '["QUANTUMSYSTEMS", "QuantumSystems"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (151, 'National Education Commission 978', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-03-12 09:11:00+00', '2022-08-24 18:43:00+00', NULL, '["NATIONAL EDUCATION COMMISSION 978"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (152, 'National Energy Commission 324', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-11-30 13:55:00+00', '2022-01-28 05:35:00+00', NULL, '["NATIONAL ENERGY COMMISSION 324", "National_Energy_Commission_324", "NEC3"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (153, 'South Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-09-24 02:07:00+00', '2022-02-27 01:07:00+00', NULL, '["SOUTH INSTITUTE OF TECHNOLOGY"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (154, 'Space Research Institute', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-11-30 00:30:00+00', '2021-01-18 02:12:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (155, 'Independent Software Services', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-04-22 18:58:00+00', '2022-03-25 16:20:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (156, 'AISolutions', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-03-02 15:52:00+00', '2022-12-01 01:36:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (157, 'DigitalIndustries', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-09-06 03:01:00+00', '2023-04-21 17:51:00+00', NULL, '["DIGITALINDUSTRIES"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (158, 'Global Health Trust', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-05-12 06:10:00+00', '2020-09-12 00:10:00+00', NULL, '["GLOBAL HEALTH TRUST", "Global_Health_Trust"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (159, 'Independent Consulting Studio', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-03-23 20:14:00+00', '2020-09-08 14:28:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (161, 'QuantumCorporation', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-10-28 09:47:00+00', '2022-07-02 06:16:00+00', NULL, '["QUANTUMCORPORATION"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (162, 'General Solutions 155', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-12-28 09:59:00+00', '2021-08-27 18:12:00+00', NULL, '["GENERAL SOLUTIONS 155", "General_Solutions_155", "GS1"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (163, 'National Health Commission', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-07-04 15:22:00+00', '2022-10-08 17:17:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (164, 'International North College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-05-01 10:35:00+00', '2022-03-07 16:10:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (165, 'Advanced Organization 754', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-11-09 09:17:00+00', '2021-07-28 08:02:00+00', NULL, '["ADVANCED ORGANIZATION 754", "Advanced_Organization_754", "AO7"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (166, 'DataIndustries 539', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-07-31 11:18:00+00', '2021-03-14 19:43:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (167, 'Independent Software Solutions', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-11-05 15:06:00+00', '2022-06-23 08:21:00+00', NULL, '["INDEPENDENT SOFTWARE SOLUTIONS", "Independent_Software_Solutions"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (168, 'Elementary School 988', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-07-20 01:35:00+00', '2020-09-17 02:22:00+00', NULL, '["ELEMENTARY SCHOOL 988", "Elementary_School_988", "ES9"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (169, 'South University', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-08-30 21:12:00+00', '2021-05-12 03:59:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (170, 'Independent Consulting Studio 259', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-05-08 17:25:00+00', '2020-06-13 11:25:00+00', NULL, '["INDEPENDENT CONSULTING STUDIO 259", "Independent_Consulting_Studio_259"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (171, 'DataCorporation', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-02-09 18:21:00+00', '2021-01-01 04:56:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (172, 'National Defense Commission', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-05-29 21:12:00+00', '2021-05-15 13:52:00+00', NULL, '["NATIONAL DEFENSE COMMISSION", "National_Defense_Commission"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (173, 'Preparatory Academy 267', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-01-16 01:29:00+00', '2020-12-11 17:09:00+00', NULL, '["PREPARATORY ACADEMY 267"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (174, 'Materials Research Institute', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-02-14 11:27:00+00', '2020-07-03 02:24:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (175, 'General Organization 6', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-11-20 07:11:00+00', '2022-09-26 09:55:00+00', NULL, '["GENERAL ORGANIZATION 6", "General_Organization_6", "GO6"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (176, 'BioSolutions', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-01-03 04:47:00+00', '2022-08-31 14:18:00+00', NULL, '["BIOSOLUTIONS", "BioSolutions"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (177, 'Preparatory School', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-01-23 04:22:00+00', '2021-10-08 18:24:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (178, 'Global Health Alliance', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-10-10 23:18:00+00', '2021-04-30 21:19:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (179, 'Neural Institute for Advanced Studies', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-05-28 14:54:00+00', '2023-01-02 09:49:00+00', NULL, '["NEURAL INSTITUTE FOR ADVANCED STUDIES", "Neural_Institute_for_Advanced_Studies"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (180, 'Preparatory School 852', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-02-08 23:57:00+00', '2021-07-26 03:18:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (181, 'Preparatory School 958', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-08-15 07:28:00+00', '2023-01-24 22:47:00+00', NULL, '["PREPARATORY SCHOOL 958", "Preparatory_School_958"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (182, 'Elementary School 74', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-01-04 08:17:00+00', '2021-01-08 23:31:00+00', NULL, '["ELEMENTARY SCHOOL 74", "Elementary_School_74"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (183, 'Advanced Solutions 316', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-03-26 21:42:00+00', '2022-03-09 18:35:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (184, 'DigitalTechnologies', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-08-27 14:01:00+00', '2023-04-16 17:29:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (185, 'DataTechnologies 144', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-01-10 10:22:00+00', '2022-04-25 13:45:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (186, 'Independent Marketing Studio', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-07-03 23:42:00+00', '2021-03-03 03:45:00+00', NULL, '["INDEPENDENT MARKETING STUDIO", "Independent_Marketing_Studio"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (187, 'Humanitarian Trust', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-05-10 06:22:00+00', '2021-09-20 19:45:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (188, 'Space Research Center 193', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-05-30 20:33:00+00', '2021-01-25 06:13:00+00', NULL, '["SPACE RESEARCH CENTER 193", "Space_Research_Center_193", "SRC1"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (189, 'TechIndustries 654', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-08-24 22:40:00+00', '2020-11-15 12:51:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (190, 'Children''s Alliance', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-08-01 16:13:00+00', '2022-02-23 13:13:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (191, 'Independent Marketing Solutions 464', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-12-29 00:59:00+00', '2022-05-19 14:33:00+00', NULL, '["INDEPENDENT MARKETING SOLUTIONS 464", "Independent_Marketing_Solutions_464", "IMS4"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (192, 'West College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-02-19 00:17:00+00', '2022-03-01 05:31:00+00', NULL, '["WEST COLLEGE", "West_College", "WC"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (193, 'General Organization 757', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-06-20 19:04:00+00', '2022-07-25 12:41:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (194, 'Middle School', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-08-30 08:58:00+00', '2023-03-30 01:01:00+00', NULL, '["MIDDLE SCHOOL"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (195, 'High School 138', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-03-01 22:47:00+00', '2022-10-26 19:50:00+00', NULL, '["HIGH SCHOOL 138", "High_School_138"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (196, 'Independent Research Solutions 82', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-12-22 11:22:00+00', '2021-04-16 23:49:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (197, 'General Group', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-04-20 11:57:00+00', '2021-07-01 19:03:00+00', NULL, '["GENERAL GROUP"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (198, 'National West Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-05-20 03:20:00+00', '2020-09-10 14:18:00+00', NULL, '["NATIONAL WEST INSTITUTE OF TECHNOLOGY"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (238, 'TechTechnologies', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-08-27 13:48:00+00', '2023-07-06 03:51:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (199, 'National Health Bureau 167', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-11-17 07:54:00+00', '2022-09-03 03:09:00+00', NULL, '["NATIONAL HEALTH BUREAU 167", "National_Health_Bureau_167", "NHB1"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (200, 'Independent Content Services', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-09-18 08:42:00+00', '2021-05-07 18:27:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (201, 'Specialized Solutions 64', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-03-03 19:38:00+00', '2020-08-28 02:20:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (202, 'National Health Bureau 222', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-08-30 02:37:00+00', '2023-06-26 07:17:00+00', NULL, '["NATIONAL HEALTH BUREAU 222"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (203, 'National Transport Department', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-11-13 17:03:00+00', '2020-12-14 02:25:00+00', NULL, '["NATIONAL TRANSPORT DEPARTMENT"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (204, 'Wildlife Association 260', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-09-20 10:14:00+00', '2023-01-19 02:07:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (205, 'Global Health Initiative 252', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-12-30 12:08:00+00', '2022-08-13 01:44:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (206, 'Advanced Services 148', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-09-25 10:18:00+00', '2021-09-14 14:32:00+00', NULL, '["ADVANCED SERVICES 148", "Advanced_Services_148", "AS1"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (207, 'Humanitarian Initiative 77', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-09-07 20:00:00+00', '2022-06-22 09:35:00+00', NULL, '["HUMANITARIAN INITIATIVE 77", "Humanitarian_Initiative_77"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (208, 'DigitalIndustries 464', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-04-22 16:34:00+00', '2020-11-17 15:50:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (209, 'National Defense Department 149', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-07-25 09:48:00+00', '2022-03-13 01:06:00+00', NULL, '["NATIONAL DEFENSE DEPARTMENT 149", "National_Defense_Department_149", "NDD1"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (210, 'National West Institute of Technology 573', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-03-18 15:04:00+00', '2022-04-10 20:56:00+00', NULL, '["NATIONAL WEST INSTITUTE OF TECHNOLOGY 573", "National_West_Institute_of_Technology_573"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (211, 'Preparatory Academy 675', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-12-28 02:52:00+00', '2021-02-09 09:00:00+00', NULL, '["PREPARATORY ACADEMY 675"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (212, 'Biomedical Research Center', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-10-14 10:23:00+00', '2021-05-06 18:50:00+00', NULL, '["BIOMEDICAL RESEARCH CENTER", "Biomedical_Research_Center", "BRC"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (213, 'Humanitarian Alliance 572', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-10-29 22:08:00+00', '2022-01-27 20:49:00+00', NULL, '["HUMANITARIAN ALLIANCE 572"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (214, 'High School 908', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-02-14 08:02:00+00', '2020-10-06 00:28:00+00', NULL, '["HIGH SCHOOL 908", "High_School_908", "HS9"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (215, 'Central College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-08-31 10:27:00+00', '2021-06-22 19:09:00+00', NULL, '["CENTRAL COLLEGE", "Central_College", "CC"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (216, 'Independent Software Consulting 476', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-08-19 05:02:00+00', '2021-11-01 10:49:00+00', NULL, '["INDEPENDENT SOFTWARE CONSULTING 476", "Independent_Software_Consulting_476", "ISC4"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (217, 'Middle Academy', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-05-15 14:38:00+00', '2022-05-16 18:20:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (218, 'High School 68', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-04-21 06:40:00+00', '2022-11-28 11:59:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (219, 'International School 480', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-05-10 12:04:00+00', '2021-04-20 05:10:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (220, 'East University', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-10-22 13:19:00+00', '2022-01-16 14:35:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (221, 'International South College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-04-16 03:22:00+00', '2022-05-15 11:48:00+00', NULL, '["INTERNATIONAL SOUTH COLLEGE", "International_South_College"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (222, 'Space Research Institute 96', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-10-28 00:32:00+00', '2022-03-10 15:53:00+00', NULL, '["SPACE RESEARCH INSTITUTE 96", "Space_Research_Institute_96"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (223, 'General Group 874', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-04-12 08:06:00+00', '2020-11-30 14:24:00+00', NULL, '["GENERAL GROUP 874", "General_Group_874", "GG8"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (224, 'National Transport Authority 817', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-05-14 06:04:00+00', '2020-11-01 16:50:00+00', NULL, '["NATIONAL TRANSPORT AUTHORITY 817"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (225, 'National Agriculture Department', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-03-05 22:09:00+00', '2022-09-21 16:49:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (226, 'Professional Services 561', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-05-08 04:01:00+00', '2021-11-01 18:14:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (227, 'Professional Solutions', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-12-14 20:13:00+00', '2021-06-07 22:08:00+00', NULL, '["PROFESSIONAL SOLUTIONS", "Professional_Solutions", "PS"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (228, 'International South University 83', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-02-23 19:54:00+00', '2020-06-25 08:16:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (229, 'Independent Consulting Consulting', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-11-15 19:03:00+00', '2022-04-30 11:04:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (230, 'National Energy Agency 941', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-12-01 15:26:00+00', '2022-03-27 09:09:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (231, 'Global Health Association', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-04-03 16:39:00+00', '2022-01-17 03:33:00+00', NULL, '["GLOBAL HEALTH ASSOCIATION"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (232, 'Middle School 980', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-03-10 16:36:00+00', '2021-06-12 19:57:00+00', NULL, '["MIDDLE SCHOOL 980", "Middle_School_980"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (233, 'Advanced Organization 1', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-09-22 16:00:00+00', '2022-08-18 21:08:00+00', NULL, '["ADVANCED ORGANIZATION 1", "Advanced_Organization_1"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (234, 'Biomedical Research Center 446', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-09-18 21:02:00+00', '2023-07-30 04:18:00+00', NULL, '["BIOMEDICAL RESEARCH CENTER 446", "Biomedical_Research_Center_446"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (235, 'National East Institute of Technology 905', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-07-15 01:06:00+00', '2022-03-15 11:13:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (236, 'DigitalIndustries 834', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-07-25 06:38:00+00', '2022-03-05 22:38:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (237, 'International Academy 132', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-03-02 15:27:00+00', '2020-08-21 02:48:00+00', NULL, '["INTERNATIONAL ACADEMY 132"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (239, 'DigitalSolutions', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-09-11 04:18:00+00', '2021-06-19 03:59:00+00', NULL, '["DIGITALSOLUTIONS"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (240, 'Independent Research Consulting 981', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-09-29 13:40:00+00', '2021-01-25 21:27:00+00', NULL, '["INDEPENDENT RESEARCH CONSULTING 981", "Independent_Research_Consulting_981"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (241, 'National Energy Authority 482', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-04-04 20:02:00+00', '2022-05-15 02:04:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (242, 'State College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-03-04 20:50:00+00', '2020-05-11 14:41:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (243, 'Education Alliance', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-01-19 19:53:00+00', '2020-06-10 08:51:00+00', NULL, '["EDUCATION ALLIANCE", "Education_Alliance"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (244, 'Wildlife Trust 399', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-08-23 10:18:00+00', '2021-08-28 08:32:00+00', NULL, '["WILDLIFE TRUST 399", "Wildlife_Trust_399"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (245, 'General Services 226', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-05-06 09:03:00+00', '2022-06-16 03:00:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (246, 'Wildlife Trust 863', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-11-30 19:22:00+00', '2021-11-07 13:20:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (247, 'Elementary Academy 725', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-03-18 08:26:00+00', '2021-06-13 17:19:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (248, 'Advanced Group 792', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-11-27 14:04:00+00', '2022-10-26 00:38:00+00', NULL, '["ADVANCED GROUP 792", "Advanced_Group_792"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (249, 'Independent Research Services 456', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-01-05 15:08:00+00', '2020-08-26 20:31:00+00', NULL, '["INDEPENDENT RESEARCH SERVICES 456", "Independent_Research_Services_456"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (250, 'Independent Marketing Solutions 635', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-09-24 19:54:00+00', '2022-03-25 12:18:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (251, 'Climate Action Association', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-10-24 06:46:00+00', '2021-05-11 07:26:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (252, 'Technical South Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-06-15 08:27:00+00', '2021-02-25 06:25:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (253, 'Independent Content Studio', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-04-28 08:01:00+00', '2021-11-01 10:08:00+00', NULL, '["INDEPENDENT CONTENT STUDIO", "Independent_Content_Studio"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (254, 'International East University', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-07-12 12:03:00+00', '2023-01-24 04:22:00+00', NULL, '["INTERNATIONAL EAST UNIVERSITY"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (255, 'East Institute of Technology 954', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-05-12 14:59:00+00', '2022-06-29 21:10:00+00', NULL, '["EAST INSTITUTE OF TECHNOLOGY 954", "East_Institute_of_Technology_954", "EIOT9"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (256, 'Children''s Foundation 241', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-10-18 04:48:00+00', '2022-04-01 11:09:00+00', NULL, '["CHILDREN''S FOUNDATION 241"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (257, 'Specialized Solutions 687', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-12-09 21:47:00+00', '2021-12-14 14:44:00+00', NULL, '["SPECIALIZED SOLUTIONS 687"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (258, 'Education Trust', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-07-08 08:56:00+00', '2023-03-08 03:32:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (259, 'Preparatory Academy 999', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-02-21 14:23:00+00', '2022-08-14 17:52:00+00', NULL, '["PREPARATORY ACADEMY 999", "Preparatory_Academy_999"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (260, 'Preparatory School 932', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-11-08 19:22:00+00', '2021-08-12 23:58:00+00', NULL, '["PREPARATORY SCHOOL 932"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (261, 'Biomedical Institute for Advanced Studies 215', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-04-16 18:00:00+00', '2021-10-12 01:25:00+00', NULL, '["BIOMEDICAL INSTITUTE FOR ADVANCED STUDIES 215"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (262, 'Elementary Academy 201', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-08-05 09:12:00+00', '2023-04-25 00:00:00+00', NULL, '["ELEMENTARY ACADEMY 201"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (263, 'Global Health Foundation 527', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-08-07 06:38:00+00', '2020-12-19 10:40:00+00', NULL, '["GLOBAL HEALTH FOUNDATION 527"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (264, 'North Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-12-12 20:45:00+00', '2022-05-29 00:42:00+00', NULL, '["NORTH INSTITUTE OF TECHNOLOGY", "North_Institute_of_Technology", "NIOT"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (265, 'GreenTechnologies 273', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-11-21 10:51:00+00', '2021-12-15 20:33:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (266, 'Professional Group', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-07-20 11:33:00+00', '2021-08-20 19:13:00+00', NULL, '["PROFESSIONAL GROUP"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (267, 'Independent Content Services 67', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-03-19 14:05:00+00', '2020-10-06 11:16:00+00', NULL, '["INDEPENDENT CONTENT SERVICES 67", "Independent_Content_Services_67", "ICS6"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (268, 'TechIndustries 146', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-07-20 01:08:00+00', '2020-12-29 04:13:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (269, 'High School 996', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-02-26 06:04:00+00', '2022-10-22 14:03:00+00', NULL, '["HIGH SCHOOL 996", "High_School_996"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (270, 'MedSystems 10', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-02-07 18:34:00+00', '2022-05-25 20:02:00+00', NULL, '["MEDSYSTEMS 10", "MedSystems_10"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (271, 'Quantum Institute for Advanced Studies 484', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-05-07 16:59:00+00', '2022-10-10 23:41:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (272, 'State University', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-07-07 14:12:00+00', '2022-10-23 04:44:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (273, 'Materials Institute for Advanced Studies', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-04-01 23:08:00+00', '2022-03-30 18:46:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (274, 'Neural Institute for Advanced Studies 133', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-08-16 12:58:00+00', '2022-11-22 22:35:00+00', NULL, '["NEURAL INSTITUTE FOR ADVANCED STUDIES 133"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (275, 'East College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-05-23 12:52:00+00', '2020-07-09 10:13:00+00', NULL, '["EAST COLLEGE"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (276, 'National Health Agency 61', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-11-11 00:59:00+00', '2022-04-09 01:40:00+00', NULL, '["NATIONAL HEALTH AGENCY 61", "National_Health_Agency_61", "NHA6"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (277, 'Robotics Research Center 443', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-09-02 07:17:00+00', '2022-08-13 10:33:00+00', NULL, '["ROBOTICS RESEARCH CENTER 443"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (278, 'Independent Consulting Solutions 616', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-05-23 02:34:00+00', '2021-06-19 15:46:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (279, 'Preparatory Academy 693', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-02-05 13:53:00+00', '2022-08-18 08:12:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (280, 'Professional Group 25', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-03-25 12:53:00+00', '2022-01-23 14:19:00+00', NULL, '["PROFESSIONAL GROUP 25", "Professional_Group_25"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (281, 'Climate Action Initiative', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-03-11 17:47:00+00', '2022-06-22 11:53:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (282, 'Children''s Alliance 936', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-09-28 20:24:00+00', '2021-06-20 15:53:00+00', NULL, '["CHILDREN''S ALLIANCE 936"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (283, 'Professional Solutions 857', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-04-21 12:53:00+00', '2022-07-10 14:21:00+00', NULL, '["PROFESSIONAL SOLUTIONS 857"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (284, 'Global Health Initiative 86', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-03-17 23:17:00+00', '2022-10-03 07:26:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (285, 'BioSystems 341', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-10-23 20:49:00+00', '2021-12-02 09:27:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (286, 'Middle Academy 929', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-01-06 17:27:00+00', '2021-03-03 05:36:00+00', NULL, '["MIDDLE ACADEMY 929", "Middle_Academy_929", "MA9"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (287, 'DigitalIndustries 223', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-11-15 02:01:00+00', '2022-04-18 14:28:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (288, 'TechSystems', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-07-15 15:36:00+00', '2021-01-27 07:20:00+00', NULL, '["TECHSYSTEMS"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (289, 'Materials Research Center', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-02-28 00:14:00+00', '2020-07-24 04:40:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (290, 'Advanced Services 65', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-07-08 08:28:00+00', '2022-12-31 04:23:00+00', NULL, '["ADVANCED SERVICES 65", "Advanced_Services_65"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (291, 'State Central Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-02-17 00:29:00+00', '2021-03-20 13:05:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (292, 'Independent Marketing Consulting 726', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2022-03-02 21:00:00+00', '2023-01-08 00:35:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (293, 'TechSolutions 351', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-01-08 08:08:00+00', '2021-08-09 16:07:00+00', NULL, '["TECHSOLUTIONS 351", "TechSolutions_351"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (294, 'Robotics Institute for Advanced Studies', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-06-06 22:37:00+00', '2023-05-29 17:16:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (295, 'Education Alliance 941', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-01-25 16:30:00+00', '2022-10-16 17:25:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (296, 'Advanced Organization 831', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-07-17 03:39:00+00', '2021-12-05 13:59:00+00', NULL, '["ADVANCED ORGANIZATION 831", "Advanced_Organization_831"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (297, 'Children''s Initiative 538', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-06-29 14:18:00+00', '2022-05-02 15:03:00+00', NULL, '["CHILDREN''S INITIATIVE 538"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (298, 'State Central College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-03-13 09:31:00+00', '2022-01-31 20:58:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (299, 'National Health Department', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-07-29 16:14:00+00', '2020-08-04 22:56:00+00', NULL, '["NATIONAL HEALTH DEPARTMENT", "National_Health_Department", "NHD"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (300, 'AI Institute for Advanced Studies 426', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-12-30 07:59:00+00', '2021-08-11 06:28:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (301, 'Advanced Solutions 89', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-07-25 03:21:00+00', '2023-05-23 12:05:00+00', NULL, '["ADVANCED SOLUTIONS 89", "Advanced_Solutions_89"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (302, 'BioIndustries 677', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-05-13 09:03:00+00', '2023-02-01 20:57:00+00', NULL, '["BIOINDUSTRIES 677", "BioIndustries_677", "B6"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (303, 'Humanitarian Trust 699', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-07-16 17:23:00+00', '2022-02-02 14:26:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (304, 'AI Research Institute 506', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-09-14 15:31:00+00', '2023-01-13 23:01:00+00', NULL, '["AI RESEARCH INSTITUTE 506", "AI_Research_Institute_506"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (305, 'Specialized Solutions 805', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-02-20 07:26:00+00', '2021-01-04 13:41:00+00', NULL, '["SPECIALIZED SOLUTIONS 805"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (306, 'National Defense Department 169', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-06-15 22:23:00+00', '2021-08-26 03:41:00+00', NULL, '["NATIONAL DEFENSE DEPARTMENT 169"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (307, 'Wildlife Initiative', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-07-11 15:15:00+00', '2021-08-26 12:43:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (308, 'MedSystems 984', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-02-25 00:49:00+00', '2021-11-25 14:01:00+00', NULL, '["MEDSYSTEMS 984"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (309, 'Professional Solutions 831', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-10-01 07:25:00+00', '2021-09-12 11:00:00+00', NULL, '["PROFESSIONAL SOLUTIONS 831"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (310, 'Ocean Institute for Advanced Studies', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-06-04 12:05:00+00', '2020-12-22 11:48:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (311, 'International School 498', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-08-24 20:34:00+00', '2023-05-22 06:16:00+00', NULL, '["INTERNATIONAL SCHOOL 498", "International_School_498", "IS4"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (312, 'Ocean Research Institute', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-03-17 20:15:00+00', '2021-04-01 06:37:00+00', NULL, '["OCEAN RESEARCH INSTITUTE"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (313, 'Climate Institute for Advanced Studies', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-05-11 12:06:00+00', '2022-11-21 05:53:00+00', NULL, '["CLIMATE INSTITUTE FOR ADVANCED STUDIES", "Climate_Institute_for_Advanced_Studies", "CIFAS"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (314, 'Wildlife Initiative 916', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-12-14 09:45:00+00', '2021-09-29 22:42:00+00', NULL, '["WILDLIFE INITIATIVE 916", "Wildlife_Initiative_916"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (315, 'Professional Organization', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-07-09 20:59:00+00', '2022-06-02 12:19:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (316, 'DigitalTechnologies 922', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-08-16 05:21:00+00', '2020-12-27 04:00:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (317, 'Advanced Organization 920', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-12-24 02:17:00+00', '2021-08-19 13:53:00+00', NULL, '["ADVANCED ORGANIZATION 920", "Advanced_Organization_920"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (318, 'Space Institute for Advanced Studies 399', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-01-17 21:24:00+00', '2020-12-27 01:14:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (319, 'Independent Marketing Consulting 319', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-09-06 08:56:00+00', '2020-12-07 06:58:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (320, 'Independent Content Studio 687', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-12-30 12:47:00+00', '2022-03-15 20:35:00+00', NULL, '["INDEPENDENT CONTENT STUDIO 687", "Independent_Content_Studio_687"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (321, 'DataCorporation 840', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-03-03 09:27:00+00', '2020-05-03 02:06:00+00', NULL, '["DATACORPORATION 840", "DataCorporation_840"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (322, 'General Organization 910', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-08-17 10:07:00+00', '2023-05-24 21:37:00+00', NULL, '["GENERAL ORGANIZATION 910", "General_Organization_910", "GO9"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (323, 'Advanced Services 306', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-05-24 02:17:00+00', '2020-10-11 16:49:00+00', NULL, '["ADVANCED SERVICES 306", "Advanced_Services_306", "AS3"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (324, 'Quantum Institute for Advanced Studies 518', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-03-27 04:35:00+00', '2021-10-03 02:53:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (325, 'Biomedical Research Institute', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-11-02 15:40:00+00', '2021-11-23 10:45:00+00', NULL, '["BIOMEDICAL RESEARCH INSTITUTE", "Biomedical_Research_Institute", "BRI"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (326, 'BioCorporation 97', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-09-26 09:34:00+00', '2023-06-13 02:33:00+00', NULL, '["BIOCORPORATION 97", "BioCorporation_97"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (327, 'General Solutions 257', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-06-04 23:36:00+00', '2020-06-25 13:15:00+00', NULL, '["GENERAL SOLUTIONS 257"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (328, 'National South College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-02-03 11:06:00+00', '2022-03-02 06:02:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (329, 'BioIndustries 698', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-02-06 20:27:00+00', '2022-06-02 02:08:00+00', NULL, '["BIOINDUSTRIES 698", "BioIndustries_698"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (330, 'Education Association 904', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-07-19 10:57:00+00', '2021-06-27 05:22:00+00', NULL, '["EDUCATION ASSOCIATION 904", "Education_Association_904", "EA9"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (331, 'International Academy 722', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-12-21 21:00:00+00', '2021-01-29 18:35:00+00', NULL, '["INTERNATIONAL ACADEMY 722"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (332, 'National Education Commission 458', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-12-19 10:56:00+00', '2022-12-16 08:05:00+00', NULL, '["NATIONAL EDUCATION COMMISSION 458", "National_Education_Commission_458", "NEC4"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (333, 'Climate Action Trust', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-06-30 08:53:00+00', '2021-03-08 07:19:00+00', NULL, '["CLIMATE ACTION TRUST", "Climate_Action_Trust", "CAT"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (334, 'Independent Content Consulting', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-12-09 01:13:00+00', '2021-03-04 02:19:00+00', NULL, '["INDEPENDENT CONTENT CONSULTING", "Independent_Content_Consulting", "ICC"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (335, 'Technical South University', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-07-08 13:43:00+00', '2020-08-01 12:58:00+00', NULL, '["TECHNICAL SOUTH UNIVERSITY"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (336, 'Materials Research Center 619', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-09-03 10:51:00+00', '2022-12-08 19:21:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (337, 'Preparatory School 689', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-08-21 09:40:00+00', '2022-10-19 19:32:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (338, 'Quantum Research Institute 888', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-05-02 11:19:00+00', '2020-10-20 01:54:00+00', NULL, '["QUANTUM RESEARCH INSTITUTE 888", "Quantum_Research_Institute_888"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (339, 'Independent Research Consulting 955', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2022-07-06 03:34:00+00', '2022-11-11 17:37:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (340, 'Materials Research Institute 320', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-08-28 02:20:00+00', '2021-08-10 03:52:00+00', NULL, '["MATERIALS RESEARCH INSTITUTE 320", "Materials_Research_Institute_320"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (341, 'International Academy 875', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-01-18 22:01:00+00', '2022-06-10 17:51:00+00', NULL, '["INTERNATIONAL ACADEMY 875", "International_Academy_875"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (342, 'International University', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-05-17 23:31:00+00', '2022-07-10 18:45:00+00', NULL, '["INTERNATIONAL UNIVERSITY", "International_University"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (343, 'Advanced Group 695', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-08-16 22:13:00+00', '2022-11-26 18:06:00+00', NULL, '["ADVANCED GROUP 695"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (344, 'National Environmental Authority', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-10-24 18:13:00+00', '2022-10-08 14:55:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (345, 'Wildlife Initiative 904', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-09-09 19:42:00+00', '2020-11-27 02:52:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (346, 'Professional Group 18', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-12-09 14:41:00+00', '2021-06-03 03:05:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (347, 'Robotics Research Center 304', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-08-13 15:38:00+00', '2020-10-06 22:46:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (348, 'AISystems 921', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-12-16 12:36:00+00', '2021-12-19 09:42:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (349, 'National Agriculture Authority', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-04-15 09:42:00+00', '2021-02-22 21:37:00+00', NULL, '["NATIONAL AGRICULTURE AUTHORITY", "National_Agriculture_Authority"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (350, 'Climate Action Alliance', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-03-04 05:38:00+00', '2022-09-29 19:40:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (351, 'Specialized Services', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-08-09 13:23:00+00', '2022-05-14 06:53:00+00', NULL, '["SPECIALIZED SERVICES", "Specialized_Services"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (352, 'Technical East Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-02-13 00:49:00+00', '2022-11-26 21:01:00+00', NULL, '["TECHNICAL EAST INSTITUTE OF TECHNOLOGY"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (353, 'Preparatory Academy 732', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-09-25 10:59:00+00', '2023-05-10 12:09:00+00', NULL, '["PREPARATORY ACADEMY 732", "Preparatory_Academy_732", "PA7"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (354, 'Advanced Organization 257', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-02-19 03:54:00+00', '2020-02-20 08:08:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (355, 'Biomedical Research Institute 449', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-09-27 16:09:00+00', '2021-09-21 01:02:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (356, 'National Defense Department 659', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-08-03 12:13:00+00', '2020-09-15 17:40:00+00', NULL, '["NATIONAL DEFENSE DEPARTMENT 659"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (357, 'Robotics Institute for Advanced Studies 795', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-01-01 16:59:00+00', '2021-05-27 04:27:00+00', NULL, '["ROBOTICS INSTITUTE FOR ADVANCED STUDIES 795", "Robotics_Institute_for_Advanced_Studies_795"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (358, 'DataIndustries 746', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-03-13 00:45:00+00', '2020-05-29 13:44:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (359, 'General Solutions 414', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-01-10 02:56:00+00', '2022-09-13 11:56:00+00', NULL, '["GENERAL SOLUTIONS 414"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (360, 'State Central Institute of Technology 887', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-08-16 11:59:00+00', '2023-07-29 17:38:00+00', NULL, '["STATE CENTRAL INSTITUTE OF TECHNOLOGY 887"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (361, 'Independent Consulting Consulting 283', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2022-02-09 22:27:00+00', '2022-09-23 16:20:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (362, 'State East Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-08-05 18:56:00+00', '2023-05-28 17:36:00+00', NULL, '["STATE EAST INSTITUTE OF TECHNOLOGY", "State_East_Institute_of_Technology"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (363, 'Ocean Institute for Advanced Studies 252', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-03-26 05:46:00+00', '2020-05-22 00:17:00+00', NULL, '["OCEAN INSTITUTE FOR ADVANCED STUDIES 252"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (364, 'MedCorporation', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-01-05 16:49:00+00', '2020-03-31 07:01:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (365, 'Independent Content Solutions 599', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2022-01-16 15:48:00+00', '2022-11-19 07:40:00+00', NULL, '["INDEPENDENT CONTENT SOLUTIONS 599", "Independent_Content_Solutions_599", "ICS5"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (366, 'DigitalSolutions 138', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-03-29 11:17:00+00', '2022-02-24 02:52:00+00', NULL, '["DIGITALSOLUTIONS 138", "DigitalSolutions_138"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (367, 'Technical South College 62', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-07-16 16:01:00+00', '2023-02-15 07:37:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (368, 'Education Initiative', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-05-24 04:12:00+00', '2021-10-08 09:46:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (369, 'Middle School 648', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-05-16 09:42:00+00', '2021-10-26 20:35:00+00', NULL, '["MIDDLE SCHOOL 648", "Middle_School_648"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (370, 'Ocean Research Center 262', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-09-11 19:55:00+00', '2022-09-08 22:22:00+00', NULL, '["OCEAN RESEARCH CENTER 262", "Ocean_Research_Center_262", "ORC2"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (371, ' College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-03-25 19:09:00+00', '2022-01-30 01:00:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (372, 'AICorporation', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-03-15 06:33:00+00', '2021-05-04 14:11:00+00', NULL, '["AICORPORATION", "AICorporation"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (373, 'Robotics Research Institute', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-12-16 07:20:00+00', '2021-02-09 03:00:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (374, 'DigitalIndustries 967', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-12-25 13:38:00+00', '2021-11-22 00:40:00+00', NULL, '["DIGITALINDUSTRIES 967", "DigitalIndustries_967", "D9"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (375, 'Children''s Trust', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-03-30 00:32:00+00', '2022-06-05 03:49:00+00', NULL, '["CHILDREN''S TRUST"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (376, 'Advanced Services 681', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-03-28 00:13:00+00', '2023-02-28 07:38:00+00', NULL, '["ADVANCED SERVICES 681", "Advanced_Services_681"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (377, 'Central College 891', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-04-22 05:36:00+00', '2023-03-18 00:25:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (378, 'National Education Commission 87', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-08-07 15:19:00+00', '2022-03-22 01:07:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (379, 'Robotics Research Center 104', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-10-15 12:04:00+00', '2022-02-12 03:13:00+00', NULL, '["ROBOTICS RESEARCH CENTER 104", "Robotics_Research_Center_104", "RRC1"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (380, 'Education Trust 260', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-09-12 22:05:00+00', '2021-02-09 19:05:00+00', NULL, '["EDUCATION TRUST 260", "Education_Trust_260", "ET2"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (381, 'MedCorporation 534', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-06-19 14:20:00+00', '2022-11-03 13:19:00+00', NULL, '["MEDCORPORATION 534"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (382, 'Robotics Institute for Advanced Studies 332', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-07-08 22:51:00+00', '2022-05-07 13:53:00+00', NULL, '["ROBOTICS INSTITUTE FOR ADVANCED STUDIES 332"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (383, 'General Organization 840', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-10-10 07:51:00+00', '2020-11-21 06:13:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (384, 'Central College 903', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-12-03 09:19:00+00', '2022-09-24 00:16:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (385, 'Climate Institute for Advanced Studies 465', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-05-23 20:15:00+00', '2021-11-11 01:05:00+00', NULL, '["CLIMATE INSTITUTE FOR ADVANCED STUDIES 465", "Climate_Institute_for_Advanced_Studies_465", "CIFAS4"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (386, 'AISolutions 700', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-10-29 02:24:00+00', '2021-02-19 14:15:00+00', NULL, '["AISOLUTIONS 700", "AISolutions_700", "A7"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (387, 'National Defense Bureau', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-04-01 13:08:00+00', '2020-08-28 18:19:00+00', NULL, '["NATIONAL DEFENSE BUREAU", "National_Defense_Bureau"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (388, 'Elementary Academy 953', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-04-06 11:36:00+00', '2022-01-10 22:15:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (389, 'AI Institute for Advanced Studies 645', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-01-21 12:24:00+00', '2020-10-30 19:14:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (390, 'DataSystems 583', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-10-26 03:46:00+00', '2020-12-06 17:57:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (391, 'Independent Content Consulting 988', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-08-08 00:07:00+00', '2021-07-04 04:43:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (392, 'Elementary Academy 251', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-02-14 10:37:00+00', '2022-11-19 00:51:00+00', NULL, '["ELEMENTARY ACADEMY 251", "Elementary_Academy_251"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (393, 'Professional Group 747', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-10-04 20:20:00+00', '2022-08-25 00:29:00+00', NULL, '["PROFESSIONAL GROUP 747", "Professional_Group_747", "PG7"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (394, 'Independent Consulting Studio 150', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-07-16 03:03:00+00', '2021-09-28 17:39:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (395, 'TechSystems 362', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-05-03 06:03:00+00', '2020-12-08 06:28:00+00', NULL, '["TECHSYSTEMS 362", "TechSystems_362"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (396, 'Professional Services 245', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-03-25 19:48:00+00', '2022-02-09 20:57:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (397, 'Independent Research Solutions 795', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-01-16 21:12:00+00', '2020-12-24 14:25:00+00', NULL, '["INDEPENDENT RESEARCH SOLUTIONS 795"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (398, 'Global Health Initiative 930', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-11-28 10:10:00+00', '2022-02-14 04:47:00+00', NULL, '["GLOBAL HEALTH INITIATIVE 930", "Global_Health_Initiative_930", "GHI9"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (399, 'State Institute of Technology 580', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-03-07 10:49:00+00', '2022-04-26 19:36:00+00', NULL, '["STATE INSTITUTE OF TECHNOLOGY 580", "State_Institute_of_Technology_580"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (400, 'Technical South University 321', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-02-20 15:32:00+00', '2022-04-02 18:53:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (401, 'Children''s Association 521', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-10-15 07:25:00+00', '2021-04-09 17:22:00+00', NULL, '["CHILDREN''S ASSOCIATION 521", "Children''s_Association_521"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (402, 'BioTechnologies 200', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-02-27 09:08:00+00', '2023-01-12 11:09:00+00', NULL, '["BIOTECHNOLOGIES 200", "BioTechnologies_200", "B2"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (403, 'National Agriculture Bureau 863', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-04-03 01:50:00+00', '2022-08-10 08:31:00+00', NULL, '["NATIONAL AGRICULTURE BUREAU 863"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (404, 'Climate Research Institute', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-04-16 18:53:00+00', '2022-12-16 19:43:00+00', NULL, '["CLIMATE RESEARCH INSTITUTE", "Climate_Research_Institute", "CRI"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (405, 'DataIndustries 20', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2022-06-22 14:28:00+00', '2023-01-17 22:40:00+00', NULL, '["DATAINDUSTRIES 20"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (406, 'National Transport Commission', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-05-06 10:43:00+00', '2022-08-21 22:45:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (407, 'DigitalCorporation', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-05-03 10:49:00+00', '2021-03-05 14:02:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (408, 'High School 656', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-12-05 13:24:00+00', '2022-08-11 19:03:00+00', NULL, '["HIGH SCHOOL 656", "High_School_656"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (409, 'AI Research Institute 561', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-06-27 13:52:00+00', '2023-04-19 10:40:00+00', NULL, '["AI RESEARCH INSTITUTE 561", "AI_Research_Institute_561"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (410, 'Advanced Solutions 914', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-04-26 15:32:00+00', '2023-03-15 00:28:00+00', NULL, '["ADVANCED SOLUTIONS 914"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (411, 'General Solutions 65', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-05-06 06:46:00+00', '2022-09-10 03:43:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (412, 'Biomedical Research Institute 185', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-07-19 23:39:00+00', '2022-06-03 18:08:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (413, 'State University 411', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-10-25 04:46:00+00', '2022-10-14 12:53:00+00', NULL, '["STATE UNIVERSITY 411", "State_University_411", "SU4"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (414, 'West College 170', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-07-21 12:18:00+00', '2023-06-01 03:27:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (415, 'Robotics Research Institute 215', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-06-18 21:50:00+00', '2022-09-18 21:23:00+00', NULL, '["ROBOTICS RESEARCH INSTITUTE 215"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (416, 'State East College 789', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-09-25 09:18:00+00', '2023-04-07 15:32:00+00', NULL, '["STATE EAST COLLEGE 789", "State_East_College_789"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (417, 'Specialized Group', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-03-23 02:31:00+00', '2021-05-12 14:36:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (418, 'Independent Design Consulting 846', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-03-31 04:05:00+00', '2021-04-03 07:18:00+00', NULL, '["INDEPENDENT DESIGN CONSULTING 846", "Independent_Design_Consulting_846"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (419, 'Middle School 617', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-03-28 23:43:00+00', '2021-05-31 12:30:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (420, 'National Education Bureau', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-10-01 12:19:00+00', '2021-08-29 11:23:00+00', NULL, '["NATIONAL EDUCATION BUREAU"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (421, 'Ocean Research Center 696', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-01-11 01:43:00+00', '2020-08-19 19:25:00+00', NULL, '["OCEAN RESEARCH CENTER 696", "Ocean_Research_Center_696"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (422, 'State Central Institute of Technology 361', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-12-08 12:38:00+00', '2021-04-24 23:09:00+00', NULL, '["STATE CENTRAL INSTITUTE OF TECHNOLOGY 361", "State_Central_Institute_of_Technology_361"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (423, 'Specialized Group 438', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-03-31 09:50:00+00', '2021-05-29 06:40:00+00', NULL, '["SPECIALIZED GROUP 438"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (424, 'TechSolutions 74', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-07-24 15:37:00+00', '2022-03-07 17:28:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (425, 'Independent Consulting Consulting 942', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-11-24 22:11:00+00', '2021-06-20 16:22:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (426, 'Elementary School 246', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-11-29 03:57:00+00', '2022-11-08 06:18:00+00', NULL, '["ELEMENTARY SCHOOL 246", "Elementary_School_246", "ES2"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (427, 'Advanced Group 227', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-08-31 00:57:00+00', '2023-08-31 07:16:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (428, 'Biomedical Institute for Advanced Studies 822', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-01-07 10:37:00+00', '2020-08-08 10:19:00+00', NULL, '["BIOMEDICAL INSTITUTE FOR ADVANCED STUDIES 822", "Biomedical_Institute_for_Advanced_Studies_822"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (429, 'National Education Commission 1', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-08-18 15:27:00+00', '2021-05-30 01:18:00+00', NULL, '["NATIONAL EDUCATION COMMISSION 1"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (430, 'Space Research Center 264', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-06-19 16:14:00+00', '2021-06-17 07:01:00+00', NULL, '["SPACE RESEARCH CENTER 264"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (431, 'National Defense Agency 323', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-11-22 15:38:00+00', '2022-08-15 11:26:00+00', NULL, '["NATIONAL DEFENSE AGENCY 323", "National_Defense_Agency_323", "NDA3"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (432, 'National Education Department', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-05-25 21:54:00+00', '2020-12-10 23:07:00+00', NULL, '["NATIONAL EDUCATION DEPARTMENT", "National_Education_Department", "NED"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (433, 'Independent Marketing Services 466', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-08-12 09:55:00+00', '2021-04-27 09:27:00+00', NULL, '["INDEPENDENT MARKETING SERVICES 466"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (434, 'Independent Content Solutions 15', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2022-09-03 07:06:00+00', '2022-10-09 08:14:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (435, 'State South College', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-07-01 15:27:00+00', '2020-07-10 17:55:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (436, 'Independent Design Consulting 446', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-04-22 21:35:00+00', '2022-01-30 23:53:00+00', NULL, '["INDEPENDENT DESIGN CONSULTING 446", "Independent_Design_Consulting_446", "IDC4"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (437, 'Specialized Organization', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-05-17 19:14:00+00', '2022-03-06 16:59:00+00', NULL, '["SPECIALIZED ORGANIZATION", "Specialized_Organization"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (438, 'DataSolutions', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-03-22 05:22:00+00', '2022-02-23 18:46:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (439, 'National Education Department 49', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-10-23 23:57:00+00', '2021-08-23 02:04:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (440, 'BioTechnologies 103', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-03-31 23:39:00+00', '2021-10-24 13:15:00+00', NULL, '["BIOTECHNOLOGIES 103", "BioTechnologies_103", "B1"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (441, 'National Transport Agency', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-04-12 02:58:00+00', '2020-05-18 16:20:00+00', NULL, '["NATIONAL TRANSPORT AGENCY"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (442, 'Materials Institute for Advanced Studies 571', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-08-27 02:33:00+00', '2021-02-11 14:31:00+00', NULL, '["MATERIALS INSTITUTE FOR ADVANCED STUDIES 571", "Materials_Institute_for_Advanced_Studies_571"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (443, 'West University', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-07-27 01:14:00+00', '2020-10-25 23:29:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (444, 'National Defense Agency 10', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-07-22 19:47:00+00', '2021-07-05 09:43:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (445, 'Independent Content Consulting 794', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2022-08-08 10:21:00+00', '2023-04-11 12:01:00+00', NULL, '["INDEPENDENT CONTENT CONSULTING 794", "Independent_Content_Consulting_794", "ICC7"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (446, 'Advanced Solutions 843', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-02-22 21:45:00+00', '2022-04-26 15:13:00+00', NULL, '["ADVANCED SOLUTIONS 843", "Advanced_Solutions_843"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (447, 'TechCorporation 348', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2020-02-05 18:45:00+00', '2020-08-01 04:24:00+00', NULL, '["TECHCORPORATION 348"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (448, 'Professional Organization 48', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2020-11-18 06:20:00+00', '2021-01-02 19:45:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (449, 'National Environmental Department', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-01-31 04:48:00+00', '2021-05-22 12:53:00+00', NULL, '["NATIONAL ENVIRONMENTAL DEPARTMENT", "National_Environmental_Department"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (450, 'National Agriculture Commission 506', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-05-01 02:20:00+00', '2022-01-09 18:54:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (451, 'Neural Research Center', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-02-14 22:55:00+00', '2020-03-13 16:50:00+00', NULL, '["NEURAL RESEARCH CENTER", "Neural_Research_Center", "NRC"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (452, 'National Environmental Agency 480', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-01-05 21:12:00+00', '2020-10-04 03:14:00+00', NULL, '["NATIONAL ENVIRONMENTAL AGENCY 480", "National_Environmental_Agency_480", "NEA4"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (453, 'Technical South Institute of Technology 764', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-08-07 19:00:00+00', '2023-07-08 00:21:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (454, 'AITechnologies 805', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-01-09 04:07:00+00', '2021-12-17 09:38:00+00', NULL, '["AITECHNOLOGIES 805"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (455, 'International South College 673', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-11-03 20:28:00+00', '2021-07-30 06:23:00+00', NULL, '["INTERNATIONAL SOUTH COLLEGE 673", "International_South_College_673"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (456, 'Independent Design Solutions 952', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2020-03-13 06:34:00+00', '2020-11-17 21:02:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (457, 'Robotics Research Institute 255', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-09-25 10:46:00+00', '2023-05-05 00:36:00+00', NULL, '["ROBOTICS RESEARCH INSTITUTE 255", "Robotics_Research_Institute_255"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (458, 'National Agriculture Bureau 15', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-10-23 02:29:00+00', '2021-11-08 07:01:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (459, 'Materials Institute for Advanced Studies 245', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-04-15 01:31:00+00', '2021-09-04 19:02:00+00', NULL, '["MATERIALS INSTITUTE FOR ADVANCED STUDIES 245"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (460, 'Independent Software Studio 723', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2022-05-20 22:51:00+00', '2022-07-23 13:45:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (461, 'Materials Institute for Advanced Studies 102', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-07-11 08:35:00+00', '2021-09-28 14:18:00+00', NULL, '["MATERIALS INSTITUTE FOR ADVANCED STUDIES 102"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (462, 'Global Health Trust 95', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-07-08 05:28:00+00', '2021-03-11 01:19:00+00', NULL, '["GLOBAL HEALTH TRUST 95", "Global_Health_Trust_95"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (463, 'Elementary School 569', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-12-18 01:12:00+00', '2022-06-29 07:09:00+00', NULL, '["ELEMENTARY SCHOOL 569", "Elementary_School_569", "ES5"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (464, 'Specialized Group 393', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-09-02 22:39:00+00', '2022-05-28 15:07:00+00', NULL, '["SPECIALIZED GROUP 393", "Specialized_Group_393", "SG3"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (465, 'State Institute of Technology 865', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-05-21 15:06:00+00', '2021-11-04 08:49:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (466, 'General Solutions 86', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-01-19 10:34:00+00', '2022-07-13 14:30:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (467, 'Advanced Solutions 692', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-03-01 00:25:00+00', '2022-08-29 12:08:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (468, 'High School 605', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2020-03-20 23:18:00+00', '2020-07-11 16:25:00+00', NULL, '["HIGH SCHOOL 605"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (469, 'Wildlife Foundation 394', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2021-10-18 13:11:00+00', '2022-09-29 11:47:00+00', NULL, '["WILDLIFE FOUNDATION 394"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (470, 'Independent Consulting Consulting 298', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-04-30 00:49:00+00', '2021-08-24 20:09:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (471, 'General Organization 457', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-07-14 19:47:00+00', '2021-08-27 00:25:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (472, 'National Education Authority', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2021-11-11 08:47:00+00', '2022-01-28 15:49:00+00', NULL, '["NATIONAL EDUCATION AUTHORITY", "National_Education_Authority"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (473, 'GreenCorporation 878', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-11-10 06:31:00+00', '2021-11-16 23:08:00+00', NULL, '["GREENCORPORATION 878", "GreenCorporation_878", "G8"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (474, 'Wildlife Initiative 711', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2022-03-01 06:58:00+00', '2022-08-20 09:15:00+00', NULL, '["WILDLIFE INITIATIVE 711", "Wildlife_Initiative_711", "WI7"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (475, 'National Energy Bureau', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-06-16 06:38:00+00', '2021-05-14 01:01:00+00', NULL, '["NATIONAL ENERGY BUREAU", "National_Energy_Bureau"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (476, 'National South Institute of Technology', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2020-10-10 12:16:00+00', '2021-04-30 00:33:00+00', NULL, '["NATIONAL SOUTH INSTITUTE OF TECHNOLOGY", "National_South_Institute_of_Technology", "NSIOT"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (477, 'TechSolutions 314', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-01-11 23:03:00+00', '2021-03-31 10:17:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (478, 'National Transport Agency 638', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-06-06 03:48:00+00', '2023-02-20 06:33:00+00', NULL, '["NATIONAL TRANSPORT AGENCY 638"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (479, 'Preparatory School 449', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2022-07-12 10:25:00+00', '2023-04-03 01:16:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (480, 'Middle Academy 142', 'SCHOOL', 'Leading school focused on excellence and innovation in the field.', '2021-06-05 13:23:00+00', '2021-08-15 08:44:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (481, 'Independent Design Consulting 945', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-04-30 01:31:00+00', '2022-03-31 10:16:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (482, 'AI Research Institute 976', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-02-07 14:51:00+00', '2022-05-28 04:32:00+00', NULL, '["AI RESEARCH INSTITUTE 976", "AI_Research_Institute_976"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (483, 'Specialized Organization 492', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-02-16 11:17:00+00', '2022-07-16 19:22:00+00', NULL, '["SPECIALIZED ORGANIZATION 492", "Specialized_Organization_492"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (484, 'National Transport Department 157', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2020-02-01 15:27:00+00', '2021-02-01 12:56:00+00', NULL, '["NATIONAL TRANSPORT DEPARTMENT 157"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (485, 'Independent Design Studio 346', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-11-04 22:21:00+00', '2022-09-08 00:34:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (486, 'Biomedical Research Center 413', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2021-01-09 06:21:00+00', '2021-02-02 04:23:00+00', NULL, '["BIOMEDICAL RESEARCH CENTER 413", "Biomedical_Research_Center_413"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (487, 'AI Institute for Advanced Studies 489', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-01-04 07:21:00+00', '2022-02-20 04:37:00+00', NULL, '["AI INSTITUTE FOR ADVANCED STUDIES 489"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (488, 'AI Institute for Advanced Studies 465', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2022-07-23 00:16:00+00', '2023-07-17 16:30:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (489, 'Independent Design Solutions 30', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-06-15 00:21:00+00', '2021-12-18 03:09:00+00', NULL, '["INDEPENDENT DESIGN SOLUTIONS 30", "Independent_Design_Solutions_30"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (490, 'Children''s Association 44', 'NON_PROFIT_ORGANIZATION', 'Leading non profit organization focused on excellence and innovation in the field.', '2020-06-15 00:02:00+00', '2021-06-14 22:24:00+00', NULL, '["CHILDREN''S ASSOCIATION 44", "Children''s_Association_44", "CA4"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (491, 'AITechnologies 19', 'CORPORATION', 'Leading corporation focused on excellence and innovation in the field.', '2021-03-15 17:29:00+00', '2021-06-19 07:35:00+00', NULL, '["AITECHNOLOGIES 19"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (492, 'State North University', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2021-09-04 09:45:00+00', '2022-03-21 08:40:00+00', NULL, '["STATE NORTH UNIVERSITY", "State_North_University"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (493, 'Neural Research Center 135', 'RESEARCH_INSTITUTE', 'Leading research institute focused on excellence and innovation in the field.', '2020-04-04 18:19:00+00', '2021-02-24 00:36:00+00', NULL, '["NEURAL RESEARCH CENTER 135", "Neural_Research_Center_135", "NRC1"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (494, 'Specialized Solutions 275', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2021-06-22 21:40:00+00', '2022-03-05 17:34:00+00', NULL, '["SPECIALIZED SOLUTIONS 275", "Specialized_Solutions_275"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (495, 'National Agriculture Bureau 720', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-09-22 13:05:00+00', '2023-05-29 21:59:00+00', NULL, '["NATIONAL AGRICULTURE BUREAU 720"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (496, 'Independent Design Solutions 4', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2022-04-04 14:58:00+00', '2022-10-27 17:43:00+00', NULL, '["INDEPENDENT DESIGN SOLUTIONS 4", "Independent_Design_Solutions_4", "IDS4"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (497, 'General Group 708', 'OTHER', 'Leading other focused on excellence and innovation in the field.', '2022-06-18 06:36:00+00', '2023-05-26 22:43:00+00', NULL, '["GENERAL GROUP 708"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (498, 'Independent Content Studio 790', 'FREELANCER', 'Leading freelancer focused on excellence and innovation in the field.', '2021-10-10 00:00:00+00', '2022-05-18 11:41:00+00', NULL, '["INDEPENDENT CONTENT STUDIO 790", "Independent_Content_Studio_790", "ICS7"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (499, 'National Agriculture Department 329', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-08-01 08:05:00+00', '2023-03-12 19:57:00+00', NULL, '["NATIONAL AGRICULTURE DEPARTMENT 329"]', NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (500, 'National Agriculture Authority 358', 'PUBLIC_SECTOR', 'Leading public sector focused on excellence and innovation in the field.', '2022-02-09 09:20:00+00', '2022-02-24 23:23:00+00', NULL, NULL, NULL);
INSERT INTO public."Organization" (id, name, type, description, created_at, updated_at, logo, aliases, "apiKeyHash") VALUES (160, 'State East University', 'UNIVERSITY', 'Leading university focused on excellence and innovation in the field.', '2022-08-01 02:42:00+00', '2025-11-28 09:41:55.674858+00', NULL, '["STATE EAST UNIVERSITY", "State_East_University", "SEU"]', '53d30cb81865fa6ecdfb51a94608d6754985c493db8b819b00a9131d57f6772c');
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('11111111-1111-1111-1111-111111111111', 'Maria', 'Schmidt', 'maria.schmidt@example.com', NULL, 'https://www.linkedin.com', true, 'xedz2362', '2022-12-17 17:53:20.882635+00', '2024-11-02 00:46:55.343506+00', '123457', 'ACTIVE', 2, NULL, 'UNIVERSITY_STUDENT', NULL, NULL);
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('22222222-2222-2222-2222-222222222222', 'Thomas', 'Mueller', 'thomas.mueller@example.com', NULL, 'https://www.xing.com', true, 'xedz2363', '2022-12-17 17:53:20.882635+00', '2024-11-02 00:46:55.343506+00', '123458', 'ACTIVE', 3, NULL, 'UNIVERSITY_STUDENT', NULL, NULL);
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('33333333-3333-3333-3333-333333333333', 'Sophie', 'Weber', 'sophie.weber@example.com', NULL, 'https://www.github.com', false, 'xedz2364', '2022-12-17 17:53:20.882635+00', '2024-11-02 00:46:55.343506+00', '123459', 'ACTIVE', 4, NULL, 'UNIVERSITY_STUDENT', NULL, NULL);
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('44444444-4444-4444-4444-444444444444', 'Alexander', 'Fischer', 'alexander.fischer@example.com', NULL, 'https://www.linkedin.com', true, 'xedz2365', '2022-12-17 17:53:20.882635+00', '2024-11-02 00:46:55.343506+00', '123460', 'ACTIVE', 5, NULL, 'UNIVERSITY_STUDENT', NULL, NULL);
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('66666666-6666-6666-6666-666666666666', 'Felix', 'Becker', 'felix.becker@example.com', NULL, 'https://www.github.com', false, 'xedz2367', '2022-12-17 17:53:20.882635+00', '2024-11-02 00:46:55.343506+00', '123462', 'ACTIVE', 7, NULL, 'UNIVERSITY_STUDENT', NULL, NULL);
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('77777777-7777-7777-7777-777777777777', 'Emma', 'Koch', 'emma.koch@example.com', NULL, 'https://www.linkedin.com', true, 'xedz2368', '2022-12-17 17:53:20.882635+00', '2024-11-02 00:46:55.343506+00', '123463', 'ACTIVE', 8, NULL, 'UNIVERSITY_STUDENT', NULL, NULL);
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('88888888-8888-8888-8888-888888888888', 'Max', 'Schulz', 'max.schulz@example.com', NULL, 'https://www.xing.com', true, 'xedz2369', '2022-12-17 17:53:20.882635+00', '2024-11-02 00:46:55.343506+00', '123464', 'ACTIVE', 9, NULL, 'UNIVERSITY_STUDENT', NULL, NULL);
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('99999999-9999-9999-9999-999999999999', 'Julia', 'Hoffmann', 'julia.hoffmann@example.com', NULL, 'https://www.github.com', false, 'xedz2370', '2022-12-17 17:53:20.882635+00', '2024-11-02 00:46:55.343506+00', '123465', 'ACTIVE', 10, NULL, 'UNIVERSITY_STUDENT', NULL, NULL);
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lukas', 'Schäfer', 'lukas.schaefer@example.com', NULL, 'https://www.linkedin.com', true, 'xedz2371', '2022-12-17 17:53:20.882635+00', '2024-11-02 00:46:55.343506+00', '123466', 'ACTIVE', 11, NULL, 'UNIVERSITY_STUDENT', NULL, NULL);
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('55555555-5555-5555-5555-555555555555', 'Laura', 'Wagner', 'laura.wagner@example.com', NULL, 'https://www.xing.com', true, 'xedz2366', '2022-12-17 17:53:20.882635+00', '2025-01-10 20:56:21.288918+00', '123461', 'ACTIVE', 6, 3, 'UNIVERSITY_STUDENT', NULL, NULL);
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'User', 'User', 'user@example.com', 'public/userid_152f12c3-f7d2-4b73-8d29-603c164b0139/profile_image/Student1_portrait.png', 'https://www.google.com', true, 'xedz2361', '2022-12-17 17:53:20.882635+00', '2025-02-20 09:11:25.552461+00', '123456', 'ACTIVE', 1, NULL, 'UNIVERSITY_STUDENT', NULL, NULL);
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Instructor', 'Instructor', 'instructor@example.com', NULL, NULL, NULL, NULL, '2025-02-19 17:07:46.224333+00', '2025-02-20 09:12:06.08057+00', NULL, 'ACTIVE', 1, NULL, NULL, NULL, NULL);
INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country) VALUES ('8914bee9-0549-44af-bcae-cafeec5ba92e', 'Admin', 'Admin', 'admin@example.com', 'public/userid_8914bee9-0549-44af-bcae-cafeec5ba92e/profile_image/admin_portrait.png', NULL, NULL, NULL, '2024-11-25 15:32:49.766078+00', '2025-11-28 09:41:19.173642+00', NULL, 'ACTIVE', 1, 159, 'EMPLOYED_PART_TIME', NULL, NULL);
INSERT INTO public."AchievementRecord" (id, "coverImageUrl", description, rating, score, "achievementOptionId", "documentationUrl", "csvResults", "evaluationScriptUrl", created_at, updated_at, "uploadUserId", "courseId") VALUES (1, NULL, 'Fusce quis convallis elit, id dictum lacus.', 'PASSED', NULL, 1, NULL, NULL, NULL, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00', '152f12c3-f7d2-4b73-8d29-603c164b0139', 1);
INSERT INTO public."AchievementRecord" (id, "coverImageUrl", description, rating, score, "achievementOptionId", "documentationUrl", "csvResults", "evaluationScriptUrl", created_at, updated_at, "uploadUserId", "courseId") VALUES (2, NULL, 'Fusce quis convallis elit, id dictum lacus.', 'UNRATED', NULL, 2, 'achievementrecordid_1/documentation/test_doc.odt', NULL, NULL, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00', 'b5df4676-3d75-4413-bfac-9cc4e2f61cd9', 1);
INSERT INTO public."AchievementRecord" (id, "coverImageUrl", description, rating, score, "achievementOptionId", "documentationUrl", "csvResults", "evaluationScriptUrl", created_at, updated_at, "uploadUserId", "courseId") VALUES (3, NULL, 'Fusce quis convallis elit, id dictum lacus.', 'UNRATED', NULL, 3, NULL, NULL, NULL, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00', '152f12c3-f7d2-4b73-8d29-603c164b0139', 4);
INSERT INTO public."AchievementRecord" (id, "coverImageUrl", description, rating, score, "achievementOptionId", "documentationUrl", "csvResults", "evaluationScriptUrl", created_at, updated_at, "uploadUserId", "courseId") VALUES (4, NULL, 'Fusce quis convallis elit, id dictum lacus.', 'UNRATED', NULL, 4, 'achievementrecordid_4/documentation/test_doc.odt', NULL, NULL, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00', 'b5df4676-3d75-4413-bfac-9cc4e2f61cd9', 4);
INSERT INTO public."AchievementRecord" (id, "coverImageUrl", description, rating, score, "achievementOptionId", "documentationUrl", "csvResults", "evaluationScriptUrl", created_at, updated_at, "uploadUserId", "courseId") VALUES (7, NULL, NULL, 'UNRATED', NULL, 2, 'https://dummy.com', NULL, NULL, '2025-02-19 17:15:17.308315+00', '2025-02-19 17:15:17.308315+00', '88888888-8888-8888-8888-888888888888', 302);
INSERT INTO public."AchievementRecordAuthor" (id, "achievementRecordId", "userId", created_at, updated_at) VALUES (1, 7, '88888888-8888-8888-8888-888888888888', '2025-02-19 17:15:49.881122+00', '2025-02-19 17:15:49.881122+00');
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (24, 'Session7 for Present Course 1', 'The seventh session for "Present Course 1"', '2024-11-02 18:00:00+00', '2024-11-02 20:00:00+00', 4, '2022-12-19 13:21:41.873742+00', '2024-11-25 15:34:57.743238+00', 'true', true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (29, '', '', '2024-12-02 15:38:22.45+00', '2024-12-02 15:38:22.45+00', 1, '2024-11-25 15:38:22.482944+00', '2024-11-25 15:38:22.482944+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (30, '', '', '2024-12-09 15:38:22.45+00', '2024-12-09 15:38:22.45+00', 1, '2024-11-25 15:38:22.73501+00', '2024-11-25 15:38:22.73501+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (31, '', '', '2024-12-16 15:38:22.45+00', '2024-12-16 15:38:22.45+00', 1, '2024-11-25 15:38:23.004908+00', '2024-11-25 15:38:23.004908+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (25, 'Session8 for Present Course 1', 'The eigth session for "Present Course 1"', '2024-11-09 18:00:00+00', '2024-11-09 20:00:00+00', 4, '2022-12-19 13:21:41.873742+00', '2024-12-28 00:00:06.663736+00', 'true', true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (23, 'Session6 for Present Course 1', 'The sixth session for "Present Course 1"', '2024-11-09 18:00:00+00', '2024-11-09 20:00:00+00', 4, '2022-12-19 13:21:41.873742+00', '2024-12-28 00:00:06.684969+00', 'true', true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (26, 'Session9 for Present Course 1', 'The nineth session for "Present Course 1"', '2024-11-16 18:00:00+00', '2024-11-16 20:00:00+00', 4, '2022-12-19 13:21:41.873742+00', '2024-12-28 00:00:06.695963+00', 'true', true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (22, 'Session5 for Present Course 1', 'The fifth session for "Present Course 1"', '2024-11-16 18:00:00+00', '2024-11-16 20:00:00+00', 4, '2022-12-19 13:21:41.873742+00', '2024-12-28 00:00:06.704764+00', 'true', true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (21, 'Session4 for Present Course 1', 'The fourth session for "Present Course 1"', '2024-11-23 18:00:00+00', '2024-11-23 20:00:00+00', 4, '2022-12-19 13:21:41.873742+00', '2024-12-28 00:00:06.71442+00', 'true', true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (27, 'Session10 for Present Course 1', 'The tenth session for "Present Course 1"', '2024-11-23 18:00:00+00', '2024-11-23 20:00:00+00', 4, '2022-12-19 13:21:41.873742+00', '2024-12-28 00:00:06.723159+00', 'true', true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (20, 'Session3 for Present Course 1', 'The third session for "Present Course 1"', '2024-12-02 18:00:00+00', '2024-12-02 20:00:00+00', 4, '2022-12-19 13:21:41.873742+00', '2024-12-28 00:00:06.732119+00', 'true', true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (41, 'Session 1', 'Introduction to the course topics', '2024-04-17 09:00:00+00', '2024-04-17 11:30:00+00', 101, '2024-12-30 10:26:03.983585+00', '2024-12-30 12:00:02.483849+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (42, 'Session 2', 'Core concepts and fundamentals', '2024-04-24 09:00:00+00', '2024-04-24 11:30:00+00', 101, '2024-12-30 10:26:03.983585+00', '2024-12-30 12:00:02.4926+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (43, 'Session 3', 'Advanced topics and applications', '2024-05-01 09:00:00+00', '2024-05-01 11:30:00+00', 101, '2024-12-30 10:26:03.983585+00', '2024-12-30 12:00:02.499101+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (38, '', '', '2025-01-13 10:14:42.811+00', '2025-01-13 10:14:42.811+00', 3, '2024-12-30 10:15:39.648192+00', '2024-12-30 10:15:51.314682+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (44, 'Session 4', 'Practical exercises and examples', '2024-05-08 09:00:00+00', '2024-05-08 11:30:00+00', 101, '2024-12-30 10:26:03.983585+00', '2024-12-30 12:00:02.506297+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (45, 'Session 5', 'Group work and discussions', '2024-05-15 09:00:00+00', '2024-05-15 11:30:00+00', 101, '2024-12-30 10:26:03.983585+00', '2024-12-30 12:00:02.514135+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (39, '', '', '2025-01-20 10:14:42.811+00', '2025-01-20 10:14:42.811+00', 3, '2024-12-30 10:16:04.499158+00', '2024-12-30 10:16:04.499158+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (37, '', '', '2025-01-06 10:14:42.811+00', '2025-01-06 10:14:42.811+00', 3, '2024-12-30 10:14:42.822369+00', '2024-12-30 10:16:33.4443+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (49, 'Session 1', 'Introduction to course topics', '2024-05-02 09:00:00+00', '2024-05-02 11:30:00+00', 201, '2024-12-30 10:27:39.54548+00', '2024-12-30 10:27:39.54548+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (50, 'Session 2', 'Core concepts and fundamentals', '2024-05-09 09:00:00+00', '2024-05-09 11:30:00+00', 201, '2024-12-30 10:27:39.54548+00', '2024-12-30 10:27:39.54548+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (51, 'Session 3', 'Advanced topics and applications', '2024-05-16 09:00:00+00', '2024-05-16 11:30:00+00', 201, '2024-12-30 10:27:39.54548+00', '2024-12-30 10:27:39.54548+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (52, 'Session 4', 'Practical exercises and examples', '2024-05-23 09:00:00+00', '2024-05-23 11:30:00+00', 201, '2024-12-30 10:27:39.54548+00', '2024-12-30 10:27:39.54548+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (53, 'Session 5', 'Group work and discussions', '2024-05-30 09:00:00+00', '2024-05-30 11:30:00+00', 201, '2024-12-30 10:27:39.54548+00', '2024-12-30 10:27:39.54548+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (54, 'Session 6', 'Project work and implementation', '2024-06-06 09:00:00+00', '2024-06-06 11:30:00+00', 201, '2024-12-30 10:27:39.54548+00', '2024-12-30 10:27:39.54548+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (55, 'Session 7', 'Review and consolidation', '2024-06-13 09:00:00+00', '2024-06-13 11:30:00+00', 201, '2024-12-30 10:27:39.54548+00', '2024-12-30 10:27:39.54548+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (56, 'Session 8', 'Final presentations and wrap-up', '2024-06-20 09:00:00+00', '2024-06-20 11:30:00+00', 201, '2024-12-30 10:27:39.54548+00', '2024-12-30 10:27:39.54548+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (65, 'Session 1', 'Introduction to course topics', '2024-05-03 09:00:00+00', '2024-05-03 11:30:00+00', 202, '2024-12-30 10:28:32.231678+00', '2024-12-30 10:28:32.231678+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (66, 'Session 2', 'Core concepts and fundamentals', '2024-05-10 09:00:00+00', '2024-05-10 11:30:00+00', 202, '2024-12-30 10:28:32.231678+00', '2024-12-30 10:28:32.231678+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (67, 'Session 3', 'Advanced topics and applications', '2024-05-17 09:00:00+00', '2024-05-17 11:30:00+00', 202, '2024-12-30 10:28:32.231678+00', '2024-12-30 10:28:32.231678+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (68, 'Session 4', 'Practical exercises and examples', '2024-05-24 09:00:00+00', '2024-05-24 11:30:00+00', 202, '2024-12-30 10:28:32.231678+00', '2024-12-30 10:28:32.231678+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (69, 'Session 5', 'Group work and discussions', '2024-05-31 09:00:00+00', '2024-05-31 11:30:00+00', 202, '2024-12-30 10:28:32.231678+00', '2024-12-30 10:28:32.231678+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (70, 'Session 6', 'Project work and implementation', '2024-06-07 09:00:00+00', '2024-06-07 11:30:00+00', 202, '2024-12-30 10:28:32.231678+00', '2024-12-30 10:28:32.231678+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (71, 'Session 7', 'Review and consolidation', '2024-06-14 09:00:00+00', '2024-06-14 11:30:00+00', 202, '2024-12-30 10:28:32.231678+00', '2024-12-30 10:28:32.231678+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (72, 'Session 8', 'Final presentations and wrap-up', '2024-06-21 09:00:00+00', '2024-06-21 11:30:00+00', 202, '2024-12-30 10:28:32.231678+00', '2024-12-30 10:28:32.231678+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (46, 'Session 6', 'Project work and implementation', '2024-05-22 09:00:00+00', '2024-05-22 11:30:00+00', 101, '2024-12-30 10:26:03.983585+00', '2024-12-30 12:00:02.521114+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (47, 'Session 7', 'Review and consolidation', '2024-05-29 09:00:00+00', '2024-05-29 11:30:00+00', 101, '2024-12-30 10:26:03.983585+00', '2024-12-30 12:00:02.52761+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (48, 'Session 8', 'Final presentations and wrap-up', '2024-06-05 09:00:00+00', '2024-06-05 11:30:00+00', 101, '2024-12-30 10:26:03.983585+00', '2024-12-30 12:00:02.534218+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (73, 'Session 1', 'Introduction to course topics', '2024-10-03 09:00:00+00', '2024-10-03 11:30:00+00', 302, '2024-12-30 10:28:32.231678+00', '2024-12-30 12:00:02.677222+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (74, 'Session 2', 'Core concepts and fundamentals', '2024-10-10 09:00:00+00', '2024-10-10 11:30:00+00', 302, '2024-12-30 10:28:32.231678+00', '2024-12-30 12:00:02.684294+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (57, 'Session 1', 'Introduction to course topics', '2024-10-02 09:00:00+00', '2024-10-02 11:30:00+00', 301, '2024-12-30 10:27:39.54548+00', '2024-12-30 12:00:02.806921+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (58, 'Session 2', 'Core concepts and fundamentals', '2024-10-09 09:00:00+00', '2024-10-09 11:30:00+00', 301, '2024-12-30 10:27:39.54548+00', '2024-12-30 12:00:02.812419+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (59, 'Session 3', 'Advanced topics and applications', '2024-10-16 09:00:00+00', '2024-10-16 11:30:00+00', 301, '2024-12-30 10:27:39.54548+00', '2024-12-30 12:00:02.817714+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (60, 'Session 4', 'Practical exercises and examples', '2024-10-23 09:00:00+00', '2024-10-23 11:30:00+00', 301, '2024-12-30 10:27:39.54548+00', '2024-12-30 12:00:02.855255+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (61, 'Session 5', 'Group work and discussions', '2024-10-30 09:00:00+00', '2024-10-30 11:30:00+00', 301, '2024-12-30 10:27:39.54548+00', '2024-12-30 12:00:02.877874+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (62, 'Session 6', 'Project work and implementation', '2024-11-06 09:00:00+00', '2024-11-06 11:30:00+00', 301, '2024-12-30 10:27:39.54548+00', '2024-12-30 12:00:02.888651+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (63, 'Session 7', 'Review and consolidation', '2024-11-13 09:00:00+00', '2024-11-13 11:30:00+00', 301, '2024-12-30 10:27:39.54548+00', '2024-12-30 12:00:02.897066+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (64, 'Session 8', 'Final presentations and wrap-up', '2024-11-20 09:00:00+00', '2024-11-20 11:30:00+00', 301, '2024-12-30 10:27:39.54548+00', '2024-12-30 12:00:02.94128+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (81, 'Session 1', 'Introduction to course topics', '2024-05-06 09:00:00+00', '2024-05-06 11:30:00+00', 203, '2024-12-30 10:30:33.043544+00', '2024-12-30 10:30:33.043544+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (82, 'Session 2', 'Core concepts and fundamentals', '2024-05-13 09:00:00+00', '2024-05-13 11:30:00+00', 203, '2024-12-30 10:30:33.043544+00', '2024-12-30 10:30:33.043544+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (83, 'Session 3', 'Advanced topics and applications', '2024-05-20 09:00:00+00', '2024-05-20 11:30:00+00', 203, '2024-12-30 10:30:33.043544+00', '2024-12-30 10:30:33.043544+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (84, 'Session 4', 'Practical exercises and examples', '2024-05-27 09:00:00+00', '2024-05-27 11:30:00+00', 203, '2024-12-30 10:30:33.043544+00', '2024-12-30 10:30:33.043544+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (85, 'Session 5', 'Group work and discussions', '2024-06-03 09:00:00+00', '2024-06-03 11:30:00+00', 203, '2024-12-30 10:30:33.043544+00', '2024-12-30 10:30:33.043544+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (86, 'Session 6', 'Project work and implementation', '2024-06-10 09:00:00+00', '2024-06-10 11:30:00+00', 203, '2024-12-30 10:30:33.043544+00', '2024-12-30 10:30:33.043544+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (87, 'Session 7', 'Review and consolidation', '2024-06-17 09:00:00+00', '2024-06-17 11:30:00+00', 203, '2024-12-30 10:30:33.043544+00', '2024-12-30 10:30:33.043544+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (88, 'Session 8', 'Final presentations and wrap-up', '2024-06-24 09:00:00+00', '2024-06-24 11:30:00+00', 203, '2024-12-30 10:30:33.043544+00', '2024-12-30 10:30:33.043544+00', NULL, false);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (89, 'Session 1', 'Introduction to course topics', '2024-10-07 09:00:00+00', '2024-10-07 11:30:00+00', 303, '2024-12-30 10:30:33.043544+00', '2024-12-30 12:00:02.557714+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (90, 'Session 2', 'Core concepts and fundamentals', '2024-10-14 09:00:00+00', '2024-10-14 11:30:00+00', 303, '2024-12-30 10:30:33.043544+00', '2024-12-30 12:00:02.564489+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (91, 'Session 3', 'Advanced topics and applications', '2024-10-21 09:00:00+00', '2024-10-21 11:30:00+00', 303, '2024-12-30 10:30:33.043544+00', '2024-12-30 12:00:02.571233+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (92, 'Session 4', 'Practical exercises and examples', '2024-10-28 09:00:00+00', '2024-10-28 11:30:00+00', 303, '2024-12-30 10:30:33.043544+00', '2024-12-30 12:00:02.579296+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (93, 'Session 5', 'Group work and discussions', '2024-11-04 09:00:00+00', '2024-11-04 11:30:00+00', 303, '2024-12-30 10:30:33.043544+00', '2024-12-30 12:00:02.585746+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (94, 'Session 6', 'Project work and implementation', '2024-11-11 09:00:00+00', '2024-11-11 11:30:00+00', 303, '2024-12-30 10:30:33.043544+00', '2024-12-30 12:00:02.593507+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (95, 'Session 7', 'Review and consolidation', '2024-11-18 09:00:00+00', '2024-11-18 11:30:00+00', 303, '2024-12-30 10:30:33.043544+00', '2024-12-30 12:00:02.600758+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (96, 'Session 8', 'Final presentations and wrap-up', '2024-11-25 09:00:00+00', '2024-11-25 11:30:00+00', 303, '2024-12-30 10:30:33.043544+00', '2024-12-30 12:00:02.624431+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (75, 'Session 3', 'Advanced topics and applications', '2024-10-17 09:00:00+00', '2024-10-17 11:30:00+00', 302, '2024-12-30 10:28:32.231678+00', '2024-12-30 12:00:02.69296+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (76, 'Session 4', 'Practical exercises and examples', '2024-10-24 09:00:00+00', '2024-10-24 11:30:00+00', 302, '2024-12-30 10:28:32.231678+00', '2024-12-30 12:00:02.702949+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (77, 'Session 5', 'Group work and discussions', '2024-10-31 09:00:00+00', '2024-10-31 11:30:00+00', 302, '2024-12-30 10:28:32.231678+00', '2024-12-30 12:00:02.712889+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (78, 'Session 6', 'Project work and implementation', '2024-11-07 09:00:00+00', '2024-11-07 11:30:00+00', 302, '2024-12-30 10:28:32.231678+00', '2024-12-30 12:00:02.720586+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (79, 'Session 7', 'Review and consolidation', '2024-11-14 09:00:00+00', '2024-11-14 11:30:00+00', 302, '2024-12-30 10:28:32.231678+00', '2024-12-30 12:00:02.726387+00', NULL, true);
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent) VALUES (80, 'Session 8', 'Final presentations and wrap-up', '2024-11-21 09:00:00+00', '2024-11-21 11:30:00+00', 302, '2024-12-30 10:28:32.231678+00', '2024-12-30 12:00:02.766198+00', NULL, true);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (1, 73, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-01-10 21:16:37.982951+00', '2025-01-10 21:16:37.982951+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (2, 74, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-01-10 21:16:38.79793+00', '2025-01-10 21:16:38.79793+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (3, 75, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-01-10 21:16:39.553725+00', '2025-01-10 21:16:39.553725+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (4, 77, '77777777-7777-7777-7777-777777777777', 'ATTENDED', '2025-01-10 21:16:40.638322+00', '2025-01-10 21:16:40.638322+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (5, 76, '77777777-7777-7777-7777-777777777777', 'ATTENDED', '2025-01-10 21:16:41.51396+00', '2025-01-10 21:16:41.51396+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (6, 75, '77777777-7777-7777-7777-777777777777', 'ATTENDED', '2025-01-10 21:16:45.211304+00', '2025-01-10 21:16:45.211304+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (7, 74, '77777777-7777-7777-7777-777777777777', 'ATTENDED', '2025-01-10 21:16:45.982009+00', '2025-01-10 21:16:45.982009+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (8, 73, '77777777-7777-7777-7777-777777777777', 'ATTENDED', '2025-01-10 21:16:46.772081+00', '2025-01-10 21:16:46.772081+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (9, 65, '44444444-4444-4444-4444-444444444444', 'ATTENDED', '2025-01-10 22:02:39.888915+00', '2025-01-10 22:02:39.888915+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (10, 66, '44444444-4444-4444-4444-444444444444', 'ATTENDED', '2025-01-10 22:02:40.683636+00', '2025-01-10 22:02:40.683636+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (11, 67, '77777777-7777-7777-7777-777777777777', 'ATTENDED', '2025-01-10 22:02:41.935865+00', '2025-01-10 22:02:41.935865+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (12, 69, '77777777-7777-7777-7777-777777777777', 'ATTENDED', '2025-01-10 22:02:43.203184+00', '2025-01-10 22:02:43.203184+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (13, 69, '77777777-7777-7777-7777-777777777777', 'MISSED', '2025-01-10 22:02:43.720364+00', '2025-01-10 22:02:43.720364+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (14, 68, '88888888-8888-8888-8888-888888888888', 'ATTENDED', '2025-01-10 22:02:44.708625+00', '2025-01-10 22:02:44.708625+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (15, 68, '88888888-8888-8888-8888-888888888888', 'MISSED', '2025-01-10 22:02:45.0849+00', '2025-01-10 22:02:45.0849+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (16, 69, '88888888-8888-8888-8888-888888888888', 'ATTENDED', '2025-01-10 22:02:46.102519+00', '2025-01-10 22:02:46.102519+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (17, 69, '88888888-8888-8888-8888-888888888888', 'MISSED', '2025-01-10 22:02:46.371446+00', '2025-01-10 22:02:46.371446+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (18, 67, '44444444-4444-4444-4444-444444444444', 'ATTENDED', '2025-02-17 14:18:38.446459+00', '2025-02-17 14:18:38.446459+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (19, 68, '44444444-4444-4444-4444-444444444444', 'ATTENDED', '2025-02-17 14:18:39.105714+00', '2025-02-17 14:18:39.105714+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (20, 69, '44444444-4444-4444-4444-444444444444', 'ATTENDED', '2025-02-17 14:18:39.714973+00', '2025-02-17 14:18:39.714973+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (21, 70, '44444444-4444-4444-4444-444444444444', 'ATTENDED', '2025-02-17 14:18:40.422687+00', '2025-02-17 14:18:40.422687+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (22, 71, '44444444-4444-4444-4444-444444444444', 'ATTENDED', '2025-02-17 14:18:41.103224+00', '2025-02-17 14:18:41.103224+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (23, 72, '44444444-4444-4444-4444-444444444444', 'ATTENDED', '2025-02-17 14:18:42.138806+00', '2025-02-17 14:18:42.138806+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (24, 78, '77777777-7777-7777-7777-777777777777', 'ATTENDED', '2025-02-19 11:47:15.546857+00', '2025-02-19 11:47:15.546857+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (25, 79, '77777777-7777-7777-7777-777777777777', 'ATTENDED', '2025-02-19 11:47:16.081564+00', '2025-02-19 11:47:16.081564+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (26, 74, '88888888-8888-8888-8888-888888888888', 'ATTENDED', '2025-02-19 17:11:31.57154+00', '2025-02-19 17:11:31.57154+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (27, 73, '88888888-8888-8888-8888-888888888888', 'ATTENDED', '2025-02-19 17:11:32.145823+00', '2025-02-19 17:11:32.145823+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (28, 75, '88888888-8888-8888-8888-888888888888', 'ATTENDED', '2025-02-19 17:11:32.831119+00', '2025-02-19 17:11:32.831119+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (29, 76, '88888888-8888-8888-8888-888888888888', 'ATTENDED', '2025-02-19 17:11:33.572987+00', '2025-02-19 17:11:33.572987+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (30, 77, '88888888-8888-8888-8888-888888888888', 'ATTENDED', '2025-02-19 17:11:34.195371+00', '2025-02-19 17:11:34.195371+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (31, 78, '88888888-8888-8888-8888-888888888888', 'ATTENDED', '2025-02-19 17:11:34.734735+00', '2025-02-19 17:11:34.734735+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (32, 79, '88888888-8888-8888-8888-888888888888', 'ATTENDED', '2025-02-19 17:11:35.37437+00', '2025-02-19 17:11:35.37437+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (33, 80, '88888888-8888-8888-8888-888888888888', 'ATTENDED', '2025-02-19 17:11:36.137548+00', '2025-02-19 17:11:36.137548+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (34, 76, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-02-19 17:11:42.947363+00', '2025-02-19 17:11:42.947363+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (35, 77, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-02-19 17:11:43.800006+00', '2025-02-19 17:11:43.800006+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (36, 76, '11111111-1111-1111-1111-111111111111', 'MISSED', '2025-02-19 17:11:44.385018+00', '2025-02-19 17:11:44.385018+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (37, 77, '11111111-1111-1111-1111-111111111111', 'MISSED', '2025-02-19 17:11:45.929758+00', '2025-02-19 17:11:45.929758+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (38, 78, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-02-19 17:11:46.560108+00', '2025-02-19 17:11:46.560108+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (39, 78, '11111111-1111-1111-1111-111111111111', 'MISSED', '2025-02-19 17:11:47.152945+00', '2025-02-19 17:11:47.152945+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (40, 79, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-02-19 17:11:48.325593+00', '2025-02-19 17:11:48.325593+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (41, 79, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-02-19 17:11:48.582223+00', '2025-02-19 17:11:48.582223+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (42, 80, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-02-19 17:11:49.415013+00', '2025-02-19 17:11:49.415013+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (43, 80, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-02-19 17:11:49.640968+00', '2025-02-19 17:11:49.640968+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (44, 79, '11111111-1111-1111-1111-111111111111', 'MISSED', '2025-02-19 17:11:50.932934+00', '2025-02-19 17:11:50.932934+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (45, 80, '11111111-1111-1111-1111-111111111111', 'MISSED', '2025-02-19 17:11:51.786642+00', '2025-02-19 17:11:51.786642+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (46, 80, '77777777-7777-7777-7777-777777777777', 'ATTENDED', '2025-02-19 17:11:55.338709+00', '2025-02-19 17:11:55.338709+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (47, 80, '77777777-7777-7777-7777-777777777777', 'MISSED', '2025-02-19 17:11:56.31117+00', '2025-02-19 17:11:56.31117+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (48, 73, '55555555-5555-5555-5555-555555555555', 'ATTENDED', '2025-02-19 17:11:58.553792+00', '2025-02-19 17:11:58.553792+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (49, 74, '55555555-5555-5555-5555-555555555555', 'ATTENDED', '2025-02-19 17:11:59.182187+00', '2025-02-19 17:11:59.182187+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (50, 75, '55555555-5555-5555-5555-555555555555', 'ATTENDED', '2025-02-19 17:11:59.836537+00', '2025-02-19 17:11:59.836537+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (51, 76, '55555555-5555-5555-5555-555555555555', 'ATTENDED', '2025-02-19 17:12:01.084965+00', '2025-02-19 17:12:01.084965+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (52, 79, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-02-28 11:38:50.941556+00', '2025-02-28 11:38:50.941556+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (53, 78, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-02-28 11:38:51.757043+00', '2025-02-28 11:38:51.757043+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (54, 77, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-02-28 11:38:52.367301+00', '2025-02-28 11:38:52.367301+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (55, 76, '11111111-1111-1111-1111-111111111111', 'ATTENDED', '2025-02-28 11:38:53.316162+00', '2025-02-28 11:38:53.316162+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (56, 78, '55555555-5555-5555-5555-555555555555', 'ATTENDED', '2025-02-28 11:38:54.742736+00', '2025-02-28 11:38:54.742736+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (57, 77, '55555555-5555-5555-5555-555555555555', 'ATTENDED', '2025-02-28 11:38:55.674929+00', '2025-02-28 11:38:55.674929+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (58, 73, '66666666-6666-6666-6666-666666666666', 'ATTENDED', '2025-02-28 11:38:57.068951+00', '2025-02-28 11:38:57.068951+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (59, 74, '66666666-6666-6666-6666-666666666666', 'ATTENDED', '2025-02-28 11:38:57.449608+00', '2025-02-28 11:38:57.449608+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (60, 75, '66666666-6666-6666-6666-666666666666', 'ATTENDED', '2025-02-28 11:38:58.114751+00', '2025-02-28 11:38:58.114751+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (61, 76, '66666666-6666-6666-6666-666666666666', 'ATTENDED', '2025-02-28 11:38:58.993576+00', '2025-02-28 11:38:58.993576+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (62, 77, '66666666-6666-6666-6666-666666666666', 'ATTENDED', '2025-02-28 11:38:59.506369+00', '2025-02-28 11:38:59.506369+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (63, 78, '66666666-6666-6666-6666-666666666666', 'ATTENDED', '2025-02-28 11:38:59.822186+00', '2025-02-28 11:38:59.822186+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount") VALUES (64, 79, '66666666-6666-6666-6666-666666666666', 'ATTENDED', '2025-02-28 11:39:00.641586+00', '2025-02-28 11:39:00.641586+00', NULL, 'INSTRUCTOR', NULL, NULL, NULL, NULL);
-- Program-level attendance template for programs with attendance-capable courses
-- (Events id 3, Past Semester id 4, Current Semester id 5). Template id 2 is the
-- seeded "attendance certificate example" CertificateTemplate row.
UPDATE public."Program" SET "attendanceCertificateTemplateId" = 2 WHERE id IN (3, 4, 5);
-- Events (id 3) has no legacy image URL in the Program INSERT; reuse the Past Semester dev asset.
UPDATE public."Program" SET "attendanceCertificateTemplateURL" = '/programid_4/participation_certificate_template/opencampus_certificate_template_WS2022.png'
 WHERE id = 3 AND "attendanceCertificateTemplateURL" IS NULL;
UPDATE public."Course" SET "achievementCertificateTemplateId" = 1
 WHERE "programId" = 5 AND "achievementCertificatePossible" = true;
INSERT INTO public."CourseDegree" (id, "courseId", "degreeCourseId", created_at, updated_at) VALUES (1, 1, 7, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00');
INSERT INTO public."CourseDegree" (id, "courseId", "degreeCourseId", created_at, updated_at) VALUES (2, 2, 7, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00');
INSERT INTO public."CourseDegree" (id, "courseId", "degreeCourseId", created_at, updated_at) VALUES (3, 4, 7, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00');
INSERT INTO public."CourseDegree" (id, "courseId", "degreeCourseId", created_at, updated_at) VALUES (4, 5, 7, '2022-12-19 13:40:34.079378+00', '2022-12-19 13:55:01.645233+00');
INSERT INTO public."CourseDegree" (id, "courseId", "degreeCourseId", created_at, updated_at) VALUES (6, 301, 7, '2025-01-10 23:40:02.041841+00', '2025-01-10 23:40:02.041841+00');
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (401, 201, '11111111-1111-1111-1111-111111111111', 'COMPLETED', 'I am very interested in this course because it aligns with my career goals.', 'UNRATED', NULL, NULL, '2024-04-15 10:00:00+00', '2024-04-15 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (402, 201, '22222222-2222-2222-2222-222222222222', 'CONFIRMED', 'This course will help me develop essential skills for my future work.', 'UNRATED', NULL, NULL, '2024-04-15 11:00:00+00', '2024-04-15 11:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (403, 201, '33333333-3333-3333-3333-333333333333', 'APPLIED', 'I want to learn more about this subject to enhance my knowledge.', 'UNRATED', NULL, NULL, '2024-04-16 09:00:00+00', '2024-04-16 09:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (404, 202, '44444444-4444-4444-4444-444444444444', 'CONFIRMED', 'The course content seems very interesting and relevant to my studies.', 'UNRATED', NULL, NULL, '2024-04-16 10:00:00+00', '2024-04-16 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (405, 202, '55555555-5555-5555-5555-555555555555', 'INVITED', 'I believe this course will provide valuable insights for my academic journey.', 'UNRATED', NULL, NULL, '2024-04-16 11:00:00+00', '2024-04-16 11:00:00+00', '2025-01-01');
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (406, 202, '66666666-6666-6666-6666-666666666666', 'REJECTED', 'Looking forward to learning new concepts and practical applications.', 'UNRATED', NULL, NULL, '2024-04-17 09:00:00+00', '2024-04-17 09:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (407, 201, '77777777-7777-7777-7777-777777777777', 'CONFIRMED', 'The course topics align perfectly with my interests.', 'UNRATED', NULL, NULL, '2024-04-17 10:00:00+00', '2024-04-17 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (408, 201, '88888888-8888-8888-8888-888888888888', 'COMPLETED', 'I want to deepen my knowledge in this area.', 'UNRATED', NULL, NULL, '2024-04-17 11:00:00+00', '2024-04-17 11:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (409, 201, '99999999-9999-9999-9999-999999999999', 'CANCELLED', 'Very interested in the practical aspects.', 'UNRATED', NULL, NULL, '2024-04-18 09:00:00+00', '2024-04-18 09:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (410, 202, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'APPLIED', 'Looking to expand my skill set.', 'UNRATED', NULL, NULL, '2024-04-18 10:00:00+00', '2024-04-18 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (411, 202, '11111111-1111-1111-1111-111111111111', 'INVITED', 'The course description matches my learning goals.', 'UNRATED', NULL, NULL, '2024-04-18 11:00:00+00', '2024-04-18 11:00:00+00', '2025-01-01');
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (412, 202, '22222222-2222-2222-2222-222222222222', 'ABORTED', 'Excited about the learning opportunity.', 'UNRATED', NULL, NULL, '2024-04-19 09:00:00+00', '2024-04-19 09:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (413, 203, '33333333-3333-3333-3333-333333333333', 'APPLIED', 'The course seems very promising.', 'UNRATED', NULL, NULL, '2024-04-19 10:00:00+00', '2024-04-19 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (415, 203, '55555555-5555-5555-5555-555555555555', 'COMPLETED', 'The curriculum looks comprehensive.', 'UNRATED', NULL, NULL, '2024-04-20 09:00:00+00', '2024-04-20 09:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (416, 301, '66666666-6666-6666-6666-666666666666', 'APPLIED', 'Interested in learning new concepts.', 'UNRATED', NULL, NULL, '2024-09-15 10:00:00+00', '2024-09-15 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (417, 301, '77777777-7777-7777-7777-777777777777', 'INVITED', 'The course aligns with my career goals.', 'UNRATED', NULL, NULL, '2024-09-15 11:00:00+00', '2024-09-15 11:00:00+00', '2025-01-01');
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (418, 301, '88888888-8888-8888-8888-888888888888', 'CONFIRMED', 'Looking forward to participating.', 'UNRATED', NULL, NULL, '2024-09-16 09:00:00+00', '2024-09-16 09:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (419, 302, '99999999-9999-9999-9999-999999999999', 'APPLIED', 'The course content looks engaging.', 'UNRATED', NULL, NULL, '2024-09-16 10:00:00+00', '2024-09-16 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (420, 302, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'INVITED', 'Excited about the learning opportunities.', 'UNRATED', NULL, NULL, '2024-09-16 11:00:00+00', '2024-09-16 11:00:00+00', '2025-01-01');
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (450, 301, '33333333-3333-3333-3333-333333333333', 'CONFIRMED', 'Ready to start learning in this course.', 'UNRATED', NULL, NULL, '2024-09-19 09:00:00+00', '2024-09-19 09:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (451, 301, '44444444-4444-4444-4444-444444444444', 'CONFIRMED', 'Looking forward to participating actively.', 'UNRATED', NULL, NULL, '2024-09-19 10:00:00+00', '2024-09-19 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (454, 303, '11111111-1111-1111-1111-111111111111', 'CONFIRMED', 'Prepared to start this educational journey.', 'UNRATED', NULL, NULL, '2024-09-21 09:00:00+00', '2024-09-21 09:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (455, 303, '22222222-2222-2222-2222-222222222222', 'CONFIRMED', 'Looking forward to the course content.', 'UNRATED', NULL, NULL, '2024-09-21 10:00:00+00', '2024-09-21 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (456, 201, '44444444-4444-4444-4444-444444444444', 'CONFIRMED', 'Excited about the practical aspects of this course.', 'UNRATED', NULL, NULL, '2024-04-20 09:00:00+00', '2024-04-20 09:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (457, 201, '55555555-5555-5555-5555-555555555555', 'CONFIRMED', 'Looking forward to expanding my knowledge.', 'UNRATED', NULL, NULL, '2024-04-20 10:00:00+00', '2024-04-20 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (458, 202, '77777777-7777-7777-7777-777777777777', 'CONFIRMED', 'Ready to learn and contribute to discussions.', 'UNRATED', NULL, NULL, '2024-04-21 09:00:00+00', '2024-04-21 09:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (459, 202, '88888888-8888-8888-8888-888888888888', 'CONFIRMED', 'The course aligns perfectly with my goals.', 'UNRATED', NULL, NULL, '2024-04-21 10:00:00+00', '2024-04-21 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (460, 203, '99999999-9999-9999-9999-999999999999', 'CONFIRMED', 'Eager to participate in this learning opportunity.', 'UNRATED', NULL, NULL, '2024-04-22 09:00:00+00', '2024-04-22 09:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (461, 203, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CONFIRMED', 'Ready to engage with the course content.', 'UNRATED', NULL, NULL, '2024-04-22 10:00:00+00', '2024-04-22 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (462, 301, '55555555-5555-5555-5555-555555555555', 'CONFIRMED', 'Looking forward to the interactive sessions.', 'UNRATED', NULL, NULL, '2024-09-19 09:00:00+00', '2024-09-19 09:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (463, 301, '99999999-9999-9999-9999-999999999999', 'CONFIRMED', 'Excited about the learning journey ahead.', 'UNRATED', NULL, NULL, '2024-09-19 10:00:00+00', '2024-09-19 10:00:00+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (414, 203, '44444444-4444-4444-4444-444444444444', 'CONFIRMED', 'I believe this course will be beneficial.', 'UNRATED', 'test.url', '', '2024-04-19 11:00:00+00', '2025-01-10 23:25:48.528928+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (421, 302, '11111111-1111-1111-1111-111111111111', 'CONFIRMED', 'Ready to learn and contribute.', 'UNRATED', NULL, '11111111-1111-1111-1111-111111111111/302/attendance_certificate.pdf', '2024-09-17 09:00:00+00', '2025-02-28 11:39:18.266859+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (452, 302, '55555555-5555-5555-5555-555555555555', 'CONFIRMED', 'Excited to join this learning journey.', 'UNRATED', NULL, '55555555-5555-5555-5555-555555555555/302/attendance_certificate.pdf', '2024-09-20 09:00:00+00', '2025-02-28 11:39:19.81912+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (453, 302, '66666666-6666-6666-6666-666666666666', 'CONFIRMED', 'Ready to engage with the course material.', 'UNRATED', NULL, '66666666-6666-6666-6666-666666666666/302/attendance_certificate.pdf', '2024-09-20 10:00:00+00', '2025-02-28 11:39:20.990522+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (464, 302, '77777777-7777-7777-7777-777777777777', 'CONFIRMED', 'Ready to start this educational experience.', 'UNRATED', NULL, '77777777-7777-7777-7777-777777777777/302/attendance_certificate.pdf', '2024-09-20 09:00:00+00', '2025-02-28 11:39:22.378815+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (465, 302, '88888888-8888-8888-8888-888888888888', 'CONFIRMED', 'Looking forward to collaborative learning.', 'UNRATED', 'test.url', '88888888-8888-8888-8888-888888888888/302/attendance_certificate.pdf', '2024-09-20 10:00:00+00', '2025-02-28 11:39:23.151425+00', NULL);
INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate") VALUES (466, 4, '8914bee9-0549-44af-bcae-cafeec5ba92e', 'COMPLETED', 'Admin seed enrollment for certificate download testing.', 'UNRATED', '8914bee9-0549-44af-bcae-cafeec5ba92e/4/achievement_certificate.pdf', '8914bee9-0549-44af-bcae-cafeec5ba92e/4/attendance_certificate.pdf', '2025-05-19 09:00:00+00', '2025-05-19 09:00:00+00', NULL);
INSERT INTO public."CourseFundingOrganization" (id, "courseId", "organizationId", created_at, updated_at) VALUES (1, 302, 160, '2025-11-28 09:44:09.478479+00', '2025-11-28 09:44:09.478479+00');
INSERT INTO public."CourseFundingOrganization" (id, "courseId", "organizationId", created_at, updated_at) VALUES (2, 301, 160, '2025-11-28 09:44:33.610791+00', '2025-11-28 09:44:33.610791+00');
INSERT INTO public."CourseFundingOrganization" (id, "courseId", "organizationId", created_at, updated_at) VALUES (3, 7, 160, '2025-11-28 09:45:16.853692+00', '2025-11-28 09:45:16.853692+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (1, 1, 1, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (2, 2, 2, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (3, 3, 3, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (4, 4, 1, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (5, 4, 2, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (6, 5, 2, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (7, 6, 3, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (8, 6, 2, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (9, 7, 4, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (10, 8, 5, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (12, 202, 2, '2025-01-10 23:39:18.684495+00', '2025-01-10 23:39:18.684495+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (13, 203, 3, '2025-01-10 23:39:27.128352+00', '2025-01-10 23:39:27.128352+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (14, 302, 1, '2025-01-10 23:39:48.061137+00', '2025-01-10 23:39:48.061137+00');
INSERT INTO public."CourseGroup" (id, "courseId", "groupOptionId", created_at, updated_at) VALUES (15, 301, 3, '2025-01-10 23:39:57.485279+00', '2025-01-10 23:39:57.485279+00');
INSERT INTO public."CourseInstructor" (id, "courseId", "userId", created_at, updated_at) VALUES (1, 302, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-02-19 17:09:38.249734+00', '2025-02-19 17:09:38.249734+00');
INSERT INTO public."CourseLocation" (id, "courseId", created_at, updated_at, "locationOption", "defaultSessionAddress", "defaultSessionAddressId") VALUES (1, 1, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00', 'KIEL', 'Musterstraße 21, 22232 Kiel', NULL);
INSERT INTO public."CourseLocation" (id, "courseId", created_at, updated_at, "locationOption", "defaultSessionAddress", "defaultSessionAddressId") VALUES (2, 1, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00', 'ONLINE', 'https://zoom.us', NULL);
INSERT INTO public."CourseLocation" (id, "courseId", created_at, updated_at, "locationOption", "defaultSessionAddress", "defaultSessionAddressId") VALUES (3, 2, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00', 'KIEL', NULL, NULL);
INSERT INTO public."CourseLocation" (id, "courseId", created_at, updated_at, "locationOption", "defaultSessionAddress", "defaultSessionAddressId") VALUES (4, 4, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00', 'KIEL', 'Musterstraße 21, 22232 Kiel', NULL);
INSERT INTO public."CourseLocation" (id, "courseId", created_at, updated_at, "locationOption", "defaultSessionAddress", "defaultSessionAddressId") VALUES (5, 4, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00', 'ONLINE', 'https://zoom.us', NULL);
INSERT INTO public."CourseLocation" (id, "courseId", created_at, updated_at, "locationOption", "defaultSessionAddress", "defaultSessionAddressId") VALUES (6, 2, '2022-12-19 12:56:07.352338+00', '2022-12-19 12:56:12.475054+00', 'ONLINE', NULL, NULL);
INSERT INTO public."CourseLocation" (id, "courseId", created_at, updated_at, "locationOption", "defaultSessionAddress", "defaultSessionAddressId") VALUES (8, 3, '2024-12-30 10:14:32.12597+00', '2024-12-30 10:14:32.12597+00', 'HEIDE', '', NULL);
INSERT INTO public."CourseLocation" (id, "courseId", created_at, updated_at, "locationOption", "defaultSessionAddress", "defaultSessionAddressId") VALUES (9, 3, '2024-12-30 10:14:36.893896+00', '2024-12-30 10:14:39.681446+00', 'ONLINE', '', NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (1, 'Feedback zu Present Course 1 bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Student1 Student1,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Present Course 1 bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Present Course 1&t=Session7 for Present Course 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'student1@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-11-05 18:00:07.938518+00', '2024-11-05 18:00:07.938518+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (2, 'Feedback zu Present Course 1 bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Student2 Student2,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Present Course 1 bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Present Course 1&t=Session7 for Present Course 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'student2@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-11-05 18:00:07.950837+00', '2024-11-05 18:00:07.950837+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (3, 'Feedback zu Present Course 1 bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Student3 Student3,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Present Course 1 bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Present Course 1&t=Session7 for Present Course 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'student3@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-11-05 18:00:07.958706+00', '2024-11-05 18:00:07.958706+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (4, 'Feedback zu Current Course C bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Maria Schmidt,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course C bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Current Course C&t=Session 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'maria.schmidt@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.541326+00', '2024-12-30 12:00:02.541326+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (5, 'Feedback zu Current Course C bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Thomas Mueller,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course C bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Current Course C&t=Session 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'thomas.mueller@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.550755+00', '2024-12-30 12:00:02.550755+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (6, 'Feedback zu Current Course C bei opencampus.sh', '<!DOCTYPE html>
                <html>
                  <head>
                    <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                  </head>
                  <body>
                    <p>Hallo Maria Schmidt,</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course C bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                    <p><a href="https://survey.opencampus.sh/?&c=Current Course C&t=Session 8&p=Current Semester"> Zum Fragebogen </a></p>
                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>', 'maria.schmidt@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.608336+00', '2024-12-30 12:00:02.608336+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (7, 'Feedback zu Current Course C bei opencampus.sh', '<!DOCTYPE html>
                <html>
                  <head>
                    <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                  </head>
                  <body>
                    <p>Hallo Thomas Mueller,</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course C bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                    <p><a href="https://survey.opencampus.sh/?&c=Current Course C&t=Session 8&p=Current Semester"> Zum Fragebogen </a></p>
                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>', 'thomas.mueller@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.617195+00', '2024-12-30 12:00:02.617195+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (8, 'Feedback zu Current Course B bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Maria Schmidt,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course B bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Current Course B&t=Session 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'maria.schmidt@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.632784+00', '2024-12-30 12:00:02.632784+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (9, 'Feedback zu Current Course B bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Laura Wagner,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course B bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Current Course B&t=Session 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'laura.wagner@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.642385+00', '2024-12-30 12:00:02.642385+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (10, 'Feedback zu Current Course B bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Felix Becker,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course B bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Current Course B&t=Session 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'felix.becker@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.652028+00', '2024-12-30 12:00:02.652028+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (11, 'Feedback zu Current Course B bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Emma Koch,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course B bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Current Course B&t=Session 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'emma.koch@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.65977+00', '2024-12-30 12:00:02.65977+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (12, 'Feedback zu Current Course B bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Max Schulz,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course B bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Current Course B&t=Session 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'max.schulz@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.667334+00', '2024-12-30 12:00:02.667334+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (13, 'Feedback zu Current Course B bei opencampus.sh', '<!DOCTYPE html>
                <html>
                  <head>
                    <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                  </head>
                  <body>
                    <p>Hallo Maria Schmidt,</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course B bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                    <p><a href="https://survey.opencampus.sh/?&c=Current Course B&t=Session 8&p=Current Semester"> Zum Fragebogen </a></p>
                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>', 'maria.schmidt@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.73298+00', '2024-12-30 12:00:02.73298+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (14, 'Feedback zu Current Course B bei opencampus.sh', '<!DOCTYPE html>
                <html>
                  <head>
                    <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                  </head>
                  <body>
                    <p>Hallo Laura Wagner,</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course B bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                    <p><a href="https://survey.opencampus.sh/?&c=Current Course B&t=Session 8&p=Current Semester"> Zum Fragebogen </a></p>
                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>', 'laura.wagner@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.740509+00', '2024-12-30 12:00:02.740509+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (15, 'Feedback zu Current Course B bei opencampus.sh', '<!DOCTYPE html>
                <html>
                  <head>
                    <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                  </head>
                  <body>
                    <p>Hallo Felix Becker,</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course B bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                    <p><a href="https://survey.opencampus.sh/?&c=Current Course B&t=Session 8&p=Current Semester"> Zum Fragebogen </a></p>
                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>', 'felix.becker@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.746524+00', '2024-12-30 12:00:02.746524+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (16, 'Feedback zu Current Course B bei opencampus.sh', '<!DOCTYPE html>
                <html>
                  <head>
                    <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                  </head>
                  <body>
                    <p>Hallo Emma Koch,</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course B bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                    <p><a href="https://survey.opencampus.sh/?&c=Current Course B&t=Session 8&p=Current Semester"> Zum Fragebogen </a></p>
                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>', 'emma.koch@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.753822+00', '2024-12-30 12:00:02.753822+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (17, 'Feedback zu Current Course B bei opencampus.sh', '<!DOCTYPE html>
                <html>
                  <head>
                    <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                  </head>
                  <body>
                    <p>Hallo Max Schulz,</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course B bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                    <p><a href="https://survey.opencampus.sh/?&c=Current Course B&t=Session 8&p=Current Semester"> Zum Fragebogen </a></p>
                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>', 'max.schulz@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.760261+00', '2024-12-30 12:00:02.760261+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (18, 'Feedback zu Current Course A bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Max Schulz,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course A bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Current Course A&t=Session 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'max.schulz@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.773995+00', '2024-12-30 12:00:02.773995+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (19, 'Feedback zu Current Course A bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Sophie Weber,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course A bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Current Course A&t=Session 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'sophie.weber@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.780393+00', '2024-12-30 12:00:02.780393+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (20, 'Feedback zu Current Course A bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Alexander Fischer,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course A bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Current Course A&t=Session 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'alexander.fischer@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.788609+00', '2024-12-30 12:00:02.788609+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (21, 'Feedback zu Current Course A bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Laura Wagner,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course A bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Current Course A&t=Session 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'laura.wagner@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.794192+00', '2024-12-30 12:00:02.794192+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (22, 'Feedback zu Current Course A bei opencampus.sh', '<!DOCTYPE html>
                  <html>
                    <head>
                      <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                    </head>
                    <body>
                      <p>Hallo Julia Hoffmann,</p>
                      <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course A bei opencampus.sh.</p>
                      <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                      <p><a href="https://survey.opencampus.sh/?&c=Current Course A&t=Session 1&p=Current Semester"> Zum Fragebogen </a></p>
                      <p>Viele Grüße</p>
                      <p>Dein opencampus.sh Team</p>
                    </body>
                  </html>', 'julia.hoffmann@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.800997+00', '2024-12-30 12:00:02.800997+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (23, 'Feedback zu Current Course A bei opencampus.sh', '<!DOCTYPE html>
                <html>
                  <head>
                    <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                  </head>
                  <body>
                    <p>Hallo Max Schulz,</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course A bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                    <p><a href="https://survey.opencampus.sh/?&c=Current Course A&t=Session 8&p=Current Semester"> Zum Fragebogen </a></p>
                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>', 'max.schulz@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.905168+00', '2024-12-30 12:00:02.905168+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (24, 'Feedback zu Current Course A bei opencampus.sh', '<!DOCTYPE html>
                <html>
                  <head>
                    <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                  </head>
                  <body>
                    <p>Hallo Sophie Weber,</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course A bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                    <p><a href="https://survey.opencampus.sh/?&c=Current Course A&t=Session 8&p=Current Semester"> Zum Fragebogen </a></p>
                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>', 'sophie.weber@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.914382+00', '2024-12-30 12:00:02.914382+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (25, 'Feedback zu Current Course A bei opencampus.sh', '<!DOCTYPE html>
                <html>
                  <head>
                    <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                  </head>
                  <body>
                    <p>Hallo Alexander Fischer,</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course A bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                    <p><a href="https://survey.opencampus.sh/?&c=Current Course A&t=Session 8&p=Current Semester"> Zum Fragebogen </a></p>
                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>', 'alexander.fischer@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.923125+00', '2024-12-30 12:00:02.923125+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (26, 'Feedback zu Current Course A bei opencampus.sh', '<!DOCTYPE html>
                <html>
                  <head>
                    <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                  </head>
                  <body>
                    <p>Hallo Laura Wagner,</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course A bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                    <p><a href="https://survey.opencampus.sh/?&c=Current Course A&t=Session 8&p=Current Semester"> Zum Fragebogen </a></p>
                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>', 'laura.wagner@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.929527+00', '2024-12-30 12:00:02.929527+00', NULL, NULL, NULL);
INSERT INTO public."MailLog" (id, subject, content, "to", "from", cc, bcc, created_at, updated_at, "templateId", status, "scheduledAt") VALUES (27, 'Feedback zu Current Course A bei opencampus.sh', '<!DOCTYPE html>
                <html>
                  <head>
                    <meta content=''text/html; charset=UTF-8'' http-equiv=''Content-Type'' />
                  </head>
                  <body>
                    <p>Hallo Julia Hoffmann,</p>
                    <p>anbei schicken wir Dir einen (sehr kurzen) Fragebogen zur Evaluation Deines Kurses Current Course A bei opencampus.sh.</p>
                    <p>Bitte nimm Dir kurz die Zeit, um ihn auszufüllen. Dein Feedback ist ein wichtiges Hilfsmittel für uns, um unser Programm weiterzuentwickeln.</p>
                    <p><a href="https://survey.opencampus.sh/?&c=Current Course A&t=Session 8&p=Current Semester"> Zum Fragebogen </a></p>
                    <p>Viele Grüße</p>
                    <p>Dein opencampus.sh Team</p>
                  </body>
                </html>', 'julia.hoffmann@example.com', 'noreply@edu.opencampus.sh', NULL, NULL, '2024-12-30 12:00:02.93538+00', '2024-12-30 12:00:02.93538+00', NULL, NULL, NULL);
INSERT INTO public."OrganizationAdmin" (id, "userId", "organizationId", "canManageCourses", "canManageEvents", "canManageSettings", updated_at, created_at) VALUES (1, '11111111-1111-1111-1111-111111111111', 42, true, false, false, '2025-01-22 14:13:53.101281+00', '2025-01-22 14:13:53.101281+00');
INSERT INTO public."OrganizationAdmin" (id, "userId", "organizationId", "canManageCourses", "canManageEvents", "canManageSettings", updated_at, created_at) VALUES (2, '11111111-1111-1111-1111-111111111111', 67, false, true, false, '2025-01-22 14:16:03.261301+00', '2025-01-22 14:16:03.261301+00');
INSERT INTO public."OrganizationAdmin" (id, "userId", "organizationId", "canManageCourses", "canManageEvents", "canManageSettings", updated_at, created_at) VALUES (3, '33333333-3333-3333-3333-333333333333', 67, false, true, true, '2025-01-22 14:16:21.054925+00', '2025-01-22 14:16:21.054925+00');
INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId", "locationAddressId") VALUES (1, '2024-11-25 15:38:22.482944+00', '2024-11-25 15:38:22.482944+00', 29, '', 1, NULL);
INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId", "locationAddressId") VALUES (2, '2024-11-25 15:38:22.482944+00', '2024-11-25 15:38:22.482944+00', 29, '', 2, NULL);
INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId", "locationAddressId") VALUES (3, '2024-11-25 15:38:22.73501+00', '2024-11-25 15:38:22.73501+00', 30, '', 1, NULL);
INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId", "locationAddressId") VALUES (4, '2024-11-25 15:38:22.73501+00', '2024-11-25 15:38:22.73501+00', 30, '', 2, NULL);
INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId", "locationAddressId") VALUES (5, '2024-11-25 15:38:23.004908+00', '2024-11-25 15:38:23.004908+00', 31, '', 1, NULL);
INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId", "locationAddressId") VALUES (6, '2024-11-25 15:38:23.004908+00', '2024-11-25 15:38:23.004908+00', 31, '', 2, NULL);
INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId", "locationAddressId") VALUES (7, '2024-12-30 10:14:42.822369+00', '2024-12-30 10:14:42.822369+00', 37, '', 8, NULL);
INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId", "locationAddressId") VALUES (8, '2024-12-30 10:14:42.822369+00', '2024-12-30 10:14:42.822369+00', 37, '', 9, NULL);
INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId", "locationAddressId") VALUES (9, '2024-12-30 10:15:39.648192+00', '2024-12-30 10:15:39.648192+00', 38, '', 8, NULL);
INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId", "locationAddressId") VALUES (10, '2024-12-30 10:15:39.648192+00', '2024-12-30 10:15:39.648192+00', 38, '', 9, NULL);
INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId", "locationAddressId") VALUES (11, '2024-12-30 10:16:04.499158+00', '2024-12-30 10:16:04.499158+00', 39, '', 8, NULL);
INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId", "locationAddressId") VALUES (12, '2024-12-30 10:16:04.499158+00', '2024-12-30 10:16:04.499158+00', 39, '', 9, NULL);

DO $$
DECLARE
  degree_id integer := 7000;
  user_index integer;
  generated_user_id uuid;
  first_names text[] := ARRAY[
    'Mina', 'Jonas', 'Aisha', 'Leon', 'Sofia', 'Noah', 'Amara', 'Felix', 'Elena', 'Yusuf',
    'Nina', 'Mateo', 'Leila', 'Oskar', 'Priya', 'Lena', 'Samir', 'Maya', 'Theo', 'Hannah',
    'Anika', 'Daniel', 'Sara', 'Tobias', 'Nora', 'Ibrahim', 'Clara', 'David', 'Rania', 'Emil'
  ];
  last_names text[] := ARRAY[
    'Schmidt', 'Mueller', 'Khan', 'Weber', 'Garcia', 'Fischer', 'Nguyen', 'Becker', 'Silva', 'Hoffmann',
    'Ivanova', 'Koch', 'Ahmed', 'Schulz', 'Patel', 'Wagner', 'Rossi', 'Neumann', 'Yilmaz', 'Krause',
    'Santos', 'Schneider', 'Nowak', 'Bauer', 'Kim', 'Lehmann', 'Rahman', 'Wolf', 'Fernandez', 'Petersen',
    'Meyer', 'Klein', 'Lange', 'Schroeder', 'Richter', 'Walter', 'Koenig', 'Hartmann', 'Werner', 'Schwarz',
    'Zimmermann', 'Braun', 'Krueger', 'Hofmann', 'Ludwig', 'Berger', 'Albrecht', 'Sommer', 'Brandt', 'Jung',
    'Ali', 'Hassan', 'Singh', 'Meier', 'Moreno', 'Costa', 'Novak', 'Horvath', 'Petrov', 'Sokolov',
    'Popescu', 'Ionescu', 'Kowalski', 'Lis', 'Dvorak', 'Svoboda', 'Benali', 'El Amrani', 'Diop', 'Mensah',
    'Okafor', 'Adebayo', 'Ndiaye', 'Mbeki', 'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Tanaka',
    'Sato', 'Yamamoto', 'Park', 'Choi', 'Jensen', 'Nielsen', 'Andersen', 'Larsen', 'Johansson', 'Lindberg',
    'Virtanen', 'Korhonen', 'Hernandez', 'Lopez', 'Martinez', 'Gonzalez', 'Rodriguez', 'Torres', 'Ramirez', 'Castro',
    'Bennett', 'Carter', 'Morgan', 'Taylor', 'Wilson', 'Brown', 'Johnson', 'Miller', 'Davis', 'Clark',
    'Dubois', 'Moreau', 'Lefevre', 'Martin', 'Bernard', 'Roux', 'Conti', 'Bianchi', 'Esposito', 'Ferrari'
  ];
  event_count_patterns integer[] := ARRAY[0, 0, 0, 0, 1, 2, 4, 1, 1, 0, 0, 0];
  passed_courses integer[];
  enrolled_courses integer[];
  passed_ects_total numeric;
  attended_event_count integer;
  completion_requirements_met boolean;
  event_course_ids integer[] := ARRAY[7101, 7102, 7103, 7104, 7105];
  event_position integer;
  course_id integer;
  event_index integer;
  status_value text;
  generated_first_name text;
  generated_last_name text;
  pattern_variant integer;
BEGIN
  INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES
    (7000, 'Machine Learning Degree', 'APPLICANTS_INVITED', '12.5', 'Production-like seed degree for performance checks of degree participations.', 'EN', '2026-04-30', '0', true, false, 2, 'NONE', NULL, '2025-11-13 11:00:00+00', '2026-04-20 05:00:00+00', 2, 'Machine Learning portfolio', 'Certificate requirements', 'Complete a realistic mix of ML courses and events.', 'Used for local performance testing.', 'Build, evaluate, and deploy machine learning systems.', 'https://chat.opencampus.sh', 350, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7001, 'Data Science and Machine Learning Foundations', 'APPLICANTS_INVITED', '5', 'Core data science and machine learning foundations.', 'EN', '2024-03-31', '0', true, true, 2, 'TUESDAY', NULL, '2024-01-15 10:00:00+00', '2024-09-04 12:00:00+00', 4, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7002, 'Machine Learning with TensorFlow', 'APPLICANTS_INVITED', '5', 'Applied neural network modeling with TensorFlow.', 'EN', '2024-03-31', '0', true, true, 2, 'WEDNESDAY', NULL, '2024-01-15 10:00:00+00', '2024-09-04 12:00:00+00', 4, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7003, 'Intermediate Machine Learning', 'APPLICANTS_INVITED', '5', 'Model selection, feature engineering, and validation.', 'EN', '2024-09-30', '0', true, true, 2, 'THURSDAY', NULL, '2024-08-15 10:00:00+00', '2025-03-25 12:00:00+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7004, 'From LLMs to AI Agents', 'APPLICANTS_INVITED', '5', 'Design patterns for agentic AI systems.', 'EN', '2025-03-31', '0', true, true, 2, 'MONDAY', NULL, '2025-01-15 10:00:00+00', '2025-11-13 11:30:00+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 160, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7005, 'Introduction to Data Science & Machine Learning', 'APPLICANTS_INVITED', '5', 'English-language introduction to ML workflows.', 'EN', '2025-09-30', '0', true, true, 2, 'TUESDAY', NULL, '2025-08-15 10:00:00+00', '2026-03-25 07:50:00+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 160, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7006, 'Advanced Time Series Prediction', 'APPLICANTS_INVITED', '5', 'Forecasting with statistical and neural models.', 'EN', '2025-03-31', '0', true, true, 2, 'WEDNESDAY', NULL, '2025-01-15 10:00:00+00', '2025-11-13 11:20:00+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7007, 'Scientific Machine Learning', 'APPLICANTS_INVITED', '5', 'Scientific computing with ML methods.', 'EN', '2025-09-30', '0', true, true, 2, 'THURSDAY', NULL, '2025-08-15 10:00:00+00', '2026-03-25 07:50:00+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7008, 'Fine-Tuning and Deployment of Large Language Models', 'APPLICANTS_INVITED', '2.5', 'Hands-on LLM adaptation and deployment.', 'EN', '2024-03-31', '0', true, true, 2, 'FRIDAY', NULL, '2024-01-15 10:00:00+00', '2024-09-04 13:13:00+00', 4, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7009, 'Applied Machine Learning', 'APPLICANTS_INVITED', '5', 'Current applied ML project course.', 'EN', '2026-04-30', '0', true, true, 2, 'MONDAY', NULL, '2026-03-01 10:00:00+00', '2026-04-20 05:00:00+00', 6, NULL, NULL, NULL, NULL, NULL, NULL, 180, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7010, 'Introduction to Deep Reinforcement Learning', 'APPLICANTS_INVITED', '5', 'Foundations of reinforcement learning.', 'EN', '2026-04-30', '0', true, true, 2, 'TUESDAY', NULL, '2026-03-01 10:00:00+00', '2026-04-20 05:00:00+00', 6, NULL, NULL, NULL, NULL, NULL, NULL, 180, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7011, 'Causal Inference and ML', 'APPLICANTS_INVITED', '5', 'Causal reasoning for machine learning systems.', 'EN', '2026-04-30', '0', true, true, 2, 'WEDNESDAY', NULL, '2026-03-01 10:00:00+00', '2026-04-20 05:00:00+00', 6, NULL, NULL, NULL, NULL, NULL, NULL, 180, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7012, 'AI Builder''s Arena', 'APPLICANTS_INVITED', 'NONE', 'Experimental AI prototyping format.', 'EN', '2024-09-30', '0', false, true, 2, 'THURSDAY', NULL, '2024-08-15 10:00:00+00', '2024-11-13 11:20:00+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7101, 'Coding.Waterkant 2021', 'APPLICANTS_INVITED', 'NONE', 'Machine-learning community event.', 'EN', '2021-09-01', '0', false, true, 0, 'NONE', NULL, '2021-08-01 10:00:00+00', '2021-09-04 12:00:00+00', 3, NULL, NULL, NULL, NULL, NULL, NULL, 350, '18:00:00', '10:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7102, 'Coding.Waterkant 2024', 'APPLICANTS_INVITED', 'NONE', 'Machine-learning community event.', 'EN', '2024-09-01', '0', false, true, 0, 'NONE', NULL, '2024-08-01 10:00:00+00', '2024-09-04 12:00:00+00', 3, NULL, NULL, NULL, NULL, NULL, NULL, 350, '18:00:00', '10:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7103, 'Coding.Waterkant 2025', 'APPLICANTS_INVITED', 'NONE', 'Machine-learning community event.', 'EN', '2025-09-01', '0', false, true, 0, 'NONE', NULL, '2025-08-01 10:00:00+00', '2025-11-13 11:26:00+00', 3, NULL, NULL, NULL, NULL, NULL, NULL, 350, '18:00:00', '10:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7104, 'ML Ops Community Night', 'APPLICANTS_INVITED', 'NONE', 'Evening event for model deployment practices.', 'EN', '2025-10-01', '0', false, true, 0, 'NONE', NULL, '2025-09-01 10:00:00+00', '2025-11-13 11:27:00+00', 3, NULL, NULL, NULL, NULL, NULL, NULL, 250, '21:00:00', '18:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
    (7105, 'Responsible AI Lab Day', 'APPLICANTS_INVITED', 'NONE', 'Hands-on event for responsible AI methods.', 'EN', '2026-03-01', '0', false, true, 0, 'NONE', NULL, '2026-02-01 10:00:00+00', '2026-04-20 05:00:00+00', 3, NULL, NULL, NULL, NULL, NULL, NULL, 250, '18:00:00', '10:00:00', true, NULL, 'APPROVAL_WITH_INPUT')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public."CourseDegree" (id, "courseId", "degreeCourseId", created_at, updated_at)
  SELECT 7000 + row_number() OVER (), linked_course.course_id, degree_id, '2026-04-20 05:00:00+00'::timestamptz, '2026-04-20 05:00:00+00'::timestamptz
  FROM unnest(ARRAY[7001, 7002, 7003, 7004, 7005, 7006, 7007, 7008, 7009, 7010, 7011, 7012, 7101, 7102, 7103, 7104, 7105]) AS linked_course(course_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent)
  SELECT 71000 + event_series.event_index,
         'Attendance checkpoint',
         'Seeded event attendance session',
         ('2025-10-01 10:00:00+00'::timestamptz + ((event_series.event_index - 1) * interval '30 days')),
         ('2025-10-01 18:00:00+00'::timestamptz + ((event_series.event_index - 1) * interval '30 days')),
         7100 + event_series.event_index,
         '2026-04-20 05:00:00+00'::timestamptz,
         '2026-04-20 05:00:00+00'::timestamptz,
         NULL,
         true
  FROM generate_series(1, 5) AS event_series(event_index)
  ON CONFLICT (id) DO NOTHING;

  FOR user_index IN 1..300 LOOP
    generated_user_id := format('90000000-0000-0000-0000-%s', lpad(user_index::text, 12, '0'))::uuid;
    generated_first_name := first_names[
      (
        (user_index - 1)
        + ((user_index - 1) / array_length(first_names, 1))
      ) % array_length(first_names, 1) + 1
    ];
    generated_last_name := last_names[
      (
        (user_index - 1)
        + ((user_index - 1) / array_length(last_names, 1))
      ) % array_length(last_names, 1) + 1
    ];
    pattern_variant := ((user_index - 1) / 12) % 6;
    passed_courses := CASE ((user_index - 1) % 12)
      WHEN 0 THEN ARRAY[]::integer[]
      WHEN 1 THEN CASE pattern_variant
        WHEN 0 THEN ARRAY[7001]
        WHEN 1 THEN ARRAY[7002]
        WHEN 2 THEN ARRAY[7003]
        WHEN 3 THEN ARRAY[7004]
        WHEN 4 THEN ARRAY[7005]
        ELSE ARRAY[7006]
      END
      WHEN 2 THEN CASE pattern_variant
        WHEN 0 THEN ARRAY[7001, 7002]
        WHEN 1 THEN ARRAY[7003, 7004]
        WHEN 2 THEN ARRAY[7005, 7006]
        WHEN 3 THEN ARRAY[7007, 7009]
        WHEN 4 THEN ARRAY[7010, 7011]
        ELSE ARRAY[7002, 7005]
      END
      WHEN 3 THEN CASE pattern_variant
        WHEN 0 THEN ARRAY[7001, 7002, 7008]
        WHEN 1 THEN ARRAY[7003, 7004, 7008]
        WHEN 2 THEN ARRAY[7005, 7006, 7008]
        WHEN 3 THEN ARRAY[7007, 7009, 7008]
        WHEN 4 THEN ARRAY[7010, 7011, 7008]
        ELSE ARRAY[7001, 7005, 7008]
      END
      WHEN 4 THEN CASE pattern_variant
        WHEN 0 THEN ARRAY[7001, 7002, 7003]
        WHEN 1 THEN ARRAY[7004, 7005, 7006]
        WHEN 2 THEN ARRAY[7007, 7009, 7010]
        WHEN 3 THEN ARRAY[7002, 7005, 7011]
        WHEN 4 THEN ARRAY[7001, 7006, 7009]
        ELSE ARRAY[7003, 7007, 7010]
      END
      WHEN 5 THEN CASE pattern_variant
        WHEN 0 THEN ARRAY[7002, 7003, 7004]
        WHEN 1 THEN ARRAY[7005, 7006, 7007]
        WHEN 2 THEN ARRAY[7009, 7010, 7011]
        WHEN 3 THEN ARRAY[7001, 7004, 7007]
        WHEN 4 THEN ARRAY[7002, 7006, 7010]
        ELSE ARRAY[7003, 7005, 7011]
      END
      WHEN 6 THEN CASE pattern_variant
        WHEN 0 THEN ARRAY[7001, 7002, 7003, 7004, 7005]
        WHEN 1 THEN ARRAY[7002, 7003, 7004, 7005, 7006]
        WHEN 2 THEN ARRAY[7003, 7004, 7005, 7006, 7007]
        WHEN 3 THEN ARRAY[7004, 7005, 7006, 7007, 7009]
        WHEN 4 THEN ARRAY[7005, 7006, 7007, 7009, 7010]
        ELSE ARRAY[7006, 7007, 7009, 7010, 7011]
      END
      WHEN 7 THEN ARRAY[]::integer[]
      WHEN 8 THEN CASE pattern_variant
        WHEN 0 THEN ARRAY[7002, 7008]
        WHEN 1 THEN ARRAY[7004, 7008]
        WHEN 2 THEN ARRAY[7006, 7008]
        WHEN 3 THEN ARRAY[7009, 7008]
        WHEN 4 THEN ARRAY[7011, 7008]
        ELSE ARRAY[7001, 7008]
      END
      WHEN 9 THEN CASE pattern_variant
        WHEN 0 THEN ARRAY[7005, 7006]
        WHEN 1 THEN ARRAY[7007, 7009]
        WHEN 2 THEN ARRAY[7010, 7011]
        WHEN 3 THEN ARRAY[7001, 7004]
        WHEN 4 THEN ARRAY[7002, 7006]
        ELSE ARRAY[7003, 7009]
      END
      WHEN 10 THEN CASE pattern_variant
        WHEN 0 THEN ARRAY[7001, 7003, 7007]
        WHEN 1 THEN ARRAY[7002, 7004, 7009]
        WHEN 2 THEN ARRAY[7005, 7010, 7011]
        WHEN 3 THEN ARRAY[7001, 7006, 7009]
        WHEN 4 THEN ARRAY[7002, 7007, 7010]
        ELSE ARRAY[7003, 7005, 7011]
      END
      ELSE ARRAY[]::integer[]
    END;
    attended_event_count := CASE
      WHEN ((user_index - 1) % 12) = 6 THEN 1 + (pattern_variant % 4)
      ELSE event_count_patterns[((user_index - 1) % array_length(event_count_patterns, 1)) + 1]
    END;
    passed_ects_total := (
      SELECT COALESCE(
        SUM(
          CASE
            WHEN course.ects ~ '^[0-9]+([,.][0-9]+)?$'
              THEN replace(course.ects, ',', '.')::numeric
            ELSE 0
          END
        ),
        0
      )
      FROM public."Course" course
      WHERE course.id = ANY(passed_courses)
    );
    completion_requirements_met := passed_ects_total >= 12.5 AND attended_event_count >= 1;
    enrolled_courses := CASE ((user_index - 1) % 12)
      WHEN 0 THEN ARRAY[7009 + (pattern_variant % 3)]
      WHEN 1 THEN ARRAY[7007 + (pattern_variant % 5)]
      WHEN 2 THEN ARRAY[7009 + (pattern_variant % 3), 7012]
      WHEN 3 THEN ARRAY[7005 + (pattern_variant % 5)]
      WHEN 4 THEN ARRAY[7009 + (pattern_variant % 3)]
      WHEN 5 THEN ARRAY[7004 + (pattern_variant % 6)]
      WHEN 6 THEN ARRAY[7009 + (pattern_variant % 3), 7012]
      WHEN 7 THEN ARRAY[7009 + (pattern_variant % 3)]
      WHEN 8 THEN ARRAY[7010 + (pattern_variant % 2)]
      WHEN 9 THEN ARRAY[7009, 7010, 7011, 7012]
      WHEN 10 THEN ARRAY[7006 + (pattern_variant % 6)]
      ELSE ARRAY[]::integer[]
    END;
    status_value := CASE
      WHEN completion_requirements_met THEN 'COMPLETED'
      WHEN user_index % 60 = 0 THEN 'INVITED'
      WHEN user_index % 45 = 0 THEN 'APPLIED'
      WHEN user_index % 37 = 0 THEN 'CANCELLED'
      ELSE 'CONFIRMED'
    END;

    INSERT INTO public."User" (id, "firstName", "lastName", email, picture, "externalProfile", "newsletterRegistration", "anonymousId", created_at, updated_at, "matriculationNumber", status, "integerId", "organizationId", occupation, "zipCode", country)
    VALUES (
      generated_user_id,
      generated_first_name,
      generated_last_name,
      lower(
        regexp_replace(
          generated_first_name || '.' || generated_last_name || '.ml' || user_index,
          '[^a-zA-Z0-9._-]',
          '',
          'g'
        ) || '@example.com'
      ),
      NULL,
      CASE WHEN user_index % 3 = 0 THEN 'https://www.linkedin.com' WHEN user_index % 3 = 1 THEN 'https://www.github.com' ELSE 'https://www.xing.com' END,
      user_index % 2 = 0,
      'ml-degree-' || user_index,
      '2025-11-13 11:00:00+00'::timestamptz + (user_index * interval '1 minute'),
      '2026-04-20 05:00:00+00'::timestamptz + (user_index * interval '1 second'),
      (200000 + user_index)::text,
      'ACTIVE',
      10000 + user_index,
      NULL,
      CASE WHEN user_index % 5 = 0 THEN 'EMPLOYED_PART_TIME' ELSE 'UNIVERSITY_STUDENT' END,
      NULL,
      NULL
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate")
    VALUES (
      700000 + (user_index * 10000),
      degree_id,
      generated_user_id,
      status_value,
      'I want to complete the Machine Learning Degree and document my learning path.',
      'UNRATED',
      CASE
        WHEN status_value = 'COMPLETED' AND completion_requirements_met
          THEN generated_user_id || '/' || degree_id || '/achievement_certificate.pdf'
        ELSE NULL
      END,
      NULL,
      '2025-11-13 11:00:00+00'::timestamptz + (user_index * interval '1 minute'),
      '2026-04-20 05:00:00+00'::timestamptz + (user_index * interval '1 second'),
      CASE WHEN status_value = 'INVITED' THEN '2026-05-01'::date ELSE NULL END
    )
    ON CONFLICT (id) DO NOTHING;

    FOREACH course_id IN ARRAY passed_courses LOOP
      INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate")
      VALUES (
        701000 + (user_index * 10000) + course_id - 7000,
        course_id,
        generated_user_id,
        'COMPLETED',
        'Seeded passed course for degree performance checks.',
        'UNRATED',
        generated_user_id || '/' || course_id || '/achievement_certificate.pdf',
        generated_user_id || '/' || course_id || '/attendance_certificate.pdf',
        '2024-09-04 13:00:00+00'::timestamptz + ((course_id - 7000) * interval '10 days'),
        '2025-11-13 11:20:00+00'::timestamptz + (user_index * interval '1 second'),
        NULL
      )
      ON CONFLICT (id) DO NOTHING;
    END LOOP;

    FOREACH course_id IN ARRAY enrolled_courses LOOP
      IF NOT course_id = ANY(passed_courses) THEN
        INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate")
        VALUES (
          702000 + (user_index * 10000) + course_id - 7000,
          course_id,
          generated_user_id,
          'CONFIRMED',
          'Seeded current enrollment for degree performance checks.',
          'UNRATED',
          NULL,
          NULL,
          '2026-04-20 05:00:00+00'::timestamptz + (user_index * interval '1 second'),
          '2026-04-20 05:00:00+00'::timestamptz + (user_index * interval '1 second'),
          NULL
        )
        ON CONFLICT (id) DO NOTHING;
      END IF;
    END LOOP;

    FOR event_index IN 1..attended_event_count LOOP
      event_position := (
        (
          (user_index - 1)
          + pattern_variant
          + ((event_index - 1) * 2)
        ) % array_length(event_course_ids, 1)
      ) + 1;
      course_id := event_course_ids[event_position];

      INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", "achievementCertificateURL", "attendanceCertificateURL", created_at, updated_at, "invitationExpirationDate")
      VALUES (
        703000 + (user_index * 10000) + event_index,
        course_id,
        generated_user_id,
        'COMPLETED',
        'Seeded attended event for degree performance checks.',
        'UNRATED',
        NULL,
        generated_user_id || '/' || course_id || '/attendance_certificate.pdf',
        '2025-11-13 11:26:00+00'::timestamptz + (event_position * interval '1 minute'),
        '2025-11-13 11:26:00+00'::timestamptz + (user_index * interval '1 second'),
        NULL
      )
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, "recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount")
      VALUES (
        700000 + (user_index * 10) + event_index,
        71000 + event_position,
        generated_user_id,
        'ATTENDED',
        '2025-11-13 11:26:00+00'::timestamptz + (user_index * interval '1 second'),
        '2025-11-13 11:26:00+00'::timestamptz + (user_index * interval '1 second'),
        lower(
        regexp_replace(
          generated_first_name || '.' || generated_last_name || '.ml' || user_index,
          '[^a-zA-Z0-9._-]',
          '',
          'g'
        ) || '@example.com'
      ),
        'INSTRUCTOR',
        '2025-10-01 10:00:00+00'::timestamptz + ((event_position - 1) * interval '30 days'),
        '2025-10-01 18:00:00+00'::timestamptz + ((event_position - 1) * interval '30 days'),
        28800,
        0
      )
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- =============================================================================
-- Dev fixtures for the legacy achievement -> project data migration
-- (migration 1780045613786_migrate_achievements_to_projects).
--
-- Exercises every mapping branch:
--   - DOCUMENTATION option with a documentation template + mentor + records
--     (proposer falls back to the mentor; instruction picked up via the
--      legacyAchievementDocumentationTemplateId index)
--   - Unpublished DOCUMENTATION option with a record (still migrated)
--   - Extra ONLINE_COURSE record on an existing option (multi-record per option)
--   - Multi-author record (two ProjectAuthors emitted)
--   - PASSED rating carried over to Project.rating, UNRATED record kept as-is
-- After running the seeds, re-execute the data steps of the migration's up.sql
-- to convert the seeded legacy rows into Project rows.
-- =============================================================================
INSERT INTO public."AchievementDocumentationTemplate" (id, title, url, created_at, updated_at)
VALUES (1, 'Dev documentation template', 'https://example.com/documentation_template.pdf',
        '2024-01-15 10:00:00+00', '2024-01-15 10:00:00+00');

INSERT INTO public."AchievementOption" (id, title, description, "recordType", "evaluationScriptUrl", created_at, updated_at, published, "achievementDocumentationTemplateId") VALUES
  (5, 'documentation project alpha',
   'A practical documentation project for testing the DOCUMENTATION -> CLASSIC_PROJECT mapping.',
   'DOCUMENTATION', NULL, '2024-02-01 09:00:00+00', '2024-02-01 09:00:00+00', true, 1),
  (6, 'documentation project beta (unpublished)',
   'Unpublished documentation project; should still be migrated as a PROPOSED template.',
   'DOCUMENTATION', NULL, '2024-02-01 09:00:00+00', '2024-02-01 09:00:00+00', false, NULL);

INSERT INTO public."AchievementOptionCourse" (id, "achievementOptionId", "courseId", created_at, updated_at) VALUES
  (8,  5, 1, '2024-02-01 09:00:00+00', '2024-02-01 09:00:00+00'),
  (9,  5, 4, '2024-02-01 09:00:00+00', '2024-02-01 09:00:00+00'),
  (10, 6, 1, '2024-02-01 09:00:00+00', '2024-02-01 09:00:00+00');

-- Mentor on the documentation option exercises the proposer fallback to mentors.
INSERT INTO public."AchievementOptionMentor" (id, "achievementOptionId", "userId", created_at, updated_at) VALUES
  (1, 5, 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   '2024-02-01 09:00:00+00', '2024-02-01 09:00:00+00');

-- Records: documentation (passed + multi-author + unrated) and an extra online-course submission.
INSERT INTO public."AchievementRecord" (id, "coverImageUrl", description, rating, score, "achievementOptionId", "documentationUrl", "csvResults", "evaluationScriptUrl", created_at, updated_at, "uploadUserId", "courseId") VALUES
  (8, NULL, 'A passed documentation submission with two authors.',
   'PASSED', NULL, 5, 'achievementrecordid_8/documentation/doc.pdf', NULL, NULL,
   '2024-03-15 12:00:00+00', '2024-03-15 12:00:00+00',
   '11111111-1111-1111-1111-111111111111', 1),
  (9, NULL, 'Unrated documentation submission for the unpublished option.',
   'UNRATED', NULL, 6, 'achievementrecordid_9/documentation/doc.pdf', NULL, NULL,
   '2024-03-15 14:00:00+00', '2024-03-15 14:00:00+00',
   '33333333-3333-3333-3333-333333333333', 1),
  (10, NULL, 'Passed online-course completion submission.',
   'PASSED', NULL, 1, 'achievementrecordid_10/documentation/doc.pdf', NULL, NULL,
   '2024-03-16 09:00:00+00', '2024-03-16 09:00:00+00',
   '44444444-4444-4444-4444-444444444444', 1);

INSERT INTO public."AchievementRecordAuthor" (id, "achievementRecordId", "userId", created_at, updated_at) VALUES
  (2, 8,  '11111111-1111-1111-1111-111111111111', '2024-03-15 12:00:00+00', '2024-03-15 12:00:00+00'),
  (3, 8,  '22222222-2222-2222-2222-222222222222', '2024-03-15 12:00:00+00', '2024-03-15 12:00:00+00'),
  (4, 9,  '33333333-3333-3333-3333-333333333333', '2024-03-15 14:00:00+00', '2024-03-15 14:00:00+00'),
  (5, 10, '44444444-4444-4444-4444-444444444444', '2024-03-16 09:00:00+00', '2024-03-16 09:00:00+00');

-- =============================================================================
-- Degree certificate template fixture
--
-- Mirrors the manually-inserted production row used for the DEGREES program.
-- Each degree course (Program 'Degrees', shortTitle = 'DEGREES') points its
-- Course.achievementCertificateTemplateId at this template.
-- =============================================================================
INSERT INTO public."CertificateTemplate" (id, name, html, created_at, updated_at) VALUES
  (3, 'degree certificate example', E'<html><head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8"> <title>Document Title</title> <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400&display=swap" rel="stylesheet"> <style type="text/css"> @page { size: a4 landscape; background-image: url("{{ template }}"); background-position: center center; background-size: cover; @frame content_frame { left: 85mm; width: 195mm; top: 60mm; height: 140mm; } } body, html { font-family: \'Lato\', sans-serif !important; margin: 0; padding: 0; width: 297mm; height: 210mm; } .big { font-size: 7mm; font-weight: bold; color: #777; } .small { font-size: 4.2mm; color: #777; } p { margin-top: 3mm; margin-bottom: 3mm; } </style> </head> <body> <span class="big">{{ full_name }}</span> <p class="small"> has met the degree''s minimum requirements of completing 12.5 ECTS and participating in at least one hackathon by successfully completing the following degree components: </p> <p class="small"> {% for participation in successful_participations %} // {{ participation }}<br> {% endfor %} </p> </body> </html>',
   '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00');

-- Wire the degree template to every degree course (identified by program shortTitle).
UPDATE public."Course" c SET "achievementCertificateTemplateId" = 3
  FROM public."Program" p
 WHERE p.id = c."programId"
   AND p."shortTitle" = 'DEGREES'
   AND c."achievementCertificatePossible" = true;

-- Default achievement template for every project type (mirrors the migration's data step).
UPDATE public."ProjectType" SET "certificateTemplateId" = 1
 WHERE value IN (
   'CLASSIC_PROJECT', 'ONLINE_COURSE', 'PROJECT_WITH_LINK',
   'PROJECT_WITH_PRESENTATION', 'PROJECT_WITH_LINK_AND_PRESENTATION',
   'PRESENTATION_WITHOUT_DOCUMENTATION', 'PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION'
 );

-- =============================================================================
-- Project storage-backed download fixture
--
-- Exercises local Docker Compose file downloads that are stored as public bucket
-- object keys instead of absolute URLs. The matching PDF lives in
-- backend/init.d/file_storage/project-docs-instructions/public/.
-- In local dev this should resolve to:
-- http://localhost:4001/emulated-bucket/project-docs-instructions/public/...
-- =============================================================================
INSERT INTO public."ProjectDocumentationInstruction"
  (id, title, url, "projectTypeValue", "isDefault", created_at, updated_at)
VALUES
  (9901, 'Dev storage-backed documentation instruction',
   'project-docs-instructions/public/PROJECT_DOCUMENTATION_INSTRUCTION.pdf',
   'CLASSIC_PROJECT', false,
   '2026-06-05 00:00:00+00', '2026-06-05 00:00:00+00');

INSERT INTO public."Project"
  (id, title, tagline, description, "coverImageUrl", "documentationUrl",
   "presentationUrl", "externalUrl", status, type, rating,
   "documentationInstructionId", "proposedByUserId", "acceptingParticipants",
   created_at, updated_at)
VALUES
  (9901, 'Storage-backed instruction fixture',
   'Shows an instruction PDF stored as a public bucket key.',
   'This project intentionally has no uploaded documentation yet, so the '
   || 'next-todo panel keeps rendering the documentation-instruction link.',
   NULL, NULL, NULL, NULL, 'ONGOING', 'CLASSIC_PROJECT', 'UNRATED',
   9901, '8914bee9-0549-44af-bcae-cafeec5ba92e', false,
   '2026-06-05 00:00:00+00', '2026-06-05 00:00:00+00'),
  (9902, 'Storage-backed resource fixture',
   'Shows project files stored as public bucket keys.',
   'This completed project exposes documentation and presentation download '
   || 'buttons from storage object keys.',
   NULL,
   'project-docs-instructions/public/PROJECT_DOCUMENTATION_INSTRUCTION.pdf',
   'project-docs-instructions/public/PROJECT_DOCUMENTATION_INSTRUCTION.pdf',
   'https://example.com/project-resource-fixture',
   'COMPLETED', 'CLASSIC_PROJECT', 'PASSED',
   9901, '22222222-2222-2222-2222-222222222222', false,
   '2026-06-05 00:00:00+00', '2026-06-05 00:00:00+00');

INSERT INTO public."ProjectCourse"
  (id, "projectId", "courseId", created_at, updated_at)
VALUES
  (9901, 9901, 4, '2026-06-05 00:00:00+00', '2026-06-05 00:00:00+00'),
  (9902, 9902, 4, '2026-06-05 00:00:00+00', '2026-06-05 00:00:00+00');

INSERT INTO public."ProjectAuthor"
  (id, "projectId", "userId", "participationStatus", created_at, updated_at)
VALUES
  (9901, 9901, '8914bee9-0549-44af-bcae-cafeec5ba92e', 'ACCEPTED',
   '2026-06-05 00:00:00+00', '2026-06-05 00:00:00+00'),
  (9902, 9902, '22222222-2222-2222-2222-222222222222', 'ACCEPTED',
   '2026-06-05 00:00:00+00', '2026-06-05 00:00:00+00');

SELECT pg_catalog.setval('public."AchievementDocumentationTemplate_id_seq"', 1, true);
SELECT pg_catalog.setval('public."AchievementOptionCourse_id_seq"', 10, true);
SELECT pg_catalog.setval('public."AchievementOptionMentor_id_seq"', 1, true);
SELECT pg_catalog.setval('public."AchievementOption_id_seq"', 6, true);
SELECT pg_catalog.setval('public."AchievementRecordAuthor_id_seq"', 5, true);
SELECT pg_catalog.setval('public."AchievementRecord_id_seq"', 10, true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."CertificateTemplate"', 'id'), (SELECT max(id) FROM public."CertificateTemplate"), true);
SELECT pg_catalog.setval('public."Attendence_Id_seq"', 64, true);
SELECT pg_catalog.setval('public."CourseAddress_id_seq"', 9, true);
SELECT pg_catalog.setval('public."CourseDegree_id_seq"', 6, true);
SELECT pg_catalog.setval('public."CourseFundingOrganization_id_seq"', 3, true);
SELECT pg_catalog.setval('public."CourseGroup_id_seq"', 15, true);
SELECT pg_catalog.setval('public."CourseInstructor_Id_seq"', 1, true);
SELECT pg_catalog.setval('public."CourseLocation_id_seq"', 9, true);
SELECT pg_catalog.setval('public."Course_Id_seq"', 9, true);
SELECT pg_catalog.setval('public."Date_Id_seq"', 96, true);
SELECT pg_catalog.setval('public."Enrollment_Id_seq"', 1, false);
SELECT pg_catalog.setval('public."LocationAddress_id_seq"', 1, false);
SELECT pg_catalog.setval('public."Mail_Id_seq"', 27, true);
SELECT pg_catalog.setval('public."OrganizationAdmin_id_seq"', 3, true);
SELECT pg_catalog.setval('public."Organization_id_seq"', 500, true);
SELECT pg_catalog.setval('public."Semester_Id_seq"', 7, true);
SELECT pg_catalog.setval('public."SessionAddress_id_seq"', 12, true);
SELECT pg_catalog.setval('public."SessionSpeaker_id_seq"', 1, false);
SELECT pg_catalog.setval('public."User_Id_seq"', 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."Attendance"', 'id'), (SELECT max(id) FROM public."Attendance"), true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."Course"', 'id'), (SELECT max(id) FROM public."Course"), true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."CourseDegree"', 'id'), (SELECT max(id) FROM public."CourseDegree"), true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."CourseEnrollment"', 'id'), (SELECT max(id) FROM public."CourseEnrollment"), true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."Project"', 'id'), (SELECT max(id) FROM public."Project"), true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."ProjectAuthor"', 'id'), (SELECT max(id) FROM public."ProjectAuthor"), true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."ProjectCourse"', 'id'), (SELECT max(id) FROM public."ProjectCourse"), true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."ProjectDocumentationInstruction"', 'id'), (SELECT max(id) FROM public."ProjectDocumentationInstruction"), true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."Session"', 'id'), (SELECT max(id) FROM public."Session"), true);
