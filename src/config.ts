import { loadConfig, saveConfig } from "./utils";

type QdConfigData = {
    AutoSaveChapter?: boolean;
}

export class QdConfig {
    static STORAGE_KEY = 'qd_config';
    config?: QdConfigData;
    constructor() {
    }
    async init() {
        this.config = await loadConfig<QdConfigData>(QdConfig.STORAGE_KEY, {});
    }
    async save() {
        if (!this.config) {
            throw new Error('Config not initialized');
        }
        await saveConfig(QdConfig.STORAGE_KEY, this.config);
    }
    reset() {
        this.config = {};
    }
    get AutoSaveChapter(): boolean {
        return this.config?.AutoSaveChapter ?? false;
    }
    set AutoSaveChapter(value: boolean) {
        if (!this.config) {
            throw new Error('Config not initialized');
        }
        this.config.AutoSaveChapter = value;
    }
}

type IndexedDbConfigData = {
    compress?: boolean;
}

type PocketBaseConfigData = {
    url?: string;
    username?: string;
    password?: string;
    prefix?: string;
    batch?: boolean;
    batchSize?: number;
}

export enum DbType {
    IndexedDb,
    PocketBase,
}

type DbConfigData = {
    IndexedDb?: IndexedDbConfigData;
    DbType?: DbType;
    PocketBase?: PocketBaseConfigData;
}

export class IndexedDbConfig {
    config: IndexedDbConfigData;
    constructor(config: IndexedDbConfigData) {
        this.config = config;
    }
    get compress(): boolean {
        return this.config.compress ?? false;
    }
    set compress(value: boolean) {
        this.config.compress = value;
    }
}

export class PocketBaseConfig {
    config: PocketBaseConfigData;
    constructor(config: PocketBaseConfigData) {
        this.config = config;
    }
    get url(): string {
        return this.config.url ?? 'http://localhost:8090';
    }
    set url(value: string) {
        this.config.url = value;
    }
    get username(): string {
        return this.config.username ?? '';
    }
    set username(value: string) {
        this.config.username = value;
    }
    get password(): string {
        return this.config.password ?? '';
    }
    set password(value: string) {
        this.config.password = value;
    }
    get prefix(): string {
        return this.config.prefix ?? '';
    }
    set prefix(value: string) {
        this.config.prefix = value;
    }
    get batch(): boolean {
        return this.config.batch ?? false;
    }
    set batch(value: boolean) {
        this.config.batch = value;
    }
    get batchSize(): number {
        return this.config.batchSize ?? 50;
    }
    set batchSize(value: number) {
        this.config.batchSize = value;
    }
}

export class DbConfig {
    static STORAGE_KEY = 'db_config';
    config?: DbConfigData;
    constructor() {
    }
    async init() {
        this.config = await loadConfig<DbConfigData>(DbConfig.STORAGE_KEY, {});
    }
    async save() {
        if (!this.config) {
            throw new Error('Config not initialized');
        }
        await saveConfig(DbConfig.STORAGE_KEY, this.config);
    }
    reset() {
        this.config = {};
    }
    get IndexedDb(): IndexedDbConfig {
        if (!this.config) {
            throw new Error('Config not initialized');
        }
        if (!this.config.IndexedDb) {
            this.config.IndexedDb = {};
        }
        return new IndexedDbConfig(this.config.IndexedDb);
    }
    get DbType(): DbType {
        return this.config?.DbType ?? DbType.IndexedDb;
    }
    set DbType(value: DbType) {
        if (!this.config) {
            throw new Error('Config not initialized');
        }
        this.config.DbType = value;
    }
    get PocketBase(): PocketBaseConfig {
        if (!this.config) {
            throw new Error('Config not initialized');
        }
        if (!this.config.PocketBase) {
            this.config.PocketBase = {};
        }
        return new PocketBaseConfig(this.config.PocketBase);
    }
}
