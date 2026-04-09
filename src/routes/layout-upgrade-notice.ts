export const SCHEMA_MAJOR_VERSION = 3;
export const NOTICE_STORAGE_KEY = `quizzapp-upgrade-notice-v${SCHEMA_MAJOR_VERSION}-seen`;

type StorageReader = Pick<Storage, 'getItem'>;

export function shouldShowUpgradeNotice(storage: StorageReader | null): boolean {
	if (!storage) return false;
	return storage.getItem(NOTICE_STORAGE_KEY) === null;
}
