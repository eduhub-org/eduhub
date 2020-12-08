# Overview

| Docker        | Image                           | Ports                             |
| :------------ | :------------------------------ | :-------------------------------- |
| Next.js       |  edu-plattform-mvp_frontend     | 0.0.0.0:25000->3000/tcp           |
| Hasura        |  hasura/graphql-engine:v1.3.3   | 0.0.0.0:8080->8080/tcp            |
| Keycloak      |  jboss/keycloak                 | 8443/tcp, 0.0.0.0:28080->8080/tcp |
| Posgres DB    |  postgres:12                    | 5432/tcp                          |

