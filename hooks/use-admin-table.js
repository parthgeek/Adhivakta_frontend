"use client"

// Server-driven table state synced to URL query params:
// pagination, sort, debounced search and arbitrary filters survive reloads
// and are shareable/deep-linkable.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { api, buildQuery } from "@/lib/admin/api"

export function useServerTable({ endpoint, defaultFilters = {}, defaultSort, pageSize = 25 }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const paramsObject = useMemo(() => {
    const obj = { ...defaultFilters }
    searchParams.forEach((value, key) => {
      obj[key] = value
    })
    return obj
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchInput, setSearchInput] = useState(paramsObject.q || "")
  const debounceRef = useRef(null)
  const requestSeq = useRef(0)

  const setParams = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "" || value === "all") next.delete(key)
        else next.set(key, value)
      })
      // Any filter change resets to page 1 unless page was explicitly set
      if (!("page" in updates)) next.delete("page")
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  // Debounce free-text search into the URL
  const onSearchChange = useCallback(
    (value) => {
      setSearchInput(value)
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => setParams({ q: value }), 400)
    },
    [setParams]
  )

  const fetchData = useCallback(async () => {
    const seq = ++requestSeq.current
    setLoading(true)
    setError(null)
    try {
      const query = buildQuery({
        limit: pageSize,
        sort: defaultSort,
        ...paramsObject,
      })
      const result = await api.get(`${endpoint}${query}`)
      if (seq !== requestSeq.current) return // stale response
      setData(result.data || [])
      setPagination(result.pagination || { page: 1, totalPages: 1, total: (result.data || []).length })
    } catch (err) {
      if (seq !== requestSeq.current) return
      setError(err)
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }, [endpoint, paramsObject, pageSize, defaultSort])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    pagination,
    loading,
    error,
    refresh: fetchData,
    filters: paramsObject,
    setParams,
    searchInput,
    onSearchChange,
    setPage: (page) => setParams({ page: String(page) }),
  }
}
