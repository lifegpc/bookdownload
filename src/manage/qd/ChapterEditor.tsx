import { Component, createRef } from "react";
import { QdChapterInfo } from "../../types";
import MonacoEditor, { MonacoEditorHandle } from 'react-monaco-editor';
import styles from './ChapterEditor.module.css';
import { Flex, Typography } from "antd";
import Icon from "../../components/Icon";
import EditOutlined from "../../../node_modules/@material-icons/svg/svg/edit/outline.svg";
import SaveOutlined from "../../../node_modules/@material-icons/svg/svg/save/outline.svg";

const { Text } = Typography;

export interface ChapterEditorProps {
    chapter: QdChapterInfo;
}

export interface ChapterEditorState {
    content: string;
    chapterName: string;
}

export default class ChapterEditor extends Component<ChapterEditorProps, ChapterEditorState> {
    ref;
    constructor(props: ChapterEditorProps) {
        super(props);
        this.ref = createRef<MonacoEditorHandle>();
        this.state = {
            content: props.chapter.contents ? props.chapter.contents.join('\n') : props.chapter.chapterInfo.content,
            chapterName: props.chapter.chapterInfo.chapterName,
        };
    }
    componentDidUpdate(prevProps: Readonly<ChapterEditorProps>, _prevState: Readonly<ChapterEditorState>, _snapshot?: unknown): void {
        if (prevProps.chapter.id !== this.props.chapter.id) {
            this.setState({
                content: this.props.chapter.contents ? this.props.chapter.contents.join('\n') : this.props.chapter.chapterInfo.content,
                chapterName: this.props.chapter.chapterInfo.chapterName,
            });
        }
    }
    layout() {
        this.ref.current?.editor.layout();
    }
    render() {
        return (<>
            <Flex vertical className={styles.container}>
                <Flex className={styles.header}>
                    <Text
                        className={styles.name}
                        editable={{
                            onChange: (value) => this.setState({ chapterName: value }),
                            icon: <Icon><EditOutlined fill="currentColor" width="20" /></Icon>,
                            enterIcon: <Icon><SaveOutlined fill="currentColor" width="20" className={styles.save} /></Icon>,
                            tooltip: "编辑章节名称",
                        }}
                    >
                        {this.state.chapterName}
                    </Text>
                </Flex>
                <div className={styles.editorWrapper}>
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
