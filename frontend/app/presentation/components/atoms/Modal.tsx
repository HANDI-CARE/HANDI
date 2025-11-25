import type { ModalProps as AntdModalProps } from "antd";
import { Modal as AntdModal } from "antd";

export type ModalProps = AntdModalProps;

export const Modal: React.FC<ModalProps> = (props) => {
  return <AntdModal {...props}>{props.children}</AntdModal>;
};

export default Modal;
