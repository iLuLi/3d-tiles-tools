import { Database } from "better-sqlite3";
import DatabaseConstructor from "better-sqlite3";

import { Iterables } from "@3d-tiles-tools/base";

import { TilesetSource } from "../tilesetData/TilesetSource.js";
import { TilesetError } from "../tilesetData/TilesetError.js";

import { TableStructure } from "./TableStructureValidator.js";
import { TableStructureValidator } from "./TableStructureValidator.js";

/**
 * Implementation of a TilesetSource based on a 3DTILES (SQLITE3 database)
 * file.
 *
 * @internal
 */
export class TilesetSource3dtiles implements TilesetSource {
  /**
   * The database, or undefined if the database is not opened
   */
  private db: Database | undefined;

  /**
   * Default constructor
   */
  constructor() {
    this.db = undefined;
  }

  /** {@inheritDoc TilesetSource.open} */
  open(fullInputName: string): void {
    if (this.db) {
      throw new TilesetError("Database already opened");
    }
    this.db = new DatabaseConstructor(fullInputName);

    const tableStructure: TableStructure = {
      name: "media",
      columns: [
        {
          name: "key",
          type: "TEXT",
        },
        {
          name: "content",
          type: "BLOB",
        },
      ],
    };
    const message = TableStructureValidator.validate(this.db, tableStructure);
    if (message) {
      this.close();
      throw new TilesetError(message);
    }
  }

  /** {@inheritDoc TilesetSource.getKeys} */
  getKeys(): Iterable<string> {
    if (!this.db) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    const selection = this.db.prepare("SELECT * FROM media");
    const iterable = {
      [Symbol.iterator]: function (): Iterator<any> {
        return selection.iterate();
      },
    };
    return Iterables.map(iterable, (row: any) => row.key);
  }

  /** {@inheritDoc TilesetSource.getValue} */
  getValue(key: string): Buffer | undefined {
    if (!this.db) {
      throw new Error("Source is not opened. Call 'open' first.");
    }
    const selection = this.db.prepare("SELECT * FROM media WHERE key = ?");
    const row = selection.get(key) as any;
    if (row) {
      return row.content;
    }
    return undefined;
  }

  /** {@inheritDoc TilesetSource.close} */
  close() {
    if (!this.db) {
      throw new Error("Source is not opened. Call 'open' first.");
    }
    this.db.close();
    this.db = undefined;
  }
}
