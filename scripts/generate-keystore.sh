#!/usr/bin/env bash
set -euo pipefail

KEYSTORE_PATH="anesthassist-upload-keystore.jks"
ALIAS="anesthassist"

if [[ -f "$KEYSTORE_PATH" ]]; then
    echo "Warning: Keystore already exists at $KEYSTORE_PATH. Skipping generation to prevent accidental overwriting." >&2
    exit 0
fi

if ! command -v keytool >/dev/null 2>&1; then
    echo "Error: keytool was not found. Install a JDK and add its bin directory to PATH." >&2
    exit 1
fi

echo "=== Generating Android Upload Keystore for AnesthAssist ==="
echo "You will be prompted to choose a secure keystore password."

keytool -genkey -v -keystore "$KEYSTORE_PATH" -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Dr. Mohamed Abdelwahab, OU=Clinical, O=AnesthAssist, L=Cairo, ST=Cairo, C=EG"

if [[ ! -f "$KEYSTORE_PATH" ]]; then
    echo "Error: Keystore generation failed; $KEYSTORE_PATH was not created." >&2
    exit 1
fi

echo
echo "Keystore generated successfully at: $KEYSTORE_PATH"
echo "To create the Base64-encoded string for GitHub Secrets (ANDROID_KEYSTORE_BASE64):"
echo "base64 < \"$KEYSTORE_PATH\" | tr -d '\\n'"
