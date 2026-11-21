# Google Play Upload Keystore Setup

This guide creates the Android **upload keystore** for AnesthAssist (`online.anesthassist.app`) and adds the signing values to GitHub Actions. Google Play App Signing keeps the actual app-signing key; this keystore only proves that a release bundle came from the maintainer.

> The keystore and its passwords are signing secrets. Never commit them, attach them to an issue, or send them through chat or email.

## 1. Prerequisites

- A JDK with `keytool` on `PATH` (JDK 17 is recommended).
- Access to the GitHub repository's **Settings → Secrets and variables → Actions** page.
- Access to the app in Google Play Console.

Check `keytool` first:

```bash
keytool -help
```

## 2. Generate the keystore

The scripts write `anesthassist-upload-keystore.jks` to the **current directory** and refuse to overwrite an existing file.

Run them from a private directory outside this repository, for example:

**Windows PowerShell**

```powershell
New-Item -ItemType Directory -Force "$HOME\secure\anesthassist" | Out-Null
Set-Location "$HOME\secure\anesthassist"
C:\path\to\anesth-helper\scripts\generate-keystore.ps1
```

**Linux / macOS**

```bash
mkdir -p ~/secure/anesthassist
cd ~/secure/anesthassist
/path/to/anesth-helper/scripts/generate-keystore.sh
```

Running directly from the repository root also works because `.gitignore` excludes `*.jks` and `*.keystore`, but a private directory is safer.

You will be prompted for:

- **Keystore password** — choose a long, unique password.
- **Key password** — press Enter to reuse the keystore password, or choose another strong password.

The alias is fixed to `anesthassist`, and the certificate is valid for 10,000 days.

Verify the result:

```bash
keytool -list -v \
  -keystore anesthassist-upload-keystore.jks \
  -alias anesthassist
```

Record the certificate's SHA-256 fingerprint in your password manager alongside the passwords.

## 3. Store the keystore safely

Keep at least two encrypted backups in separate locations, for example:

- A password-manager attachment or encrypted vault.
- An encrypted offline backup.

Do not store an unprotected copy in a synced folder, public cloud drive, Git repository, or CI artifact.

The repository's root `.gitignore` contains:

```gitignore
# Android keystores & signing secrets
*.jks
*.keystore
```

Confirm that Git is ignoring the file and that no keystore has already been tracked:

```bash
git check-ignore -v anesthassist-upload-keystore.jks
git ls-files '*.jks' '*.keystore'
```

The second command must print nothing.

## 4. Add GitHub Actions secrets

In the repository, open **Settings → Secrets and variables → Actions → New repository secret** and add these four secrets:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | One-line Base64 encoding of the `.jks` file |
| `ANDROID_KEY_ALIAS` | `anesthassist` |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password |
| `ANDROID_KEY_PASSWORD` | The key password |

Base64 is only an encoding, not encryption. Never print it in logs or commit it.

**Windows PowerShell**

```powershell
$bytes = [IO.File]::ReadAllBytes("C:\path\to\anesthassist-upload-keystore.jks")
[Convert]::ToBase64String($bytes) | Set-Clipboard
```

Paste the clipboard value into `ANDROID_KEYSTORE_BASE64`.

**Linux / macOS**

```bash
base64 < anesthassist-upload-keystore.jks | tr -d '\n'
```

Copy the output, which must contain no line breaks.

Optionally use the GitHub CLI. The password prompts keep secrets out of shell history:

```bash
base64 < anesthassist-upload-keystore.jks | tr -d '\n' \
  | gh secret set ANDROID_KEYSTORE_BASE64
gh secret set ANDROID_KEY_ALIAS --body anesthassist
gh secret set ANDROID_KEYSTORE_PASSWORD
gh secret set ANDROID_KEY_PASSWORD
```

Verify the secret names (values stay hidden):

```bash
gh secret list
```

Repository secrets are not available to pull requests from forks.

## 5. Enable Play App Signing

In Google Play Console:

1. Open the AnesthAssist app.
2. Go to **Test and release → App integrity** (wording varies slightly by console version).
3. Confirm **Play App Signing** is enabled.

When the first signed `.aab` is uploaded, Google registers the upload certificate. Google holds the app-signing key and re-signs the delivered APKs.

## 6. If the upload key is lost or compromised

- **Lost but not exposed:** request an upload key reset in Play Console under **App integrity → Upload key certificate**. Generate a new keystore, then replace the four GitHub secrets.
- **Exposed or compromised:** request an upload key reset immediately, generate a new keystore, update the secrets, and review repository and CI access logs.

An upload key reset does not change the app-signing key or require a new Play listing.

## Troubleshooting

| Problem | Fix |
|---|---|
| `keytool: command not found` | Install a JDK and add its `bin` directory to `PATH`, then reopen the terminal. |
| `Keystore already exists... Skipping` | The script will not overwrite a key. Back up or move the existing `.jks` only if you intentionally want to create a replacement. |
| Base64 secret rejected or corrupted | Re-encode and remove all line breaks. Confirm the file itself is intact with `keytool -list`. |
| Play Console rejects the bundle | Confirm the upload uses alias `anesthassist`, the same keystore registered with Play, and the matching passwords. |
