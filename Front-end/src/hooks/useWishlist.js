// useWishlist — localStorage-backed wishlist for gig IDs
// Each gig is wishlisted independently (gig-first system)
// Returns: { wishlist, toggle, isWishlisted }

import { useState, useCallback } from "react";

const KEY = "vizhiyal_wishlist";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(ids) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState(() => load());

  const toggle = useCallback((gigId) => {
    const id = String(gigId);
    setWishlist(prev => {
      const next = prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id];
      save(next);
      return next;
    });
  }, []);

  const isWishlisted = useCallback(
    (gigId) => wishlist.includes(String(gigId)),
    [wishlist]
  );

  return { wishlist, toggle, isWishlisted };
}
