// PlanetPanel is the HUD's honesty surface: 11 worlds carry no stats block at
// all, and a destroyed world must say so in the eras after its destruction.

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import PlanetPanel from '../../src/components/hud/PlanetPanel'
import { useApp } from '../../src/state/app'
import { favorites } from '../../src/lib/collections'
import { t } from '../../src/lib/ui-strings'
import type { CelestialBody } from '../../src/types/lore'

const BASE: CelestialBody = {
  id: 'test-world',
  kind: 'planet',
  names: { en: 'Test World', tr: 'Test Dünyası' },
  desc: { en: 'A world used by the test suite.', tr: 'Test paketinin kullandığı bir dünya.' },
  region: 'outer-rim',
  system: 'Test system',
  coordinates: 'R-16',
  appearances: ['anh'],
  renderRecipe: { archetype: 'desert', palette: { primary: '#c2a06a' } },
}

const renderPanel = (body: CelestialBody) =>
  render(
    <MemoryRouter>
      <PlanetPanel body={body} />
    </MemoryRouter>,
  )

beforeEach(() => {
  localStorage.clear()
  useApp.setState({ lang: 'en', era: 'empire' })
})

describe('a world with no stats block', () => {
  it('renders its identity without a stats row and without crashing', () => {
    renderPanel(BASE)
    expect(screen.getByRole('heading', { name: 'TEST WORLD' })).toBeInTheDocument()
    expect(screen.getByText('R-16')).toBeInTheDocument()
    expect(screen.queryByText(t('diameter', 'en'))).not.toBeInTheDocument()
    expect(screen.queryByText(t('population', 'en'))).not.toBeInTheDocument()
    expect(screen.queryByText(t('government', 'en'))).not.toBeInTheDocument()
  })

  it('still shows the rows it does have', () => {
    renderPanel(BASE)
    expect(screen.getByText(t('system', 'en'))).toBeInTheDocument()
    expect(screen.getByText('Test system')).toBeInTheDocument()
  })
})

describe('a world with stats', () => {
  const withStats: CelestialBody = {
    ...BASE,
    stats: {
      diameterKm: 10465,
      population: { en: '200,000', tr: '200.000' },
      government: { en: 'Hutt clans', tr: 'Hutt klanları' },
    },
  }

  it('renders every stat row', () => {
    renderPanel(withStats)
    expect(screen.getByText(t('diameter', 'en'))).toBeInTheDocument()
    expect(screen.getByText('10,465 km')).toBeInTheDocument()
    expect(screen.getByText('Hutt clans')).toBeInTheDocument()
  })

  it('formats the diameter for the active language', () => {
    useApp.setState({ lang: 'tr' })
    renderPanel(withStats)
    expect(screen.getByText('10.465 km')).toBeInTheDocument()
  })
})

describe('destruction notice', () => {
  const alderaanLike: CelestialBody = {
    ...BASE,
    destruction: {
      year: 0,
      yearLabel: '0 BBY',
      by: { en: 'Death Star superlaser', tr: 'Ölüm Yıldızı süperlazeri' },
      destroyedFromEra: 'empire',
      resultState: 'asteroid-field',
    },
  }

  it('is shown from the destruction era onward', () => {
    renderPanel(alderaanLike)
    expect(screen.getByText(/0 BBY — Death Star superlaser/)).toBeInTheDocument()
  })

  it('is absent in the eras before it', () => {
    useApp.setState({ era: 'clone-wars' })
    renderPanel(alderaanLike)
    expect(screen.queryByText(/0 BBY/)).not.toBeInTheDocument()
  })
})

describe('Legends badge', () => {
  it('marks a Legends world', () => {
    renderPanel({ ...BASE, continuity: 'legends' })
    expect(screen.getByText(t('legends', 'en'))).toBeInTheDocument()
  })

  it('leaves a canon world unmarked', () => {
    renderPanel(BASE)
    expect(screen.queryByText(t('legends', 'en'))).not.toBeInTheDocument()
  })
})

describe('favorite toggle', () => {
  it('flips the pressed state and persists the star', async () => {
    const user = userEvent.setup()
    renderPanel(BASE)
    const star = screen.getByRole('button', { name: t('addFavorite', 'en') })
    expect(star).toHaveAttribute('aria-pressed', 'false')

    await user.click(star)
    expect(favorites()).toEqual(['test-world'])
    const unstar = screen.getByRole('button', { name: t('removeFavorite', 'en') })
    expect(unstar).toHaveAttribute('aria-pressed', 'true')

    await user.click(unstar)
    expect(favorites()).toEqual([])
  })
})

describe('fun facts', () => {
  it('cycles through the facts of the active language', async () => {
    const user = userEvent.setup()
    renderPanel({
      ...BASE,
      funFacts: { en: ['First fact', 'Second fact'], tr: ['Birinci', 'İkinci'] },
    })
    expect(screen.getByText('First fact')).toBeInTheDocument()
    expect(screen.getByText(`${t('didYouKnow', 'en')} · 1/2`)).toBeInTheDocument()

    await user.click(screen.getByText('First fact'))
    expect(screen.getByText('Second fact')).toBeInTheDocument()

    // wraps back around rather than running off the end
    await user.click(screen.getByText('Second fact'))
    expect(screen.getByText('First fact')).toBeInTheDocument()
  })

  it('renders no fact panel when the world has none', () => {
    renderPanel(BASE)
    expect(screen.queryByText(new RegExp(t('didYouKnow', 'en')))).not.toBeInTheDocument()
  })
})
