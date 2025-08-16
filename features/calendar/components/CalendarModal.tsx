/**
 * CalendarModal Component
 * 캘린더에서 사용되는 모달 컴포넌트
 */

'use client';

import React, { memo } from 'react';
import { Modal } from 'antd';
import { CalendarModalProps } from '../types';

interface LegacyModalProps {
  ModalTitle?: React.ReactNode;
  ModalText?: React.ReactNode;
  visible: boolean;
  onCancel?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  width?: number;
  style?: React.CSSProperties;
  className?: string;
}

const CalendarModal: React.FC<LegacyModalProps> = ({
  ModalTitle,
  ModalText,
  visible = false,
  onCancel,
  width,
  style,
  className,
}) => {
  return (
    <Modal
      footer={false}
      centered
      {...(width && { width })}
      {...(style && { style })}
      open={visible}
      {...(onCancel && { onCancel })}
      closable={false}
      {...(className && { className })}
      maskClosable={true}
      destroyOnClose
    >
      {ModalTitle && <div className="modal-title">{ModalTitle}</div>}
      {ModalText && <div className="modal-content">{ModalText}</div>}
    </Modal>
  );
};

export default memo(CalendarModal);