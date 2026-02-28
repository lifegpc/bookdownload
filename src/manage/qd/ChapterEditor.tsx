import { Component, createRef } from "react";
import { QdChapterInfo } from "../../types";
import MonacoEditor, { MonacoEditorHandle } from 'react-monaco-editor';
import styles from './ChapterEditor.module.css';
import { Flex, Tooltip, Typography } from "antd";
import Icon from "../../components/Icon";
import EditOutlined from "../../../node_modules/@material-icons/svg/svg/edit/outline.svg";
import SaveOutlined from "../../../node_modules/@material-icons/svg/svg/save/outline.svg";
import CloseOutlined from "../../../node_modules/@material-icons/svg/svg/close/outline.svg";
import ReplayOutlined from "../../../node_modules/@material-icons/svg/svg/replay/outline.svg";
import { DbContext } from "../dbProvider";
import Notification from "../../components/Notification";
import SaveAsOutlined from "../../../node_modules/@material-icons/svg/svg/save_as/outline.svg";

const { Text } = Typography;

export interface ChapterEditorProps {
    chapter: QdChapterInfo;
    onChapterSaveAs?: (chapter: QdChapterInfo) => void;
}

export interface ChapterEditorState {
    content: string;
    chapterName: string;
    editingChapterName: boolean;
    eChapterName?: string;
    changed: boolean;
}

export default class ChapterEditor extends Component<ChapterEditorProps, ChapterEditorState> {
    ref;
    constructor(props: ChapterEditorProps) {
        super(props);
        this.ref = createRef<MonacoEditorHandle>();
        this.state = {
            content: props.chapter.contents ? props.chapter.contents.join('\n') : props.chapter.chapterInfo.content,
            chapterName: props.chapter.chapterInfo.chapterName,
            editingChapterName: false,
            changed: false,
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
        return (<>
            <DbContext.Consumer>
            { (db) => <>
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
            </>}
            </DbContext.Consumer>
        </>);
    }
}
