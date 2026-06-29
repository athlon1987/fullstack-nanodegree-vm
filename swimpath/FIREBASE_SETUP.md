# Enabling cloud sync & sharing (Firebase)

SwimPath works offline with no setup. To **sync and share one swimmer between
two people**, connect a free Firebase project. ~5 minutes, one time.

## 1. Create a Firebase project
1. Go to <https://console.firebase.google.com> and sign in with a Google account.
2. **Add project** → name it (e.g. "SwimPath") → you can disable Google Analytics → **Create**.

## 2. Add a Web app and copy the config
1. In the project, click the **`</>`** (Web) icon to "Add an app to get started".
2. Give it a nickname → **Register app**.
3. You'll see a `firebaseConfig = { ... }` snippet. Copy the values for
   `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`,
   `appId` into `swimpath/js/firebase-config.js`.
   - These are **not secrets** — safe to commit. Access is controlled in steps 3–4.

## 3. Turn on Anonymous sign-in
1. Left menu → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → **Anonymous** → enable → **Save**.

## 4. Create Firestore and set the rules
1. Left menu → **Build → Firestore Database** → **Create database**.
2. Start in **production mode** → pick a location → **Enable**.
3. Open the **Rules** tab, replace the contents with the rules below, **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /teams/{code} {
      allow read, write: if request.auth != null;
    }
  }
}
```

These rules require a signed-in (anonymous is fine) user, and access is by the
**unguessable team code** in the document path — so only people you send the
invite link to can reach your data.

## 5. Use it
Reload the app → **Profile → Cloud sync & sharing → Create shared team** →
**Copy invite link** → send it to the other person. They open the link and are
instantly on the same swimmer, syncing live.

## Notes & limits
- **Anyone with the invite link can view and edit.** Treat it like a password.
- Sync is **last-write-wins**; if both edit the very same field at the same
  second, the later save wins. Fine for two casual users.
- Free Spark tier is far more than enough for a couple of swimmers.
- To stop sharing on a device: **Profile → Leave team**. To rotate access,
  create a new team and re-share (old code keeps working until you delete that
  document in the Firestore console).
