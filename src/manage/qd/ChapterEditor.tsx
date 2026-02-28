import { Component, createRef } from "react";
import { QdChapterInfo } from "../../types";
import MonacoEditor, { MonacoEditorHandle } from 'react-monaco-editor';
import styles from './ChapterEditor.module.css';
import { Flex, Typography } from "antd";
import Icon from "../../components/Icon";
import EditOutlined from "../../../node_modules/@material-icons/svg/svg/edit/outline.svg";
import SaveOutlined from "../../../node_modules/@material-icons/svg/svg/save/outline.svg";
import CloseOutlined from "../../../node_modules/@material-icons/svg/svg/close/outline.svg";

const { Text } = Typography;

export interface ChapterEditorProps {
    chapter: QdChapterInfo;
}

export interface ChapterEditorState {
    content: string;
    chapterName: string;
    editingChapterName: boolean;
    eChapterName?: string;
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
        };
    }
    componentDidUpdate(prevProps: Readonly<ChapterEditorProps>, _prevState: Readonly<ChapterEditorState>, _snapshot?: unknown): void {
        if (prevProps.chapter.id !== this.props.chapter.id) {
            this.setState({
                content: this.props.chapter.contents ? this.props.chapter.contents.join('\n') : this.props.chapter.chapterInfo.content,
                chapterName: this.props.chapter.chapterInfo.chapterName,
                editingChapterName: false,
                eChapterName: undefined,
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
        console.log(this.state);
        return (<>
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
                                onEnd: () => this.setState({ editingChapterName: false, chapterName: this.state.eChapterName ?? this.state.chapterName, eChapterName: undefined }),
                                onCancel: () => this.setState({ editingChapterName: false, eChapterName: undefined }),
                            }}
                        >
                            {this.state.editingChapterName ? (this.state.eChapterName ?? this.state.chapterName) : this.state.chapterName}
                        </Text>
                        {this.state.editingChapterName && <Icon cls={styles.nameClose}><CloseOutlined fill="currentColor" width="20" height="20" onClick={() => {
                            this.setState({ editingChapterName: false, eChapterName: undefined });
                        }} /></Icon>}
                        {this.state.editingChapterName && <Icon cls={styles.nameSave}><SaveOutlined fill="currentColor" width="20" height="20" onClick={() => {
                            this.setState({ editingChapterName: false, chapterName: this.state.eChapterName ?? this.state.chapterName, eChapterName: undefined });
                        }} /></Icon>}
                    </Flex>
                </Flex>
                <div className={styles.editor}>
                    <MonacoEditor
                        ref={this.ref}
                        value={this.state.content}
                        language="plaintext"
                        width="100%"
                        height="100%"
                        onChange={(newValue) => this.setState({ content: newValue })}
                        options={{
                            wordWrap: 'on',
                        }}
                    />
                </div>
            </Flex>
        </>);
    }
}
