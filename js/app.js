// js/app.js

document.addEventListener('DOMContentLoaded', async () => {
    const storagePrompt = new StorageManager();
    await storagePrompt.init();
    
    const crypto = new CryptoModule();
    const ui = new UI();

    ui.setMode(storagePrompt.mode);

    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker registered', reg);
        } catch (e) {
            console.error('Service Worker registration failed', e);
        }
    }

    document.getElementById('btn-generate').addEventListener('click', async () => {
        const name = document.getElementById('gen-name').value;
        const passphrase = document.getElementById('gen-passphrase').value;

        if (!name || !passphrase) {
            ui.showStatus('Please fill all fields');
            return;
        }

        const existingKeys = await storagePrompt.listKeys();
        if (existingKeys.some(k => k.name === name)) {
            ui.showStatus(`Error: A key with the label "${name}" already exists.`);
            return;
        }

        ui.showStatus('Generating keys... This may take a moment.');
        
        try {
            const keys = await crypto.generateKey(name, passphrase);
            
            const id = Date.now().toString(); 
            
            await storagePrompt.save(id, {
                id,
                name,
                privateKey: keys.privateKey,
                publicKey: keys.publicKey
            });

            ui.showStatus('Key generated and saved!');
            loadKeys();
        } catch (e) {
            console.error(e);
            ui.showStatus('Error generating key: ' + e.message);
        }
    });

    document.getElementById('btn-import').addEventListener('click', async () => {
        const armoredKey = document.getElementById('import-key').value;
        const name = document.getElementById('import-name').value;
        const passphrase = document.getElementById('import-passphrase').value;

        if (!armoredKey || !name) {
            ui.showStatus('Private Key and Label are required.', 'error');
            return;
        }

        const existingKeys = await storagePrompt.listKeys();
        if (existingKeys.some(k => k.name === name)) {
            ui.showStatus(`Error: A key with the label "${name}" already exists.`, 'error');
            return;
        }

        ui.showStatus('Importing key...');

        try {
            const keys = await crypto.importKey(armoredKey, passphrase);
            
            const id = Date.now().toString();

            await storagePrompt.save(id, {
                id,
                name,
                privateKey: keys.privateKey,
                publicKey: keys.publicKey
            });

            ui.showStatus('Key imported successfully!');
            
            document.getElementById('import-key').value = '';
            document.getElementById('import-name').value = '';
            document.getElementById('import-passphrase').value = '';

            loadKeys();
        } catch (e) {
            console.error(e);
            ui.showStatus(e.message, 'error');
        }
    });

    document.getElementById('btn-refresh-keys').addEventListener('click', loadKeys);

    async function loadKeys() {
        const keys = await storagePrompt.listKeys();
        ui.renderKeyList(keys, 'key-list', async (id) => {
             try {
                await storagePrompt.delete(id);
                ui.showStatus('Key deleted.');
                loadKeys();
             } catch(e) {
                 ui.showStatus('Error deleting key: ' + e.message, 'error');
             }
        });
        ui.updateKeySelect(keys);
        
        const countEl = document.getElementById('storage-count');
        if (countEl) {
            countEl.textContent = `${keys.length} Key${keys.length !== 1 ? 's' : ''}`;
        }
        return keys;
    }

    document.getElementById('btn-encrypt').addEventListener('click', async () => {
        const text = document.getElementById('message-input').value;
        const pubKeyInput = document.getElementById('recipient-key').value;

        if (!text || !pubKeyInput) {
            ui.showStatus('Message and Recipient Public Key required for encryption.', 'error');
            return;
        }

        try {
            const result = await crypto.encrypt(text, pubKeyInput);
            document.getElementById('output-area').textContent = result;
             ui.showStatus('Encryption successful!');
        } catch (e) {
            ui.showStatus('Encryption failed: ' + e.message, 'error');
        }
    });

    document.getElementById('btn-decrypt').addEventListener('click', async () => {
        const encryptedMsg = document.getElementById('message-input').value;
        const keyId = document.getElementById('decrypt-key-select').value;
        
        if (!encryptedMsg) {
             ui.showStatus('Please enter a PGP message to decrypt.', 'error');
             return;
        }

        if (!keyId) {
             ui.showStatus('Please select a private key.', 'error');
            return;
        }

        const keys = await storagePrompt.listKeys();
        const selectedKey = keys.find(k => k.id === keyId);

        if (!selectedKey) {
            ui.showStatus('Key not found in storage.', 'error');
            return;
        }

        const passphrase = prompt(`Enter passphrase for key "${selectedKey.name}":`);
        if (!passphrase) return;

        try {
            const result = await crypto.decrypt(encryptedMsg, selectedKey.privateKey, passphrase);
            
            let output = `[${result.verificationStatus}]\n\n${result.decrypted}`;
            document.getElementById('output-area').textContent = output;
            ui.showStatus('Decryption successful!');
        } catch (e) {
            ui.showStatus('Decryption failed. Wrong passphrase? ' + e.message, 'error');
        }
    });

    document.getElementById('btn-copy').addEventListener('click', () => {
        const content = document.getElementById('output-area').textContent;
        navigator.clipboard.writeText(content).then(() => {
            ui.showStatus('Copied to clipboard');
        });
    });

    document.getElementById('btn-wipe').addEventListener('click', async () => {
        if(confirm('Are you sure you want to wipe all data?')) {
            await storagePrompt.clear();
            loadKeys();
            clearFields();
            ui.showStatus('Data wiped.');
        }
    });

    function clearFields() {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => input.value = '');
        
        const output = document.getElementById('output-area');
        if(output) output.textContent = '';
    }

    clearFields();
    loadKeys();
});
