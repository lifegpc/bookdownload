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

export enum DbType {
    IndexedDb,
}

type DbConfigData = {
    IndexedDb?: IndexedDbConfigData;
    DbType?: DbType;
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
}
