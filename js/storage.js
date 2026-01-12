// js/storage.js

class StorageManager {
    constructor() {
        this.mode = this.detectMode();
        this.dbName = 'susurro-vault';
        this.storeName = 'keys';
        this.dbPromise = null;
    }

    detectMode() {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        return isStandalone ? 'master' : 'guest';
    }

    async init() {
        if (this.mode === 'master') {
            this.dbPromise = idb.openDB(this.dbName, 1, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains('keys')) {
                        db.createObjectStore('keys', { keyPath: 'id' });
                    }
                },
            });
            console.log('Storage initialized in MASTER mode (IndexedDB)');
        } else {
            console.log('Storage initialized in GUEST mode (SessionStorage/RAM)');
        }
    }

    /**
     * Save data.
     * @param {string} id
     * @param {object} data
     */
    async save(id, data) {
        if (this.mode === 'master') {
            const db = await this.dbPromise;
            await db.put(this.storeName, { id, ...data });
        } else {
            sessionStorage.setItem(id, JSON.stringify(data));
        }
    }

    /**
     * Load data.
     * @param {string} id
     */
    async load(id) {
        if (this.mode === 'master') {
            const db = await this.dbPromise;
            return await db.get(this.storeName, id);
        } else {
            const item = sessionStorage.getItem(id);
            return item ? JSON.parse(item) : null;
        }
    }

    /**
     * List all keys
     */
    async listKeys() {
        if (this.mode === 'master') {
            const db = await this.dbPromise;
            return await db.getAll(this.storeName);
        } else {
            const keys = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                try {
                   keys.push(JSON.parse(sessionStorage.getItem(key)));
                } catch(e) { /* ignore non-json items */ }
            }
            return keys;
        }
    }

    async clear() {
        if (this.mode === 'master') {
             const db = await this.dbPromise;
             await db.clear(this.storeName);
        } else {
            sessionStorage.clear();
        }
    }

    async delete(id) {
        if (this.mode === 'master') {
            const db = await this.dbPromise;
            await db.delete(this.storeName, id);
        } else {
            sessionStorage.removeItem(id);
        }
    }
}
