# Matrix invites before a user's first login

Research question: can EduHub's Matrix bot invite `@<matrix_user_handle>:opencampus.sh`
into a course room **before** that account exists on the homeserver, and will
the invite be waiting after the user's first login through MAS/Keycloak?

Versions examined (source read at these tags, nothing contacted on the live server):

- Synapse **v1.164.1** (`element-hq/synapse`, commit `167b7ea3`)
- MAS **v1.28.0** (`element-hq/matrix-authentication-service`, commit `05745b27`)
- Matrix spec **v1.19** (`matrix-org/matrix-spec`, commit `b9c3d5ed`). `spec.matrix.org`
  was not reachable from the research environment, so spec claims cite the spec's
  source files at tag `v1.19`. The matching rendered sections are named alongside.

Link prefixes used below:

- `S` = `https://github.com/element-hq/synapse/blob/v1.164.1/`
- `M` = `https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/`
- `P` = `https://github.com/matrix-org/matrix-spec/blob/v1.19/`

## Answer

**Yes.** Synapse 1.164.1 accepts a client-server invite to an unregistered local
user ID. It runs no user-existence check anywhere on that path, so it persists
the `m.room.member` invite event and records it in `local_current_membership`
under the MXID string. MAS later provisions the user through
`POST /_synapse/mas/provision_user`, which only inserts the account and does not
touch room memberships. The user's first `/sync` reads `local_current_membership`
by user ID, so the pending invite appears in `rooms.invite`.

**Confidence: high** for the Synapse behaviour, which comes straight from the
source. It is **conditional** on one thing source cannot settle: MAS must actually
give the user the localpart from `matrix_user_handle`. That depends on the live
`claims_imports.localpart` settings (`action`, `on_conflict`), which I have not
seen. One live test settles all of it (see [Open questions](#open-questions)).

## Findings

### 1. The invite path for an unregistered local target

**The REST layer does no existence check.** `RoomMembershipRestServlet._do`
parses `user_id` with `UserID.from_string` and calls `update_membership`
directly
([S synapse/rest/client/room.py#L1406-L1431](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/rest/client/room.py#L1406-L1431)).
`from_string` only splits the string. It does not look the user up.

**`update_membership` does no existence check either.** It applies invite rate
limits and the shadow-ban check, then calls `update_membership_locked`
([S synapse/handlers/room_member.py#L637-L656](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/room_member.py#L637-L656);
the limiters are at [#L379-L394](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/room_member.py#L379-L394)).

**`update_membership_locked` checks the following for an invite, and none of
these checks need the target to exist:**

- **Suspension:** it reads the target's suspension status with
  `get_user_suspended_status`
  ([room_member.py#L771-L805](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/room_member.py#L771-L805)).
  That query uses `allow_none=True` and returns `bool(res)`, so a missing user
  reads as "not suspended"
  ([S synapse/storage/databases/main/registration.py#L1393-L1411](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/storage/databases/main/registration.py#L1393-L1411)).
  Target suspension blocks only JOIN and KNOCK, never INVITE.
- **Profile data:** `include_profile_data_on_invite` defaults to `true`
  ([S synapse/config/server.py#L588-L589](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/config/server.py#L588-L589),
  [room_member.py#L113-L118](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/room_member.py#L113-L118)),
  so Synapse tries to copy the target's display name and avatar into the event.
  For a missing user, `get_profile_displayname` raises a 404
  ([S synapse/storage/databases/main/profile.py#L229-L244](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/storage/databases/main/profile.py#L229-L244)).
  The call is wrapped in `except Exception`, which only logs "Failed to get
  profile information"
  ([room_member.py#L850-L867](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/room_member.py#L850-L867)).
  The invite simply carries no displayname.
- **Invite-specific gates**
  ([room_member.py#L887-L944](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/room_member.py#L887-L944)):
  - Inviting the server-notices MXID is refused. This does not apply to us.
  - If the requester is **not** a server admin:
    - `block_non_admin_invites` returns 403 `M_FORBIDDEN`.
    - The spam-checker `user_may_invite` module callback can return 403 with its
      own errcode.
    - The target's invite-permission config (MSC4155/MSC4380) can return 403
      `M_INVITE_BLOCKED`.
  - Server admins skip all three gates.
  - For a user who doesn't exist, the invite-permission config lookup finds no
    account data and returns `AllowAllInviteRulesConfig()`
    ([S synapse/storage/databases/main/account_data.py#L568-L590](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/storage/databases/main/account_data.py#L568-L590)).
    So this check passes even for a non-admin requester.
- **Membership-state checks on the room's current state** (ban,
  duplicate-invite short circuit) are at
  [room_member.py#L994-L1044](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/room_member.py#L994-L1044).
  The method then falls through to `_local_membership_update`, which builds and
  persists the event
  ([#L1210-L1225](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/room_member.py#L1210-L1225)).
- **Other existence checks:** a grep for `get_user_by_id` and similar across
  `room_member.py`, `message.py` and `event_auth.py` finds only one hit. It is
  the consent check on the **requester**, not the target
  ([S synapse/handlers/message.py#L854-L870](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/message.py#L854-L870)).

**Event authorization doesn't consider registration.** The spec's invite auth
rule requires all of these:

- the sender is joined;
- the target is not `join` or `ban`;
- the sender's power level is at least the invite level.

It says nothing about whether the target account exists
([P content/rooms/v12.md#L148-L172](https://github.com/matrix-org/matrix-spec/blob/v1.19/content/rooms/v12.md#L148-L172),
rendered at "Room Version 12 → Authorisation rules"). The bot is joined with
PL 100 and the invite level is 0, so this rule passes.

**The spec doesn't list "unknown user" as an error.** The endpoint documents 400
for bad JSON and an unsupported room version. It documents 403 for these cases:

- the invitee is banned or already a member;
- the inviter is not in the room or lacks power;
- `M_INVITE_BLOCKED` (since v1.18).

A missing invitee account is not among them
([P data/api/client-server/inviting.yaml#L21-L125](https://github.com/matrix-org/matrix-spec/blob/v1.19/data/api/client-server/inviting.yaml#L21-L125),
rendered at "Client-Server API → `POST /_matrix/client/v3/rooms/{roomId}/invite`").

**Admin status, and why it matters little here.** With MAS delegation Synapse
uses `MasDelegatedAuth`
([S synapse/server.py#L751-L754](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/server.py#L751-L754)).
In it, `is_server_admin` is true **only** when the token carries the scope
`urn:synapse:admin:*`
([S synapse/api/auth/mas.py#L269-L270](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/api/auth/mas.py#L269-L270)).
The `users.admin` flag doesn't count. The runbook issues the bot token with
`--yes-i-want-to-grant-synapse-admin-privileges`, so the bot skips
`block_non_admin_invites`, `user_may_invite` and the invite-permission rules.
Even without admin scope, an unregistered target can't be blocked by its own
invite-permission rules, which are allow-all as shown above. Only
`block_non_admin_invites` or a spam-checker module could then refuse the invite.

**Config flags named in the question:**

- `limit_profile_requests_to_users_who_share_rooms` and
  `require_auth_for_profile_requests` are read only by the profile REST servlet
  and `ProfileHandler.check_profile_query_allowed`
  ([S synapse/rest/client/profile.py#L66-L75](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/rest/client/profile.py#L66-L75),
  [S synapse/handlers/profile.py#L1011-L1035](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/profile.py#L1011-L1035)).
  The invite path calls `ProfileHandler.get_displayname` and `get_avatar_url`
  directly and never calls that check, so these flags don't affect invites.
- The user directory is not consulted on this path.
- One hook still runs for every event, admin or not: a third-party event-rules
  module (`check_event_allowed`)
  ([S synapse/handlers/message.py#L1435](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/message.py#L1435)).
  It matters only if such a module is installed. I can't see `homeserver.yaml`'s
  `modules:` list, so I haven't verified that.

**Result:** the invite returns `200 {}` and is stored. It would be rejected only
by:

- rate limiting (429; the EduHub code retries these);
- the bot not being joined (403);
- a ban on the target (403);
- a non-admin token combined with `block_non_admin_invites` or a spam-checker
  module (403);
- a third-party-rules module.

### 2. Does the invite survive account creation and appear in the first `/sync`?

**How MAS creates the Synapse user.** MAS's default `matrix.kind` is `synapse`
([M crates/config/src/sections/matrix.rs#L29-L48](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/config/src/sections/matrix.rs#L29-L48)).
That kind maps to the "modern" `SynapseConnection`
([M crates/cli/src/util.rs#L532-L539](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/cli/src/util.rs#L532-L539)),
which provisions users with `POST /_synapse/mas/provision_user`
([M crates/matrix-synapse/src/modern.rs#L128-L179](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/matrix-synapse/src/modern.rs#L128-L179)).
It does not use the legacy `/_synapse/admin/v2/users` API.

On interactive registration (including registration through an upstream
provider), the finish step does two things:

1. It links the upstream identity to the new user.
2. It **schedules** a `ProvisionUserJob` on the MAS job queue instead of calling
   Synapse inline
   ([M crates/handlers/src/views/register/steps/finish.rs#L345-L370](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/handlers/src/views/register/steps/finish.rs#L345-L370)).

The job then calls `provision_user`
([M crates/tasks/src/matrix.rs#L35-L75](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/tasks/src/matrix.rs#L35-L75)).

**What Synapse does on `provision_user`.** If `get_user_by_id` returns nothing,
it calls `registration_handler.register_user(localpart=..., by_admin=True)`
([S synapse/rest/synapse/mas/users.py#L144-L163](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/rest/synapse/mas/users.py#L144-L163)).
`register_user` then:

- runs `check_username` (character set, non-empty, no leading `_`, ≤ 255
  characters, not taken, not reserved by an appservice)
  ([S synapse/handlers/register.py#L159-L226](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/register.py#L159-L226));
- inserts the user and profile;
- runs auto-join
  ([#L307-L401](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/register.py#L307-L401)).

Nothing in `register.py`, `storage/databases/main/registration.py` or
`rest/synapse/mas/` touches `local_current_membership` or `room_memberships`.
A grep for both table names in those files finds nothing. **Account creation
neither deletes nor rewrites a pre-existing invite.** The "username taken" check
looks only at the `users` table (`get_users_by_id_case_insensitive`). A pending
invite does not make the localpart unavailable, so MAS's availability check
(`/_synapse/mas/is_localpart_available` → `check_username`,
[S synapse/rest/synapse/mas/users.py#L258-L268](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/rest/synapse/mas/users.py#L258-L268))
still passes.

**Where the invite is stored.** When the invite event is persisted, Synapse
writes the current membership of every local user (`is_mine_id(state_key)`, a
check on the server name only) into `local_current_membership`
([S synapse/storage/databases/main/events.py#L2067-L2101](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/storage/databases/main/events.py#L2067-L2101)).
It also writes it into the sliding-sync membership snapshots for local users
([#L643-L660](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/storage/databases/main/events.py#L643-L660)).
Neither write depends on a `users` row.

**How the first sync finds it.** On an initial `/sync`,
`_get_room_changes_for_initial_sync` calls
`get_rooms_for_local_user_where_membership_is(user_id, Membership.LIST)`
([S synapse/handlers/sync.py#L3320-L3355](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/sync.py#L3320-L3355)).
That function selects from `local_current_membership` joined to `events` and
`rooms`, with no join to `users`
([S synapse/storage/databases/main/roommember.py#L545-L565](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/storage/databases/main/roommember.py#L545-L565)).
Invites go to `invited` unless one of these holds:

- the sender is in the user's `m.ignored_user_list`;
- the user's invite-permission config says `IGNORE`.

A brand-new account has neither.

**Caching.** The per-user cache `_get_rooms_for_local_user_where_membership_is_inner`
is invalidated for the target whenever a member event is persisted
([S synapse/storage/databases/main/cache.py#L463](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/storage/databases/main/cache.py#L463)).
A stale empty entry from before the invite can't survive the invite.

**Related effect, not an invite risk:** the first login can briefly fail.
Provisioning runs as an asynchronous job, while Synapse's MAS auth returns
`500 "User not found"` for a valid token whose user has no Synapse row yet
([S synapse/api/auth/mas.py#L353-L359](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/api/auth/mas.py#L353-L359)).
Until the job runs, Element's very first requests can therefore fail. This is a
timing effect on login, and the stored invite is unaffected.

**Re-invite after creation.** If the trigger fires again after the account
exists, the new invite carries a displayname, so its content differs from the
stored invite. Synapse therefore writes a fresh invite event instead of
short-circuiting as a duplicate
([room_member.py#L1014-L1025](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/room_member.py#L1014-L1025)).
The auth rules allow invite → invite. This is harmless.

### 3. Does `auto_join_rooms` run for MAS-provisioned users?

Yes. `provision_user` goes through `register_user`, and `register_user` calls
`_auto_join_rooms(user_id)` unless `user_consent_at_registration` is set (or the
new user is a guest)
([S synapse/handlers/register.py#L384-L401](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/register.py#L384-L401),
[#L615-L643](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/register.py#L615-L643)).
`_join_rooms` handles both cases: if the server is in the room it invites the
user first via `auto_join_user_id` when needed, and otherwise it joins directly
([#L525-L560](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/register.py#L525-L560)).
Auto-join therefore happens at provisioning time, server side, in the same
lifecycle point where a pending invite simply sits in `local_current_membership`.

### 4. Alternatives and their preconditions

**Synapse Admin API `POST /_synapse/admin/v1/join/{roomIdOrAlias}`**
([S synapse/rest/admin/rooms.py#L558-L636](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/rest/admin/rooms.py#L558-L636)):

- requires an admin requester (`assert_user_is_admin`);
- requires a local target;
- **requires the user to exist.** If `admin_handler.get_user(target)` returns
  `None`, the call raises `NotFoundError("User not found")`, which is
  404 `M_NOT_FOUND`
  ([#L589-L590](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/rest/admin/rooms.py#L589-L590);
  [S synapse/handlers/admin.py#L103-L106](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/admin.py#L103-L106)).

For non-public rooms it sends an invite first, then a join as the user. It is
therefore **not** usable before first login. It suits only a post-login
reconciliation, which would force-join the user rather than leave an invite.

**Pre-provisioning through MAS.** Two ways to create the account in advance:

- **MAS Admin API `POST /api/admin/v1/users`**
  ([M crates/handlers/src/admin/v1/users/add.rs#L92-L180](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/handlers/src/admin/v1/users/add.rs#L92-L180)):
  - validates the username (`[a-z0-9=_\-./+]`, non-empty, ≤ 255 characters, no
    leading `_`);
  - checks the localpart is available on the homeserver;
  - creates the MAS user;
  - calls `provision_user` **synchronously**.

  The Synapse account exists when the call returns, and auto-join runs then.
- **`mas-cli manage register-user <name> --upstream-provider-mapping <PROVIDER_ULID>:<SUBJECT>`**
  ([M crates/cli/src/commands/manage.rs#L171-L218](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/cli/src/commands/manage.rs#L171-L218),
  [#L1114-L1167](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/cli/src/commands/manage.rs#L1114-L1167)):
  creates the user and the upstream link in one step, then schedules a
  `ProvisionUserJob`, which is asynchronous.

**What pre-provisioning implies for the first real Keycloak login:**

- **With a link to the Keycloak `sub`:**
  - mas-cli: `-m <provider>:<sub>`.
  - Admin API: `POST /api/admin/v1/upstream-oauth-links` with
    `user_id`, `provider_id` and `subject`
    ([M crates/handlers/src/admin/v1/upstream_oauth_links/add.rs#L58-L72](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/handlers/src/admin/v1/upstream_oauth_links/add.rs#L58-L72)).

  The callback finds the link by `(provider, subject)`
  ([M crates/handlers/src/upstream_oauth2/callback.rs#L445-L474](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/handlers/src/upstream_oauth2/callback.rs#L445-L474)).
  The link handler takes the `(None, Some(user_id))` branch and logs the user
  straight into the existing account
  ([M crates/handlers/src/upstream_oauth2/link.rs#L282](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/handlers/src/upstream_oauth2/link.rs#L282),
  [#L334](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/handlers/src/upstream_oauth2/link.rs#L334)).
  EduHub would need the provider ULID and each user's Keycloak `sub`. It has the
  `sub`: the Keycloak user ID is the EduHub user ID.
- **Without a link:** the unlinked Keycloak identity reaches the localpart
  logic. Because the localpart now belongs to an existing MAS user, the outcome
  depends on configuration:
  - `claims_imports.localpart.action` is `suggest`: MAS **ignores** the handle
    and lets the user pick another username, so the invite would be orphaned
    ([M link.rs#L461-L512](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/handlers/src/upstream_oauth2/link.rs#L461-L512)).
  - `action` is `force` or `require`: `on_conflict` decides.
    - `fail` (the default) shows a "User exists" error.
    - `add`, `replace` or `set` attach the link to the existing user
      ([M link.rs#L514-L640](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/handlers/src/upstream_oauth2/link.rs#L514-L640);
      enum and default at
      [M crates/config/src/sections/upstream_oauth2.rs#L229-L244](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/config/src/sections/upstream_oauth2.rs#L229-L244);
      config validation requiring `force`/`require` for these values at
      [#L140-L152](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/config/src/sections/upstream_oauth2.rs#L140-L152)).

  Pre-provisioning without a link therefore only works with `on_conflict` set to
  `add` or `set`. That also lets *any* upstream identity whose claim maps to that
  localpart take over the account, which is a security trade-off to weigh.

Because the plain invite already works (sub-question 1), neither alternative is
needed for persistence.

### 5. Localparts like `firstname.lastname.abc123` and `..abc123`

EduHub builds handles as `${sanitize(first)}.${sanitize(last)}.${uuid[0:6]}`.
`sanitize` keeps `[a-z0-9._-]`. `firstName || 'user'` replaces only a
null or empty name, so a name made only of non-Latin characters becomes `""`
(`functions/callNodeFunction/lib/matrixHandle.js`, duplicated identically in
`functions/updateFromKeycloak/index.js`).

| Validator | Rule | `ada.lovelace.7c9e66` | `..7c9e66` |
|-----------|------|-----------------------|------------|
| Spec user-ID grammar | non-empty, only `a-z 0-9 . _ = - / +`, full ID ≤ 255 bytes ([P content/appendices.md#L557-L583](https://github.com/matrix-org/matrix-spec/blob/v1.19/content/appendices.md#L557-L583), "Appendices → User Identifiers"). No rule on leading or repeated dots. | valid | valid |
| Synapse `check_username` | allowed set `_-./=+a-z0-9` ([S synapse/types/\_\_init\_\_.py#L547-L571](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/types/__init__.py#L547-L571)), non-empty, no leading `_` unless `allow_underscore_prefixed_localpart`, ≤ 255, not purely numeric ([S register.py#L159-L226](https://github.com/element-hq/synapse/blob/v1.164.1/synapse/handlers/register.py#L159-L226)) | valid | valid |
| MAS default policy | non-empty, mxid ≤ 255, not all-numeric, `^[a-z0-9.=_/+-]+$`, plus optional banned/allowed lists ([M policies/register/register.rego#L32-L66](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/policies/register/register.rego#L32-L66)) | valid | valid |
| MAS homeserver check | non-ASCII → unavailable; otherwise asks Synapse `check_username` ([M crates/matrix-synapse/src/modern.rs#L204-L235](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/matrix-synapse/src/modern.rs#L204-L235)) | valid | valid |

Edge cases the sanitiser can still produce:

- **A leading `_`** (a first name that sanitises to start with `_`, for example
  `"_x"` or `"李_"`). Synapse rejects it with `M_INVALID_USERNAME`, so MAS
  treats the localpart as unavailable. The invite is still accepted, because the
  invite path does no localpart validation. It would be stranded, since no
  account can ever get that ID.
- **Very long names.** The full MXID must be ≤ 255 characters, and the
  `@`, `:opencampus.sh` and the 6-character UUID prefix use 22 of those.
- **Case.** Not an issue: the handle is lowercased.

What happens to an unavailable localpart at login depends on `action`
(`suggest` → silently ignored, `force`/`require` → error page;
[M link.rs#L700-L790](https://github.com/element-hq/matrix-authentication-service/blob/v1.28.0/crates/handlers/src/upstream_oauth2/link.rs#L700-L790)).

## Implications for EduHub

**`inviteConfirmedUserToMatrixRoom` is fine as is** for users who haven't logged
in yet. A `200` from the invite endpoint means a durable invite that the user
will see on first login. No retry-on-first-login, Admin-API join or
pre-provisioning is needed for that purpose. Specifically:

- The Admin join API would make things worse here: it returns 404 for users who
  don't exist yet.
- Pre-provisioning adds coupling (provider ULID, links, conflict policy) and
  solves a problem that doesn't exist.
- `ensureBotJoinedMatrixRoom` + invite with 429/503 backoff covers the realistic
  failure modes on the Synapse side.

Things worth guarding against, all small:

1. **The MXID must be the one MAS actually assigns.** If MAS is configured with
   `claims_imports.localpart.action: suggest`, a user can end up with a
   different localpart (they edit it on the confirmation page, or MAS ignores it
   because policy or availability rejects it). The invite then sits on an MXID
   nobody owns. Confirm the live MAS config uses `force` (or `require`), and
   ideally `skip_confirmation: true`.
2. **Reject handles that can never register before inviting.** Optionally have
   `toMatrixUserId` (or `computeMatrixHandle`) treat a localpart that starts
   with `_`, or an MXID longer than 255 characters, as unusable, and log it. A
   degenerate `..abc123` is valid and needs no special case.
3. **Failures that do occur** (bot not in room, 403 from a module, timeout) are
   returned as `success: false`. Whether Hasura retries depends on the HTTP
   status `callNodeFunction` returns for that result. I didn't verify this here,
   and it is outside this question.

## Open questions

Only a live test can settle these:

1. **The MAS localpart config:** `claims_imports.localpart.action`,
   `on_conflict` and `skip_confirmation` in `/opt/element-oc-mas/config.yaml`.
   Check with
   `grep -n -A8 'localpart' /opt/element-oc-mas/config.yaml`.
2. **Whether `homeserver.yaml` loads any `modules:`** (spam checker or
   third-party rules), and the values of `block_non_admin_invites` and
   `user_consent`. Check with
   `grep -nE 'modules:|block_non_admin_invites|user_consent|include_profile_data_on_invite' /opt/element-oc/homeserver.yaml`.
3. **An end-to-end confirmation.** Use a disposable Keycloak test user and a test
   room the bot is in. Run steps 3–5 from a trusted shell with the bot token
   loaded; don't paste it anywhere.

   ```bash
   HS=https://matrix.opencampus.sh
   T="$MATRIX_ADMIN_ACCESS_TOKEN"          # bot token, from the secret store
   ROOM='!<testroom>:opencampus.sh'
   MXID='@<matrix_user_handle of test user>:opencampus.sh'
   ENC_ROOM=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1],safe=""))' "$ROOM")
   ENC_MXID=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1],safe=""))' "$MXID")

   # 0. Bot token has admin scope (expect 200; 403 M_FORBIDDEN means no admin scope)
   curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $T" \
     "$HS/_synapse/admin/v2/users?limit=1&guests=false"

   # 1. Target does not exist yet (expect 404 M_NOT_FOUND)
   curl -s -H "Authorization: Bearer $T" "$HS/_synapse/admin/v2/users/$ENC_MXID"

   # 2. Invite the not-yet-existing user (expect 200 {})
   curl -s -X POST -H "Authorization: Bearer $T" -H 'Content-Type: application/json' \
     -d "{\"user_id\":\"$MXID\"}" "$HS/_matrix/client/v3/rooms/$ENC_ROOM/invite"

   # 3. Invite is in room state (expect {"membership":"invite"} with no displayname)
   curl -s -H "Authorization: Bearer $T" \
     "$HS/_matrix/client/v3/rooms/$ENC_ROOM/state/m.room.member/$ENC_MXID"

   # 4. Admin-join for a missing user fails as predicted (expect 404 "User not found")
   #    Only run this against the same test MXID BEFORE the first login.
   curl -s -X POST -H "Authorization: Bearer $T" -H 'Content-Type: application/json' \
     -d "{\"user_id\":\"$MXID\"}" "$HS/_synapse/admin/v1/join/$ENC_ROOM"
   ```

   5. Log in to Element as the test user through Keycloak, for the first time.
      Expected:
      - The account is created with exactly `$MXID`. Check with step 1 again,
        which should now return 200.
      - The test room appears under invites.
      - The `auto_join_rooms` rooms are already joined.

      If Element shows a username picker during login, MAS is not in `force`
      mode. That is open question 1.
   6. Clean up: deactivate the test user in MAS
      (`mas-cli --config /config/config.yaml manage lock-user <username> --deactivate`),
      or remove it through the MAS Admin API.
