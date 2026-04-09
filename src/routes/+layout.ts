export const ssr = false;
export const prerender = true;

import { browser } from '$app/environment';

export const SCHEMA_MAJOR_VERSION = 3;
export const NOTICE_STORAGE_KEY = 'quizzapp-upgrade-notice-v3-seen';

type StorageReader = Pick<Storage, 'getItem'>;

export function shouldShowUpgradeNotice(storage: StorageReader | null): boolean {
	if (!storage) return false;
	return storage.getItem(NOTICE_STORAGE_KEY) === null;
}

export function load() {
	const storage = browser ? window.localStorage : null;
	const showUpgradeNotice = shouldShowUpgradeNotice(storage);

	if (showUpgradeNotice) {
		storage?.setItem(NOTICE_STORAGE_KEY, '1');
	}

	return { showUpgradeNotice };
}
