# Konfiguration av Environment Variables

För att Google Workspace-synken ska fungera, se till att din `.env.local` ser ut så här:

```env
# ... dina andra nycklar ...

# Från din nedladdade JSON-fil:
FIREBASE_CLIENT_EMAIL="din-client-email@project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_ADMIN_EMAIL="din-email@hejare.se"
```

*   `FIREBASE_CLIENT_EMAIL`: Motsvarar `client_email` i JSON-filen.
*   `FIREBASE_PRIVATE_KEY`: Motsvarar `private_key` i JSON-filen.
*   `GOOGLE_ADMIN_EMAIL`: Din egen e-postadress (som är admin i Workspace).
