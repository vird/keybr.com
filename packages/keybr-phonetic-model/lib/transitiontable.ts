import { DataError, Reader, Writer } from "@keybr/binary";
import { type CodePoint } from "@keybr/unicode";
import { Letter } from "./letter.ts";

const signature = Object.freeze<number[]>([
  0x6b, 0x65, 0x79, 0x62, 0x72, 0x2e, 0x63, 0x6f, 0x6d,
]);
const empty = Object.freeze<Suffix[]>([]);

export type Suffix = {
  readonly codePoint: CodePoint;
  readonly frequency: number;
};

export type Segment = readonly Suffix[];

export class TransitionTableBuilder {
  private readonly chain: Chain;
  private readonly data: Uint8Array;

  constructor(order: number, alphabet: readonly CodePoint[]) {
    this.chain = new Chain(order, alphabet);
    this.data = new Uint8Array(this.chain.entries);
  }

  get(chain: readonly CodePoint[]): number {
    return this.data[this.chain.entryIndex(chain)];
  }

  set(chain: readonly CodePoint[], frequency: number): void {
    if (!Number.isInteger(frequency) || frequency < 0 || frequency > 255) {
      throw new Error();
    }
    this.data[this.chain.entryIndex(chain)] = frequency;
  }

  build(): TransitionTable {
    return new TransitionTable(
      this.chain,
      buildSegments(this.chain, this.data),
    );
  }
}

export class TransitionTable {
  static load(buffer: Uint8Array): TransitionTable {
    const reader = new Reader(buffer);
    for (const c of signature) {
      if (reader.getUint8() !== c) {
        throw new DataError();
      }
    }
    const chain = readChain(reader);
    const segments = readSegments(reader, chain);
    if (reader.remaining() > 0) {
      throw new DataError();
    }
    return new TransitionTable(chain, segments);
  }

  readonly chain: Chain;
  readonly segments: readonly Segment[];

  constructor(chain: Chain, segments: readonly Segment[]) {
    if (segments.length !== chain.segments) {
      throw new Error();
    }
    this.chain = chain;
    this.segments = segments;
  }

  get order(): number {
    return this.chain.order;
  }

  get alphabet(): readonly CodePoint[] {
    return this.chain.alphabet;
  }

  get size(): number {
    return this.chain.size;
  }

  suffixes(chain: readonly CodePoint[]): Segment {
    return this.segments[this.chain.segmentIndex(chain)];
  }

  compress(): Uint8Array {
    const writer = new Writer();
    for (const c of signature) {
      writer.putUint8(c);
    }
    writer.putUint8(this.chain.order);
    writer.putUint8(this.chain.size);
    for (let i = 0; i < this.chain.size; i++) {
      writer.putUint16(this.chain.alphabet[i]);
    }
    for (const suffixes of this.segments) {
      writer.putUint8(suffixes.length);
      for (const { codePoint, frequency } of suffixes) {
        writer.putUint8(this.chain.index(codePoint));
        writer.putUint8(frequency);
      }
    }
    return writer.buffer();
  }

  stats(): {
    totalSegments: number;
    usedSegments: number;
    segmentUseRatio: number;
    totalEntries: number;
    usedEntries: number;
    entryUseRatio: number;
  } {
    const totalSegments = this.chain.segments;
    let usedSegments = 0;
    const totalEntries = this.chain.entries;
    let usedEntries = 0;
    for (const suffixes of this.segments) {
      if (suffixes.length > 0) {
        usedSegments += 1;
        for (const frequency of suffixes) {
          usedEntries += 1;
        }
      }
    }
    const segmentUseRatio =
      Math.round((usedSegments / totalSegments) * 100) / 100;
    const entryUseRatio = Math.round((usedEntries / totalEntries) * 100) / 100;
    return {
      totalSegments,
      usedSegments,
      segmentUseRatio,
      totalEntries,
      usedEntries,
      entryUseRatio,
    };
  }

  letters(): Letter[] {
    const map = new Map<CodePoint, number>(
      this.alphabet.map((codePoint) => [codePoint, 0]),
    );
    for (const suffixes of this.segments) {
      for (const { codePoint, frequency } of suffixes) {
        map.set(codePoint, (map.get(codePoint) ?? 0) + frequency);
      }
    }
    return [...map.entries()].map(([codePoint, f]) => new Letter(codePoint, f));
  }
}

class Chain {
  readonly order: number;
  readonly alphabet: readonly CodePoint[];
  readonly indexes: ReadonlyMap<CodePoint, number>;
  readonly size: number;
  readonly pow: readonly number[];
  readonly segments: number;
  readonly entries: number;

  constructor(order: number, alphabet: readonly CodePoint[]) {
    this.order = order;
    this.alphabet = alphabet;
    this.indexes = new Map(alphabet.map((v) => [v, alphabet.indexOf(v)]));
    this.size = this.alphabet.length;
    this.pow = powers(this.size, this.order);
    this.segments = Math.pow(this.size, this.order - 1);
    this.entries = Math.pow(this.size, this.order);
  }

  segmentIndex(chain: readonly CodePoint[]): number {
    const { order, pow } = this;
    const { length } = chain;
    let index = 0;
    for (let i = 0; i < order - 1; i++) {
      const codePoint = chain[length - order + 1 + i] || 0x0020;
      index += this.index(codePoint) * pow[i + 1];
    }
    return index;
  }

  entryIndex(chain: readonly CodePoint[]): number {
    const { order, pow } = this;
    const { length } = chain;
    let index = 0;
    for (let i = 0; i < order; i++) {
      const codePoint = chain[length - order + i] || 0x0020;
      index += this.index(codePoint) * pow[i];
    }
    return index;
  }

  codePoint(index: number): CodePoint {
    const v = this.alphabet[index];
    if (v === undefined) {
      throw new Error();
    }
    return v;
  }

  index(codePoint: CodePoint): number {
    const v = this.indexes.get(codePoint);
    if (v === undefined) {
      throw new Error();
    }
    return v;
  }
}

function readChain(reader: Reader): Chain {
  const order = reader.getUint8();
  const size = reader.getUint8();
  const alphabet = [];
  for (let i = 0; i < size; i++) {
    alphabet.push(reader.getUint16());
  }
  return new Chain(order, alphabet);
}

function readSegments(reader: Reader, chain: Chain): readonly Segment[] {
  const segments: Segment[] = [];
  for (let segmentIndex = 0; segmentIndex < chain.segments; segmentIndex++) {
    const segment: Suffix[] = [];
    const count = reader.getUint8();
    if (count >= chain.size) {
      throw new DataError();
    }
    for (let i = 0; i < count; i++) {
      const index = reader.getUint8();
      if (index >= chain.size) {
        throw new DataError();
      }
      const codePoint = chain.codePoint(index);
      const frequency = reader.getUint8();
      segment.push(
        Object.freeze<Suffix>({
          codePoint,
          frequency,
        }),
      );
    }
    if (segment.length > 0) {
      segments.push(Object.freeze(segment));
    } else {
      segments.push(empty);
    }
  }
  return Object.freeze(segments);
}

function buildSegments(chain: Chain, data: Uint8Array): readonly Segment[] {
  const segments: Segment[] = [];
  for (let segmentIndex = 0; segmentIndex < chain.segments; segmentIndex++) {
    const segment: Suffix[] = [];
    for (let index = 0; index < chain.size; index++) {
      const frequency = data[segmentIndex * chain.size + index];
      if (frequency > 0) {
        const codePoint = chain.codePoint(index);
        segment.push(
          Object.freeze<Suffix>({
            codePoint,
            frequency,
          }),
        );
      }
    }
    if (segment.length > 0) {
      segments.push(Object.freeze(segment));
    } else {
      segments.push(empty);
    }
  }
  return Object.freeze(segments);
}

function powers(size: number, order: number): number[] {
  const pow = new Array<number>(order);
  for (let i = 0; i < order; i++) {
    pow[i] = Math.pow(size, order - i - 1);
  }
  return pow;
}
