import { Component, createRef } from "react";
import { QdChapterHistoryInfo, QdChapterInfo } from "../../types";
import MonacoEditor, { MonacoEditorHandle } from 'react-monaco-editor';
import styles from './ChapterEditor.module.css';
import { Button, Card, Empty, Drawer, Flex, Skeleton, Tooltip, Typography } from "antd";
import Icon from "../../components/Icon";
import EditOutlined from "../../../node_modules/@material-icons/svg/svg/edit/outline.svg";
import SaveOutlined from "../../../node_modules/@material-icons/svg/svg/save/outline.svg";
import CloseOutlined from "../../../node_modules/@material-icons/svg/svg/close/outline.svg";
import ReplayOutlined from "../../../node_modules/@material-icons/svg/svg/replay/outline.svg";
import { DbContext } from "../dbProvider";
import Notification from "../../components/Notification";
import SaveAsOutlined from "../../../node_modules/@material-icons/svg/svg/save_as/outline.svg";
import type { Db } from "../../db/interfaces";
import HistoryOutlined from "../../../node_modules/@material-icons/svg/svg/history/outline.svg";

const { Text } = Typography;

export interface ChapterEditorProps {
    chapter: QdChapterInfo;
    onChapterSaveAs?: (chapter: QdChapterInfo) => void;
    history?: boolean;
    onLoadHistoryItem?: (item: QdChapterHistoryInfo) => void;
}

export interface ChapterEditorState {
    content: string;
    chapterName: string;
    editingChapterName: boolean;
    eChapterName?: string;
    changed: boolean;
    history?: QdChapterHistoryInfo[];
    loadingHistory: boolean;
    loadHistoryFailed: boolean;
    historyPanelOpen: boolean;
}

export default class ChapterEditor extends Component<ChapterEditorProps, ChapterEditorState> {
    ref;
    db?: Db;
    constructor(props: ChapterEditorProps) {
        super(props);
        this.ref = createRef<MonacoEditorHandle>();
        this.state = {
            content: props.chapter.contents ? props.chapter.contents.join('\n') : props.chapter.chapterInfo.content,
            chapterName: props.chapter.chapterInfo.chapterName,
            editingChapterName: false,
            changed: false,
            loadingHistory: false,
            loadHistoryFailed: false,
            historyPanelOpen: false,
        };
    }
    componentDidUpdate(prevProps: Readonly<ChapterEditorProps>, _prevState: Readonly<ChapterEditorState>, _snapshot?: unknown): void {
        if (prevProps.chapter.id !== this.props.chapter.id) {
            this.setState({
                content: this.props.chapter.contents ? this.props.chapter.contents.join('\n') : this.props.chapter.chapterInfo.content,
                chapterName: this.props.chapter.chapterInfo.chapterName,
                editingChapterName: false,
                eChapterName: undefined,
                changed: false,
                history: undefined,
                loadingHistory: false,
                loadHistoryFailed: false,
            });
        } else if (prevProps.chapter.id === this.props.chapter.id && prevProps.chapter.time !== this.props.chapter.time) {
            this.setState({
                content: this.props.chapter.contents ? this.props.chapter.contents.join('\n') : this.props.chapter.chapterInfo.content,
                chapterName: this.props.chapter.chapterInfo.chapterName,
                editingChapterName: false,
                eChapterName: undefined,
                changed: false,
            });
        } else if (prevProps.history && !this.props.history) {
            this.setState({ history: undefined, loadingHistory: false, loadHistoryFailed: false });
        }
        if (this.props.history && !this.state.history && !this.state.loadingHistory && this.db && !this.state.loadHistoryFailed) {
            this.setState({ loadingHistory: true });
            this.db.getQdChapterHistory(this.props.chapter.id).then(history => {
                console.log(history);
                this.setState({ history, loadingHistory: false });
            }).catch(err => {
                console.warn(err);
                const errmsg = err instanceof Error ? err.message : String(err);
                Notification(`加载章节历史失败: ${errmsg}`, 'error');
                this.setState({ loadingHistory: false, loadHistoryFailed: true });
            });
        }
    }
    layout() {
        this.ref.current?.editor.layout();
    }
    render() {
        let nameClass = styles.nameContainer;
        if (this.state.editingChapterName) {
            nameClass += ` ${styles.editing}`;
        }
        let chapterSaveClass = styles.chapterSave;
        if (!this.state.changed) {
            chapterSaveClass += ` ${styles.disabled}`;
        }
        let showHistoryClass = styles.showHistory;
        if (this.state.loadingHistory) {
            showHistoryClass += ` ${styles.disabled}`;
        }
        return (<>
            <DbContext.Consumer>
            { (db) => {this.db = db; return <>
            <Flex vertical className={styles.container}>
                <Flex className={styles.header}>
                    <Flex className={nameClass}>
                        <Text
                            className={styles.name}
                            editable={{
                                autoSize: true,
                                editing: this.state.editingChapterName,
                                onChange: (value) => this.setState({ eChapterName: value }),
                                icon: <Icon><EditOutlined fill="currentColor" width="20" height="20" /></Icon>,
                                tooltip: "编辑章节名称",
                                onStart: () => this.setState({ editingChapterName: true }),
                                enterIcon: null,
                                onEnd: () => this.setState({ editingChapterName: false, chapterName: this.state.eChapterName ?? this.state.chapterName, eChapterName: undefined, changed: true }),
                                onCancel: () => this.setState({ editingChapterName: false, eChapterName: undefined }),
                            }}
                        >
                            {this.state.editingChapterName ? (this.state.eChapterName ?? this.state.chapterName) : this.state.chapterName}
                        </Text>
                        {this.state.editingChapterName && <Icon cls={styles.nameClose}><CloseOutlined fill="currentColor" width="20" height="20" onClick={() => {
                            this.setState({ editingChapterName: false, eChapterName: undefined });
                        }} /></Icon>}
                        {this.state.editingChapterName && <Icon cls={styles.nameSave}><SaveOutlined fill="currentColor" width="20" height="20" onClick={() => {
                            this.setState({ editingChapterName: false, chapterName: this.state.eChapterName ?? this.state.chapterName, eChapterName: undefined, changed: true });
                        }} /></Icon>}
                    </Flex>
                    <Flex className={styles.action}>
                        <Tooltip title="保存章节" placement="left"><Icon><SaveOutlined fill="currentColor" className={chapterSaveClass} onClick={this.state.changed ?
                            () => {
                                const ch = this.props.chapter;
                                ch.chapterInfo.chapterName = this.state.chapterName;
                                ch.contents = this.state.content.split('\n');
                                db.updateQdChapter(ch).then((_key) => {
                                    this.setState({ changed: false });
                                }).catch((err) => {
                                    console.warn(err);
                                    const errmsg = err instanceof Error ? err.message : String(err);
                                    Notification(`保存章节失败: ${errmsg}`, 'error');
                                });
                            }
                        : undefined} /></Icon></Tooltip>
                        <Tooltip title="另存为新章节" placement="left"><Icon><SaveAsOutlined fill="currentColor" className={chapterSaveClass} onClick={() => {
                            const ch = structuredClone(this.props.chapter);
                            ch.chapterInfo.chapterName = this.state.chapterName;
                            ch.contents = this.state.content.split('\n');
                            ch.time = Date.now();
                            db.saveQdChapter(ch).then(() => {
                                this.setState({ changed: false });
                                if (this.props.onChapterSaveAs) {
                                    this.props.onChapterSaveAs(ch);
                                }
                            }).catch((err) => {
                                console.warn(err);
                                const errmsg = err instanceof Error ? err.message : String(err);
                                Notification(`章节另存失败: ${errmsg}`, 'error');
                            });
                        }} /></Icon></Tooltip>
                        <Tooltip title="重置章节内容" placement="left"><Icon><ReplayOutlined fill="currentColor" className={styles.reset} onClick={() => {
                            this.setState({
                                content: this.props.chapter.contents ? this.props.chapter.contents.join('\n') : this.props.chapter.chapterInfo.content,
                                changed: false,
                            });
                        }} /></Icon></Tooltip>
                        {this.props.history && <Tooltip title="查看章节历史" placement="left"><Icon><HistoryOutlined fill="currentColor" className={showHistoryClass} onClick={this.state.loadingHistory ? undefined : () => {
                            this.setState({ historyPanelOpen: true });
                        }}  /></Icon></Tooltip>}
                        {this.props.history && <Drawer
                            title="章节历史"
                            placement="right"
                            onClose={() => this.setState({ historyPanelOpen: false })}
                            open={this.state.historyPanelOpen}
                        >
                            <Flex vertical align="center" className={styles.history}>
                                {this.state.history && this.state.history.length === 0 && <Empty description="没有历史记录" />}
                                {this.state.history && this.state.history.length > 0 && this.state.history.map((item, ind) => (
                                    <Card key={String(item.primaryKey)} className={styles.item}>
                                        <Flex align="center">
                                            <Text>{item.name}</Text>
                                            {item.time === this.props.chapter.time && <Text className={styles.current}>(当前)</Text>}
                                        </Flex>
                                        <Text>保存时间: {new Date(item.time).toLocaleString()}</Text>
                                        <Flex align="center">
                                            {ind !== 0 && <Button onClick={() => {
                                                db.setAsLatestQdChapter(item.primaryKey).then(() => {
                                                    this.setState({ loadHistoryFailed: false, history: undefined, loadingHistory: false, });
                                                }).catch((err) => {
                                                    console.warn(err);
                                                    const errmsg = err instanceof Error ? err.message : String(err);
                                                    Notification(`设为最新版本失败: ${errmsg}`, 'error');
                                                });
                                            }}>设为最新版本</Button>}
                                            {this.props.onLoadHistoryItem && item.time !== this.props.chapter.time && <Button onClick={() => {
                                                this.props.onLoadHistoryItem?.(item);
                                            }}>加载</Button>}
                                        </Flex>
                                    </Card>
                                ))}
                                {this.state.loadingHistory && <Skeleton active />}
                            </Flex>
                        </Drawer>}
                    </Flex>
                </Flex>
                <div className={styles.editor}>
                    <MonacoEditor
                        ref={this.ref}
                        value={this.state.content}
                        language="plaintext"
                        width="100%"
                        height="100%"
                        onChange={(newValue) => this.setState({ content: newValue, changed: true })}
                        options={{
                            wordWrap: 'on',
                        }}
                    />
                </div>
            </Flex>
            </>}}
            </DbContext.Consumer>
        </>);
    }
}
