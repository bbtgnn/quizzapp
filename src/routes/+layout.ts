export const ssr = false;
export const prerender = true;

import { browser } from '$app/environment';
import { NOTICE_STORAGE_KEY, shouldShowUpgradeNotice } from './layout-upgrade-notice';

export function load() {
	const storage = browser ? window.localStorage : null;
	const showUpgradeNotice = shouldShowUpgradeNotice(storage);

	if (showUpgradeNotice) {
		storage?.setItem(NOTICE_STORAGE_KEY, '1');
	}

	return { showUpgradeNotice };
}
