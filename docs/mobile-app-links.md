# Mobile app links

The public association files live under `public/.well-known/` and authorize only
the `/payment-return?checkout=...` hosted-payment return URL.

The Apple association is complete for Team ID `R4HRZ34ZYE` and the production,
development, and staging bundle identifiers.

The Android project does not contain production signing certificates. Before
deploying app links, replace each `REPLACE_WITH_*_RELEASE_SHA256_FINGERPRINT`
value in `public/.well-known/assetlinks.json` with the colon-separated SHA-256
fingerprint of the certificate that signs that flavor. For Play App Signing, use
the app-signing certificate shown in Play Console, not the upload certificate.

Do not publish the placeholder fingerprints: Android will reject them and open
the payment return in the browser instead of the app.
