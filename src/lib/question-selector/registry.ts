import type { QuestionSelectionStrategy } from './types.js';
import { defaultStrategy } from './strategies/default.js';

const registry = new Map<string, QuestionSelectionStrategy>();
registry.set('default', defaultStrategy);

function getStrategy(id: string): QuestionSelectionStrategy {
	const strategy = registry.get(id);
	if (strategy === undefined) {
		throw new Error(`Unknown question selection strategy: "${id}"`);
	}
	return strategy;
}

function registerStrategy(id: string, strategy: QuestionSelectionStrategy): void {
	registry.set(id, strategy);
}

export { registry, getStrategy, registerStrategy };
