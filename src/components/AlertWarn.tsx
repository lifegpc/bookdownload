import { Modal } from "antd";

export type AlertWarnProps = {
    title?: string;
    content: string;
    onClose?: () => void;
    okText?: string;
};

export default function AlertWarn({ title = "警告", content, onClose, okText = "好的" }: AlertWarnProps) {
    return <Modal title={title} open onOk={onClose} onCancel={onClose} okText={okText} cancelButtonProps={{ style: { display: "none" } }}>{content}</Modal>
}
