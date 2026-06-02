import React, { useState } from 'react';
import { Plus, Trash2, UserSearch } from 'lucide-react';
import { ActionButton } from '../../../components/dashboard/ActionButton';
import { userService } from '../../auth/services/user.service';
import type { CreateUserVoucherAssignmentDTO } from '../types/voucher';

export interface CustomerAssignmentRow extends CreateUserVoucherAssignmentDTO {
  userFullName?: string;
  userEmail?: string;
}

interface CustomerAssignmentEditorProps {
  value: CustomerAssignmentRow[];
  onChange: (rows: CustomerAssignmentRow[]) => void;
  error?: string;
  readOnly?: boolean;
}

export const CustomerAssignmentEditor: React.FC<CustomerAssignmentEditorProps> = ({
  value,
  onChange,
  error,
  readOnly = false,
}) => {
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUpIndex, setLookingUpIndex] = useState<number | null>(null);

  const handleAddRow = () => {
    onChange([...value, { userId: 0, quantity: 1 }]);
  };

  const handleRemoveRow = (index: number) => {
    onChange(value.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleFieldChange = (index: number, field: keyof CustomerAssignmentRow, fieldValue: number) => {
    const next = [...value];
    next[index] = { ...next[index], [field]: fieldValue };
    onChange(next);
  };

  const lookupUser = async (index: number) => {
    const row = value[index];
    if (!row.userId || row.userId <= 0) {
      setLookupError('Please enter a valid customer ID.');
      return;
    }

    setLookingUpIndex(index);
    setLookupError(null);

    try {
      const user = await userService.getUserById(row.userId);
      const next = [...value];
      next[index] = {
        ...next[index],
        userFullName: user.fullName,
        userEmail: user.email,
      };
      onChange(next);
    } catch {
      setLookupError(`Customer with ID ${row.userId} not found.`);
    } finally {
      setLookingUpIndex(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Customer Assignments</h4>
          <p className="text-xs text-slate-500">Optional. Assign this voucher to specific customers.</p>
        </div>
        {!readOnly && (
          <ActionButton variant="secondary" onClick={handleAddRow} className="gap-1.5 px-3 py-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Customer
          </ActionButton>
        )}
      </div>

      {value.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No customer assignments. This voucher will be available to all customers.
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((row, index) => (
            <div
              key={`assignment-${index}`}
              className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-[1fr_120px_auto_auto]"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Customer ID</label>
                <input
                  type="number"
                  min={1}
                  value={row.userId || ''}
                  disabled={readOnly}
                  onChange={(event) => handleFieldChange(index, 'userId', Number(event.target.value))}
                  onBlur={() => lookupUser(index)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
                  placeholder="Enter customer ID"
                />
                {(row.userFullName || row.userEmail) && (
                  <p className="mt-1 text-xs text-slate-500">
                    {row.userFullName || 'Unknown'} {row.userEmail ? `(${row.userEmail})` : ''}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={row.quantity}
                  disabled={readOnly}
                  onChange={(event) => handleFieldChange(index, 'quantity', Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
              </div>

              {!readOnly && (
                <>
                  <div className="flex items-end">
                    <ActionButton
                      variant="secondary"
                      onClick={() => lookupUser(index)}
                      className="h-[38px] w-[38px]"
                      title="Lookup customer"
                      disabled={lookingUpIndex === index}
                    >
                      <UserSearch className="h-4 w-4" />
                    </ActionButton>
                  </div>
                  <div className="flex items-end">
                    <ActionButton
                      variant="warning"
                      onClick={() => handleRemoveRow(index)}
                      className="h-[38px] w-[38px]"
                      title="Remove assignment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </ActionButton>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {(error || lookupError) && (
        <p className="text-sm text-rose-600">{error || lookupError}</p>
      )}
    </div>
  );
};
