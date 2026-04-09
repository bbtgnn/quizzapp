import { describe, expect, it } from 'vitest';
import { NOTICE_STORAGE_KEY, shouldShowUpgradeNotice } from './layout-upgrade-notice';

describe('shouldShowUpgradeNotice', () => {
	it('returns true when marker is missing', () => {
		const fakeStorage = {
			getItem: () => null
		};

		expect(shouldShowUpgradeNotice(fakeStorage)).toBe(true);
	});

	it('returns false when marker exists', () => {
		const fakeStorage = {
			getItem: (key: string) => (key === NOTICE_STORAGE_KEY ? '1' : null)
		};

		expect(shouldShowUpgradeNotice(fakeStorage)).toBe(false);
	});

	it('returns false when storage is unavailable', () => {
		expect(shouldShowUpgradeNotice(null)).toBe(false);
	});
});
