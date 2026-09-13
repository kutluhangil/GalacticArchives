// The served HTML carries a title, and a single-page app used to keep it for
// the whole session: walking to another record, or switching to English, left
// the first title standing in the tab. These drive the hook the way the app
// does — through a router and the language store.

import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { act } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { useDocumentTitle } from '../../src/hooks/useDocumentTitle'
import { SITE_NAME } from '../../src/lib/sections'
import { useApp } from '../../src/state/app'

function Shell() {
  useDocumentTitle()
  return null
}

function Record({ name }: { name: string | null }) {
  useDocumentTitle(name)
  return null
}

beforeEach(() => {
  localStorage.clear()
  useApp.setState({ lang: 'tr' })
  document.title = 'served title'
})

describe('useDocumentTitle', () => {
  it('titles a section route from the shared table', () => {
    render(
      <MemoryRouter initialEntries={['/hangar']}>
        <Routes>
          <Route path="/hangar" element={<Shell />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(document.title).toBe(`Hangar — ${SITE_NAME}`)
  })

  it('follows a language switch', () => {
    render(
      <MemoryRouter initialEntries={['/force']}>
        <Routes>
          <Route path="/force" element={<Shell />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(document.title).toBe(`Güç Kasası — ${SITE_NAME}`)
    act(() => {
      useApp.setState({ lang: 'en' })
    })
    expect(document.title).toBe(`Force Vault — ${SITE_NAME}`)
  })

  it('keeps the served title while a record is still loading', () => {
    render(
      <MemoryRouter initialEntries={['/planet/hoth']}>
        <Routes>
          <Route path="/planet/:id" element={<Record name={null} />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(document.title).toBe('served title')
  })

  it('takes the record name from the page once it has one', () => {
    render(
      <MemoryRouter initialEntries={['/planet/hoth']}>
        <Routes>
          <Route path="/planet/:id" element={<Record name="Hoth" />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(document.title).toBe(`Hoth — ${SITE_NAME}`)
  })

  it('titles an address the archive does not have', () => {
    render(
      <MemoryRouter initialEntries={['/nowhere']}>
        <Routes>
          <Route path="*" element={<Shell />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(document.title).toBe(`Böyle bir kayıt yok — ${SITE_NAME}`)
  })
})
