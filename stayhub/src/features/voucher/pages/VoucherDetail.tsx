import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VoucherDetailModal } from '../components/VoucherDetailModal';

export const VoucherDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  };

  if (!id) return null;

  return <VoucherDetailModal id={id} onClose={handleClose} />;
};
