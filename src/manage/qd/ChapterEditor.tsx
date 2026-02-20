import { Component, createRef } from "react";
import { QdChapterInfo } from "../../types";
import MonacoEditor, { MonacoEditorHandle } from 'react-monaco-editor';

export interface ChapterEditorProps {
    chapter: QdChapterInfo;
}

export interface ChapterEditorState {
    content: string;
}

export default class ChapterEditor extends Component<ChapterEditorProps, ChapterEditorState> {
    ref;
    constructor(props: ChapterEditorProps) {
        super(props);
        this.ref = createRef<MonacoEditorHandle>();
        this.state = {
            content: props.chapter.contents ? props.chapter.contents.join('\n') : props.chapter.chapterInfo.content,
        };
    }
    componentDidUpdate(prevProps: Readonly<ChapterEditorProps>, _prevState: Readonly<ChapterEditorState>, _snapshot?: unknown): void {
        if (prevProps.chapter.id !== this.props.chapter.id) {
            this.setState({
                content: this.props.chapter.contents ? this.props.chapter.contents.join('\n') : this.props.chapter.chapterInfo.content,
            });
        }
    }
    layout() {
        this.ref.current?.editor.layout();
    }
    render() {
        return (<>
            <MonacoEditor
                ref={this.ref}
                value={this.state.content}
                language="plaintext"
                onChange={(newValue) => this.setState({ content: newValue })}
                options={{
                    wordWrap: 'on',
                }}
            />
        </>);
    }
}
