import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const usePagination = (endpoint, options = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);
    const [count, setCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const { pageSize = 20, search = '', params = {}, enabled = true } = options;

    const fetchData = useCallback(async (pageNum) => {
        setLoading(true);
        setError(null);
        try {
            const requestParams = {
                page: pageNum,
                page_size: pageSize,
                ...params,
            };
            if (search) requestParams.search = search;

            const response = await api.get(endpoint, { params: requestParams });
            const results = Array.isArray(response.data) ? response.data : response.data.results;
            setData(results || []);
            setHasNext(!!response.data.next);
            setHasPrev(!!response.data.previous);
            setCount(response.data.count || results?.length || 0);
            setTotalPages(Math.ceil((response.data.count || 0) / pageSize));
        } catch (err) {
            setError(err.response?.data || err.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [endpoint, pageSize, search, JSON.stringify(params)]);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        fetchData(page);
    }, [fetchData, page, enabled]);

    const goToPage = useCallback((pageNum) => setPage(pageNum), []);
    const nextPage = useCallback(() => setPage((p) => p + 1), []);
    const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
    const refetch = useCallback(() => fetchData(page), [fetchData, page]);

    return {
        data, loading, error,
        page, hasNext, hasPrev, count, totalPages,
        goToPage, nextPage, prevPage, refetch,
    };
};
