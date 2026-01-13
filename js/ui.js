// js/ui.js

class UI {
    constructor() {
        this.statusElement = document.getElementById('status-message');
        this.appModeBadge = document.getElementById('app-mode');
        this.tabs = document.querySelectorAll('.nav-tab');
        this.sections = document.querySelectorAll('section[id$="-section"]');
        
        this.bindTabs();
    }

    setMode(mode) {
        if (mode === 'guest') {
            this.appModeBadge.textContent = 'Guest Mode (Ephemeral)';
            this.appModeBadge.classList.add('mode-guest');
            this.appModeBadge.dataset.tooltip = 'Private keys are stored in RAM only and will be wiped instantly when you close this tab.';
        } else {
            this.appModeBadge.textContent = 'Master Mode (Persisted)';
            this.appModeBadge.classList.add('mode-master');
            this.appModeBadge.dataset.tooltip = 'Private keys are encrypted and securely stored on this device.';
        }
    }

    bindTabs() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.target;
                
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                this.sections.forEach(sec => {
                    if (sec.id === targetId) {
                        sec.classList.remove('hidden');
                    } else {
                        sec.classList.add('hidden');
                    }
                });
            });
        });
    }

    showStatus(message, type = 'info') {
        if (!this.statusElement) return;
        
        this.statusElement.textContent = message;
        this.statusElement.className = '';
        this.statusElement.classList.add('visible');
        
        if (type === 'error') {
            this.statusElement.style.backgroundColor = 'rgba(255, 59, 48, 0.95)';
        } else {
             this.statusElement.style.backgroundColor = 'rgba(30, 30, 30, 0.95)';
        }

        if (this.statusTimeout) clearTimeout(this.statusTimeout);
        this.statusTimeout = setTimeout(() => {
            this.statusElement.classList.remove('visible');
        }, 3000);
    }
    
    renderKeyList(keys, containerId, onDelete) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        if (keys.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--secondary-color);">No keys found.</p>';
            return;
        }
        
        keys.forEach(key => {
            const div = document.createElement('div');
            div.className = 'key-item';
            div.style.padding = '1rem 0';
            div.style.borderBottom = '1px solid var(--border-color)';
            
            const header = document.createElement('div');
            header.style.marginBottom = '0.75rem';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';

            const nameSpan = document.createElement('span');
            nameSpan.style.fontWeight = '600';
            nameSpan.style.fontSize = '1.05rem';
            nameSpan.textContent = key.name || 'Unnamed Key';

            const dateSpan = document.createElement('span');
            dateSpan.style.fontSize = '0.8rem';
            dateSpan.style.color = 'var(--secondary-color)';
            try {
                const date = new Date(parseInt(key.id));
                if (!isNaN(date.getTime())) {
                    dateSpan.textContent = date.toLocaleDateString();
                }
            } catch(e) {}
            
            header.appendChild(nameSpan);
            header.appendChild(dateSpan);
            div.appendChild(header);

            const textarea = document.createElement('textarea');
            textarea.readOnly = true;
            textarea.rows = 3;
            textarea.value = key.publicKey;
            textarea.style.marginBottom = '0.5rem';
            textarea.style.fontSize = '0.8rem';
            div.appendChild(textarea);

            const btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = '10px';

            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy Public';
            copyBtn.className = 'secondary';
            copyBtn.style.marginBottom = '0';
            copyBtn.style.padding = '0.6rem';
            copyBtn.style.flex = '1';
            copyBtn.style.color = '#fff'; 
            copyBtn.style.backgroundColor = 'var(--primary-color)';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(key.publicKey).then(() => {
                    this.showStatus('Public Key copied to clipboard');
                });
            };
            
            const exportBtn = document.createElement('button');
            exportBtn.textContent = 'Export Secret';
            exportBtn.className = 'secondary';
            exportBtn.style.marginBottom = '0';
            exportBtn.style.padding = '0.6rem';
            exportBtn.style.flex = '1';
            exportBtn.style.color = '#fff'; 
            exportBtn.style.backgroundColor = '#f59f00';
            exportBtn.onclick = () => {
                if(confirm('WARNING: You are about to export your PRIVATE key.\n\nAnyone with this file and your passphrase can impersonate you.\n\nDo you want to download the key file?')) {
                     try {
                         const blob = new Blob([key.privateKey], { type: 'text/plain' });
                         const url = URL.createObjectURL(blob);
                         const a = document.createElement('a');
                         a.href = url;
                         const safeName = (key.name || 'key').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                         a.download = `${safeName}_secret.txt`;
                         document.body.appendChild(a);
                         a.click();
                         document.body.removeChild(a);
                         URL.revokeObjectURL(url);
                         this.showStatus('Private key downloaded.');
                     } catch (e) {
                         console.error(e);
                         this.showStatus('Export failed: ' + e.message, 'error');
                     }
                }
            };
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'secondary';
            deleteBtn.style.marginBottom = '0';
            deleteBtn.style.padding = '0.6rem';
            deleteBtn.style.flex = '1';
            deleteBtn.style.color = '#fff';
            deleteBtn.style.backgroundColor = 'var(--error-color)';
            deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="vertical-align: middle;">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>`;
            deleteBtn.onclick = () => {
                if(confirm(`Are you sure you want to PERMANENTLY delete the key "${key.name}"?\n\nThis cannot be undone.`)) {
                     if (onDelete) onDelete(key.id);
                }
            };

            btnRow.appendChild(copyBtn);
            btnRow.appendChild(exportBtn);
            btnRow.appendChild(deleteBtn);
            div.appendChild(btnRow);

            container.appendChild(div);
        });
    }

    updateKeySelect(keys) {
        const select = document.getElementById('decrypt-key-select');
        if (!select) return;
        
        const currentVal = select.value;

        select.innerHTML = '';
        if (keys.length === 0) {
            const option = document.createElement('option');
            option.text = 'No Private Keys found';
            option.disabled = true;
            option.selected = true;
            select.appendChild(option);
            return;
        }

        keys.forEach(key => {
            const option = document.createElement('option');
            option.value = key.id;
            option.text = key.name || 'Unnamed Key';
            select.appendChild(option);
        });

        if (currentVal && keys.find(k => k.id === currentVal)) {
            select.value = currentVal;
        } else if (keys.length > 0) {
            select.value = keys[0].id;
        }
    }
}
