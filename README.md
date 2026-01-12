<img src="assets/icons/icon-1024x1024.png" width="512" alt="susurroPGP icon">

# susurroPGP

**susurro** is an progressive Web App (PWA) for PGP encryption. it operates entirely client-side to ensure your private keys and messages never leave your device.

## Features

### Dual Storage Modes
susurroPGP adapts to how you access it:
1.  **Guest Mode (Ephemeral)**: When accessed as a standard web page, keys are stored in `SessionStorage`. Closing the tab wipes everything.
2.  **Master Mode (Persistent)**: When installed as a PWA, keys are stored securely in `IndexedDB`. Your identity persists between sessions.

### Key Management
- **Generate Keys**: Create strong ECC PGP keys instantly.
- **Import/Export**: detailed control over your keychain.
  - Import existing private keys.
  - Export public keys for sharing.
  - Backup private keys as `.txt` files.
- **Safety First**: "Trash" functionality to remove keys, and "Wipe" for app wide reset.

### One-Click Encryption & Decryption
- **Encrypt**: Paste a message, select a recipient public key, and generate a PGP block.
- **Decrypt**: Paste an encrypted message, select your private key, enter your passphrase, and read.

### PWA Capable
- Installable on iOS, Android, macOS, and Windows.
- Works fully **offline** thanks to Service Worker caching.

## Security Disclaimer

This software is provided "as is", without warranty of any kind. While it uses the industry-standard OpenPGP.js library, end-user security also depends on the safety of the device and browser used. 

**Always back up your private keys.** If you clear your browser data while in "Master Mode", your keys will be lost unless you have exported them.