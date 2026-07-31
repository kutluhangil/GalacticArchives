// SettingsMenu owns the map-layer switches. The Legends one has the only real
// logic in this popover: switching it off has to pull the timeline with it.

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsMenu from '../../src/components/SettingsMenu'
import { useApp } from '../../src/state/app'
import { t } from '../../src/lib/ui-strings'

beforeEach(() => {
  localStorage.clear()
  useApp.setState({ lang: 'en', era: 'empire', quality: 'auto', legends: false, lanes: true })
})

const legendsLabel = t('legends', 'en')
const lanesLabel = t('lanes', 'en')

const openMenu = async () => {
  const user = userEvent.setup()
  render(<SettingsMenu />)
  await user.click(screen.getByRole('button', { name: t('settings', 'en') }))
  return user
}

describe('popover', () => {
  it('is closed until the gear is pressed', async () => {
    const user = userEvent.setup()
    render(<SettingsMenu />)
    const gear = screen.getByRole('button', { name: t('settings', 'en') })
    expect(gear).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('switch', { name: legendsLabel })).not.toBeInTheDocument()

    await user.click(gear)
    expect(gear).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('switch', { name: legendsLabel })).toBeInTheDocument()
  })

  it('closes on a pointer press outside itself', async () => {
    const user = await openMenu()
    await user.click(document.body)
    expect(screen.queryByRole('switch', { name: legendsLabel })).not.toBeInTheDocument()
  })
})

describe('quality tier', () => {
  it('writes the picked tier to the store and localStorage', async () => {
    const user = await openMenu()
    await user.click(screen.getByRole('button', { name: 'Low' }))
    expect(useApp.getState().quality).toBe('low')
    expect(localStorage.getItem('ga-quality')).toBe('low')
  })
})

describe('Legends switch', () => {
  it('reflects and flips the layer state', async () => {
    const user = await openMenu()
    const toggle = screen.getByRole('switch', { name: legendsLabel })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)
    expect(useApp.getState().legends).toBe(true)
    expect(screen.getByRole('switch', { name: legendsLabel })).toHaveAttribute('aria-checked', 'true')
  })

  it('pulls the timeline off the Legends-only era when switched off', async () => {
    useApp.setState({ legends: true, era: 'old-republic' })
    const user = await openMenu()
    await user.click(screen.getByRole('switch', { name: legendsLabel }))

    expect(useApp.getState().legends).toBe(false)
    expect(useApp.getState().era).toBe('empire')
  })

  it('leaves a canon era untouched when switched off', async () => {
    useApp.setState({ legends: true, era: 'new-republic' })
    const user = await openMenu()
    await user.click(screen.getByRole('switch', { name: legendsLabel }))

    expect(useApp.getState().era).toBe('new-republic')
  })
})

describe('hyperlane switch', () => {
  it('flips the lane layer and remembers it', async () => {
    const user = await openMenu()
    const toggle = screen.getByRole('switch', { name: lanesLabel })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await user.click(toggle)
    expect(useApp.getState().lanes).toBe(false)
    expect(localStorage.getItem('ga-lanes')).toBe('0')
  })

  it('leaves the era alone', async () => {
    useApp.setState({ era: 'clone-wars' })
    const user = await openMenu()
    await user.click(screen.getByRole('switch', { name: lanesLabel }))

    expect(useApp.getState().era).toBe('clone-wars')
  })
})
