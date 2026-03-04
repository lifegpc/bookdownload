import { Component, createRef } from "react";
import MonacoEditor, { MonacoEditorHandle } from 'react-monaco-editor';

export interface NewChapterEditorProps {
    content: string;
    onContentChanged: (content: string) => void;
    className?: string;
}

interface State {
    height: number;
}

export default class NewChapterEditor extends Component<NewChapterEditorProps, State> {
    ref;
    #editorContainerRef = createRef<HTMLDivElement>();
    #resizeObserver?: ResizeObserver;
    constructor(props: NewChapterEditorProps) {
        super(props);
        this.ref = createRef<MonacoEditorHandle>();
        this.state = { height: 0 };
    }
    componentDidMount() {
        if (this.#editorContainerRef.current) {
            this.#resizeObserver = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (entry) {
                    this.setState({ height: entry.contentRect.height });
                }
                this.layout();
            });
            this.#resizeObserver.observe(this.#editorContainerRef.current);
            // 初始化高度
            this.setState({ height: this.#editorContainerRef.current.clientHeight });
        }
    }
    componentWillUnmount() {
        this.#resizeObserver?.disconnect();
    }
    layout() {
        this.ref.current?.editor.layout();
    }
    render() {
        return (
            <div ref={this.#editorContainerRef} className={this.props.className}>
                <MonacoEditor
                    ref={this.ref}
                    value={this.props.content}
                    language="plaintext"
                    width="100%"
                    height={this.state.height || '100%'}
                    onChange={(newValue) => this.props.onContentChanged(newValue)}
                    options={{
                        wordWrap: 'on',
                    }}
                />
            </div>
        );
    }
}
