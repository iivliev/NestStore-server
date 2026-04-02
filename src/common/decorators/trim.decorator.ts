import { Transform } from 'class-transformer';

export function Trim() {
	return Transform(({ value }): string => (typeof value === 'string' ? value.trim() : value));
}
