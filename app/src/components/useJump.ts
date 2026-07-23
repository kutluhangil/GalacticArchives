// Navigate with a hyperspace transition (skipped under prefers-reduced-motion).

import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../state/app'

const JUMP_NAVIGATE_AT = 620
const JUMP_TOTAL = 1080

export function useJump() {
  const navigate = useNavigate()
  const setJumping = useApp((s) => s.setJumping)

  return useCallback(
    (path: string) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        navigate(path)
        return
      }
      setJumping(true)
      window.setTimeout(() => navigate(path), JUMP_NAVIGATE_AT)
      window.setTimeout(() => setJumping(false), JUMP_TOTAL)
    },
    [navigate, setJumping],
  )
}
