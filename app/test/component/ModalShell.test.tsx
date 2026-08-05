// The top bar's tool panels shipped as bare overlay divs: a keyboard visitor
// could open one and never get out, and a screen reader was told nothing about
// it. ModalShell is where that behaviour now lives, so it is where it is tested.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalShell from '../../src/components/ModalShell'
import { useApp } from '../../src/state/app'
import { t } from '../../src/lib/ui-strings'

beforeEach(() => {
  useApp.setState({ lang: 'en' })
})

function open(onClose = vi.fn()) {
  render(
    <ModalShell title="HYPERSPACE" onClose={onClose}>
      <button>first</button>
      <button>second</button>
    </ModalShell>,
  )
  return onClose
}

describe('ModalShell', () => {
  it('announces itself as a dialog labelled by its own heading', () => {
    open()
    const dialog = screen.getByRole('dialog', { name: 'HYPERSPACE' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('moves focus into the panel so the keyboard starts inside it', () => {
    open()
    // the close button is the panel's first stop, which also means Escape and
    // Enter both get the visitor straight back out
    expect(screen.getByRole('button', { name: t('close', 'en') })).toHaveFocus()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = open()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when the backdrop, but not the panel, is clicked', async () => {
    const user = userEvent.setup()
    const onClose = open()

    await user.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()

    await user.click(screen.getByRole('dialog').parentElement!)
    expect(onClose).toHaveBeenCalled()
  })

  it('keeps Tab inside the panel instead of walking out into the map', async () => {
    const user = userEvent.setup()
    open()
    const close = screen.getByRole('button', { name: t('close', 'en') })
    const first = screen.getByRole('button', { name: 'first' })

    close.focus()
    await user.tab()
    expect(first).toHaveFocus()

    // ...and the last stop wraps back to the first
    screen.getByRole('button', { name: 'second' }).focus()
    await user.tab()
    expect(close).toHaveFocus()
  })

  it('gives focus back to whatever opened it', () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()

    const { unmount } = render(
      <ModalShell title="HYPERSPACE" onClose={vi.fn()}>
        <button>inside</button>
      </ModalShell>,
    )
    expect(screen.getByRole('button', { name: t('close', 'en') })).toHaveFocus()

    unmount()
    expect(opener).toHaveFocus()
    opener.remove()
  })
})
