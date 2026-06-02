import React, { useMemo, useState } from 'react';
import { AlertCircle, Heart, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../../../../components/dashboard/ConfirmDialog';
import { PATH } from '../../../../config/routes/route';
import { WishlistSearchInput } from '../components/WishlistSearchInput';
import { WishlistTourCard } from '../components/WishlistTourCard';
import { useMyWishlist } from '../hooks/useMyWishlist';
import { useRemoveFromWishlist } from '../hooks/useRemoveFromWishlist';
import type { WishlistTab } from '../types/customerWishlist';
import {
  filterWishlistBySearch,
  getWishlistTabCounts,
} from '../utils/wishlistHelpers';

const TABS: { key: WishlistTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Available' },
  { key: 'unavailable', label: 'Unavailable' },
];

export const MyWishlistPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WishlistTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRemove, setPendingRemove] = useState<{ tourId: number; tourName: string } | null>(
    null,
  );

  const { allItems, items, isLoading, error, refetch, isFetching } = useMyWishlist(activeTab);
  const { removeFromWishlist, isRemoving, removingTourId } = useRemoveFromWishlist({
    onRemoved: () => setPendingRemove(null),
  });

  const tabCounts = useMemo(() => getWishlistTabCounts(allItems), [allItems]);
  const displayedItems = useMemo(
    () => filterWishlistBySearch(items, searchQuery),
    [items, searchQuery],
  );

  const handleConfirmRemove = () => {
    if (!pendingRemove) return;
    removeFromWishlist(pendingRemove.tourId);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-slate-900">
            <Heart className="text-brand" size={24} />
            My Wishlist
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Tours you saved for later. Book them anytime when you are ready.
          </p>
        </div>
        {!isLoading && !error && (
          <span className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
            {allItems.length} saved tour{allItems.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {!isLoading && !error && allItems.length > 0 && (
        <WishlistSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={displayedItems.length}
        />
      )}

      <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-brand text-white shadow-md shadow-brand/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 py-12 text-center text-rose-700">
          <AlertCircle size={28} className="text-rose-400" />
          <p className="font-semibold">Unable to load wishlist</p>
          <p className="text-sm text-rose-500">{error}</p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <Heart size={40} className="text-slate-300" />
          <p className="font-semibold text-slate-700">
            {activeTab === 'all' ? 'Your wishlist is empty' : `No ${activeTab} tours saved`}
          </p>
          <p className="max-w-sm text-sm text-slate-400">
            {activeTab === 'all'
              ? 'Tap the heart icon on any tour to save it here, just like Shopee or Amazon.'
              : 'Try another tab or browse tours to save more favorites.'}
          </p>
          <Link
            to={PATH.PUBLIC.TOUR_SEARCH}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-hover !no-underline"
          >
            <Search className="h-4 w-4" />
            Browse tours
          </Link>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
          <Search size={32} className="text-slate-300" />
          <p className="font-semibold text-slate-700">No tours match your search</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-sm font-bold text-brand hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedItems.map((item) => (
            <WishlistTourCard
              key={item.wishlistId}
              item={item}
              isRemoving={isRemoving && removingTourId === item.tourId}
              onRemove={(tourId) =>
                setPendingRemove({ tourId, tourName: item.tourName })
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingRemove}
        onClose={() => !isRemoving && setPendingRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Remove from wishlist?"
        message={
          pendingRemove ? (
            <>
              Remove <strong>{pendingRemove.tourName}</strong> from your saved tours?
            </>
          ) : (
            ''
          )
        }
        confirmText="Remove"
        cancelText="Keep"
        variant="warning"
        icon={<Heart className="h-6 w-6 text-rose-500" />}
      />
    </div>
  );
};
