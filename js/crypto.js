// js/crypto.js

class CryptoModule {
    constructor() {
        if (typeof openpgp === 'undefined') {
            console.error('OpenPGP.js not loaded');
        }
    }

    async generateKey(name, passphrase) {
        const { privateKey, publicKey } = await openpgp.generateKey({
            type: 'ecc',
            curve: 'curve25519',
            userIDs: [{ name: name }],
            passphrase
        });
        return { privateKey, publicKey };
    }

    async importKey(armoredKey, passphrase) {
        try {
            const privateKey = await openpgp.readPrivateKey({ armoredKey });
            
            if (passphrase) {
                await openpgp.decryptKey({ privateKey, passphrase });
            }

            return {
                privateKey: armoredKey,
                publicKey: privateKey.toPublic().armor()
            };
        } catch (e) {
            throw new Error('Key import failed: ' + e.message);
        }
    }

    async encrypt(text, publicKeys, privateKey = null, passphrase = null) {
        
        const parsedPublicKeys = await Promise.all(
            [].concat(publicKeys).map(k => openpgp.readKey({ armoredKey: k }))
        );

        let parsedPrivateKey;
        if (privateKey) {
            parsedPrivateKey = await openpgp.readPrivateKey({ armoredKey: privateKey });
            if (passphrase) {
                parsedPrivateKey = await openpgp.decryptKey({ privateKey: parsedPrivateKey, passphrase });
            }
        }

        const message = await openpgp.createMessage({ text });
        
        const encrypted = await openpgp.encrypt({
            message,
            encryptionKeys: parsedPublicKeys,
            signingKeys: parsedPrivateKey
        });

        return encrypted;
    }

    async decrypt(encryptedMessage, privateKey, passphrase) {
        let parsedPrivateKey = await openpgp.readPrivateKey({ armoredKey: privateKey });
    
        parsedPrivateKey = await openpgp.decryptKey({ privateKey: parsedPrivateKey, passphrase });

        const message = await openpgp.readMessage({ armoredMessage: encryptedMessage });
        
        const { data: decrypted, signatures } = await openpgp.decrypt({
            message,
            decryptionKeys: parsedPrivateKey
        });

        let verificationStatus = 'No signature';
        if (signatures && signatures.length > 0) {
            try {
                await signatures[0].verified;
                verificationStatus = 'Signature verified: ' + signatures[0].keyID.toHex();
            } catch (e) {
                verificationStatus = 'Signature invalid';
            }
        }

        return { decrypted, verificationStatus };
    }
}
