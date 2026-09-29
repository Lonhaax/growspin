"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withUserLock = withUserLock;
class Mutex {
    _locked = false;
    _waiting = [];
    async lock() {
        if (!this._locked) {
            this._locked = true;
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this._waiting.push(resolve);
        });
    }
    unlock() {
        if (this._waiting.length > 0) {
            const next = this._waiting.shift();
            next?.();
        }
        else {
            this._locked = false;
        }
    }
}
const userLocks = new Map();
/**
 * Wraps an async function with a Mutex lock specific to a given userId.
 * This ensures that concurrent requests for the same user execute sequentially,
 * completely neutralizing race conditions that could lead to duplicated balances or exploits.
 */
async function withUserLock(userId, fn) {
    if (!userLocks.has(userId)) {
        userLocks.set(userId, new Mutex());
    }
    const mutex = userLocks.get(userId);
    await mutex.lock();
    try {
        return await fn();
    }
    finally {
        mutex.unlock();
        // Cleanup if idle to avoid memory leaks
        if (mutex['_waiting'].length === 0 && !mutex['_locked']) {
            userLocks.delete(userId);
        }
    }
}
