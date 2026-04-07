import type { StudentOrderStrategy } from './types.js';
import { defaultStrategy } from './strategies/default.js';

const registry = new Map<string, StudentOrderStrategy>();
registry.set('default', defaultStrategy);

function getStrategy(id: string): StudentOrderStrategy {
	const strategy = registry.get(id);
	if (strategy === undefined) {
		throw new Error(`Unknown student order strategy: "${id}"`);
	}
	return strategy;
}

function registerStrategy(id: string, strategy: StudentOrderStrategy): void {
	registry.set(id, strategy);
}

export { registry, getStrategy, registerStrategy };
