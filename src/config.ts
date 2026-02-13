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
