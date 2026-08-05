// Two secondary widgets kept the habits ModalShell was built to end. The quiz
// drew its own overlay — no dialog role, no Escape, no focus trap — and marked
// right and wrong answers in border colour alone. The blueprint put its hotspots
// on bare SVG circles that a mouse could click and a keyboard could not reach.
// These tests hold both to the behaviour the tool panels already have.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HolocronQuiz from '../../src/components/HolocronQuiz'
import ShipBlueprint from '../../src/components/ShipBlueprint'
import TransmissionPlayer from '../../src/components/TransmissionPlayer'
import { useApp } from '../../src/state/app'

beforeEach(() => {
  useApp.setState({ lang: 'en' })
})

describe('HolocronQuiz', () => {
  it('announces itself as a labelled dialog', () => {
    render(<HolocronQuiz onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: /ARCHIVIST TRIAL/ })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('closes on Escape instead of trapping the visitor', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<HolocronQuiz onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('marks the verdict in text, not only in colour', async () => {
    const user = userEvent.setup()
    render(<HolocronQuiz onClose={vi.fn()} />)

    // first question's answer is the Millennium Falcon; pick a wrong one so both
    // marks have to appear
    await user.click(screen.getByRole('button', { name: 'Razor Crest' }))

    expect(screen.getByLabelText('Wrong answer')).toBeInTheDocument()
    expect(screen.getByLabelText('Correct answer')).toBeInTheDocument()
    expect(screen.getByText(/Wrong\. Correct answer: Millennium Falcon\./)).toBeInTheDocument()
  })
})

describe('ShipBlueprint', () => {
  it('keeps the decorative schematic out of the reading order', () => {
    const { container } = render(<ShipBlueprint shipId="millennium-falcon" lang="en" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('reaches every hotspot from the keyboard and says which one is open', async () => {
    const user = userEvent.setup()
    render(<ShipBlueprint shipId="millennium-falcon" lang="en" />)

    const cockpit = screen.getByRole('button', { name: /Cockpit/ })
    expect(cockpit).toHaveAttribute('aria-pressed', 'false')

    cockpit.focus()
    await user.keyboard('{Enter}')

    expect(cockpit).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/off-center cockpit pod/)).toBeInTheDocument()
  })
})

describe('TransmissionPlayer', () => {
  it('says the channel line is the archive s own wording', async () => {
    render(<TransmissionPlayer onClose={vi.fn()} />)
    expect(await screen.findByText(/HoloNet beacon/)).toBeInTheDocument()
    expect(screen.getByText(/archive label/)).toBeInTheDocument()
  })
})
