import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  width?: number;
}

/** 低保真浮层：用于出牌、效果选择、炸弹处理与日志查看 */
export function Modal({ title, children, footer, onClose, width = 380 }: ModalProps) {
  return (
    <div className="wf-dialog-layer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="wf-dialog" style={{ maxWidth: width }}>
        <header className="wf-dialog-head">
          <h3>{title}</h3>
          <button type="button" className="wf-close" onClick={onClose}>
            关闭
          </button>
        </header>
        <div className="wf-dialog-body">{children}</div>
        {footer ? <footer className="wf-dialog-actions">{footer}</footer> : null}
      </div>
    </div>
  );
}
