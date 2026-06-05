import React, { useEffect, useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { ActionButton } from '../../../components/dashboard/ActionButton';
import type { CreateUserVoucherAssignmentDTO } from '../types/voucher';
import { useTranslation } from '../../../contexts/LocaleContext';
import { useSearchUsers } from '../../users/hooks/useUsers';

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
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: searchResult, isLoading: isSearching } = useSearchUsers(
    debouncedQuery,
    1,
    8,
    'Customer',
  );

  const searchResults = useMemo(() => {
    if (!searchResult?.data || !Array.isArray(searchResult.data)) return [];
    const assignedIds = new Set(value.map((row) => row.userId));
    return searchResult.data.filter((user) => !assignedIds.has(user.id));
  }, [searchResult, value]);

  const handleRemoveRow = (index: number) => {
    onChange(value.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleFieldChange = (index: number, field: keyof CustomerAssignmentRow, fieldValue: number) => {
    const next = [...value];
    next[index] = { ...next[index], [field]: fieldValue };
    onChange(next);
  };

  const handleSelectCustomer = (user: { id: number; fullName: string; email: string }) => {
    if (value.some((row) => row.userId === user.id)) {
      return;
    }

    onChange([
      ...value,
      {
        userId: user.id,
        quantity: 1,
        userFullName: user.fullName,
        userEmail: user.email,
      },
    ]);
    setSearchInput('');
    setDebouncedQuery('');
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-slate-800">{t('voucher.specificCustomers')}</h4>
        <p className="text-xs text-slate-500">{t('voucher.specificCustomersDesc')}</p>
      </div>

      {!readOnly && (
        <div className="relative">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('voucher.searchCustomerByName')}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>

          {debouncedQuery && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              {isSearching ? (
                <p className="px-4 py-3 text-sm text-slate-500">{t('voucher.searchingCustomers')}</p>
              ) : searchResults.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">{t('voucher.noCustomersFound')}</p>
              ) : (
                <ul className="max-h-56 overflow-y-auto">
                  {searchResults.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectCustomer(user)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                      >
                        <span>
                          <span className="font-medium text-slate-800">{user.fullName}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{user.email}</span>
                        </span>
                        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          ID: {user.id}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {value.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          {t('voucher.noSpecificCustomers')}
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((row, index) => (
            <div
              key={`assignment-${row.userId}-${index}`}
              className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-[1fr_120px_auto]"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {t('voucher.customerIdLabel')}
                </label>
                <input
                  type="number"
                  min={1}
                  value={row.userId || ''}
                  disabled={readOnly}
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none"
                  placeholder={t('voucher.enterCustomerId')}
                />
                {(row.userFullName || row.userEmail) && (
                  <p className="mt-1 text-xs text-slate-500">
                    {row.userFullName || t('voucher.unknownCustomer')}
                    {row.userEmail ? ` (${row.userEmail})` : ''}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">{t('voucher.quantity')}</label>
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
                <div className="flex items-end">
                  <ActionButton
                    variant="warning"
                    onClick={() => handleRemoveRow(index)}
                    className="h-[38px] w-[38px]"
                    title={t('voucher.removeAssignment')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
};
