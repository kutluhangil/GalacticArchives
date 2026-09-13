import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { recordTitle, titleForPath } from '../lib/sections'
import { useApp } from '../state/app'

/**
 * Holds document.title on the current route and language. A record page passes
 * its own localized name; while the record is still loading it passes null and
 * the title the server sent stays up.
 */
export function useDocumentTitle(recordName: string | null = null) {
  const lang = useApp((s) => s.lang)
  const { pathname } = useLocation()

  useEffect(() => {
    const title = recordName === null ? titleForPath(pathname, lang) : recordTitle(recordName)
    if (title !== null) document.title = title
  }, [recordName, pathname, lang])
}
