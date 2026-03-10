import { Injectable } from '@nestjs/common';

/**
 * HashingProvider is an abstract class that defines the contract for hashing and comparing data.
 *
 */
@Injectable()
export abstract class HashingProvider {
	abstract hash(data: string | Buffer): Promise<string>;

	abstract compare(data: string | Buffer, encrypted: string): Promise<boolean>;
}
