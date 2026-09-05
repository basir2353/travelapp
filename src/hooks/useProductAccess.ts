import { useEffect, useState } from 'react';
import {
  getProductAccess,
  FALLBACK_PRODUCT_CATEGORIES,
  ProductCategory } from
'../services/guestApi';

type ProductAccessState = {
  categories: ProductCategory[];
  loading: boolean;
  error: string | null;
};

const EMPTY: ProductAccessState = {
  categories: [],
  loading: false,
  error: null
};

let cachedCategories: ProductCategory[] | null = null;
let cachePromise: Promise<ProductCategory[]> | null = null;

function loadProductAccess(): Promise<ProductCategory[]> {
  if (cachedCategories) return Promise.resolve(cachedCategories);
  if (!cachePromise) {
    cachePromise = getProductAccess().
    then((categories) => {
      cachedCategories =
      categories.length > 0 ? categories : FALLBACK_PRODUCT_CATEGORIES;
      return cachedCategories;
    }).
    catch(() => {
      cachedCategories = FALLBACK_PRODUCT_CATEGORIES;
      return cachedCategories;
    }).
    finally(() => {
      cachePromise = null;
    });
  }
  return cachePromise;
}

export function useProductAccess(enabled = true) {
  const [state, setState] = useState<ProductAccessState>(() =>
    cachedCategories ?
    { categories: cachedCategories, loading: false, error: null } :
    EMPTY
  );

  useEffect(() => {
    if (!enabled) return;

    if (cachedCategories) {
      setState({ categories: cachedCategories, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    loadProductAccess().
    then((categories) => {
      if (!cancelled) {
        setState({ categories, loading: false, error: null });
      }
    }).
    catch((err) => {
      if (!cancelled) {
        setState({
          categories: FALLBACK_PRODUCT_CATEGORIES,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load products'
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
