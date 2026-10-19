// StarshipClassIcon — Vector iconography for starship classifications.
// Replaces generic Unicode emojis with Star Wars tactical hangar schematics.

interface StarshipClassIconProps {
  starshipClass?: string
  className?: string
}

export default function StarshipClassIcon({
  starshipClass,
  className = 'h-3.5 w-3.5 text-holo-cyan shrink-0',
}: StarshipClassIconProps) {
  switch (starshipClass) {
    case 'Starfighter':
      // X-Wing style cross-wing fighter
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 2L14 10L21 8L18 13L21 16L14 15L12 22L10 15L3 16L6 13L3 8L10 10L12 2Z" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      )

    case 'Light Freighter':
      // YT-1300 saucer with side cockpit pod and rear thruster
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <ellipse cx="11" cy="13" rx="8" ry="7" />
          <path d="M14 6L18 4L20 7L17 9" />
          <path d="M14 6L16 10" />
          <path d="M7 20L15 20" strokeWidth="2.5" />
          <path d="M11 9L11 11" />
        </svg>
      )

    case 'Capital Ship / Star Destroyer':
      // Imperial dagger wedge with command bridge tower
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <polygon points="12 3 21 20 3 20" />
          <rect x="9.5" y="13" width="5" height="3" rx="0.5" />
          <line x1="12" y1="10" x2="12" y2="13" />
        </svg>
      )

    case 'Super Star Destroyer':
      // Elongated star dreadnought wedge with triple layered ridge
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <polygon points="12 2 19 22 5 22" />
          <line x1="12" y1="5" x2="12" y2="19" strokeWidth="1.2" />
          <polygon points="12 7 15 16 9 16" fill="currentColor" fillOpacity="0.3" strokeWidth="1" />
        </svg>
      )

    case 'Star Cruiser / Carrier':
      // Sleek Mon Cala / Venator capital cruiser
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 3C8 8 6 15 7 21C10 20 14 20 17 21C18 15 16 8 12 3Z" />
          <line x1="12" y1="8" x2="12" y2="17" />
          <path d="M5 16L7 14" />
          <path d="M19 16L17 14" />
        </svg>
      )

    case 'Corvette / Blockade Runner':
      // CR90 blockade runner hammerhead and cylindrical engine block
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <rect x="7" y="3" width="10" height="4" rx="1.5" />
          <rect x="10" y="7" width="4" height="8" />
          <path d="M6 15L18 15L19 21L5 21Z" />
        </svg>
      )

    case 'Gunship / Transport':
      // LAAT Gunship twin engine pods and troop cabin
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M8 5L12 3L16 5V8L12 9L8 8Z" />
          <path d="M5 11L19 11L17 19H7L5 11Z" />
          <circle cx="5" cy="11" r="2" />
          <circle cx="19" cy="11" r="2" />
          <line x1="12" y1="9" x2="12" y2="19" />
        </svg>
      )

    case 'Patrol & Attack Craft':
      // Firespray / Slave I vertical rotating hull and stabilizer wings
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M9 3C9 3 12 2 15 3C17 6 17 13 15 16C13.5 18 10.5 18 9 16C7 13 7 6 9 3Z" />
          <path d="M7 11L3 13V15L7 14" />
          <path d="M17 11L21 13V15L17 14" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
        </svg>
      )

    case 'Interceptor Starfighter':
      // TIE Interceptor dagger wings and cockpit ball
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <line x1="9" y1="12" x2="6" y2="12" />
          <line x1="15" y1="12" x2="18" y2="12" />
          {/* Port dagger wing */}
          <path d="M6 12L2 4L4 7L4 17L2 20L6 12" />
          {/* Starboard dagger wing */}
          <path d="M18 12L22 4L20 7L20 17L22 20L18 12" />
        </svg>
      )

    default:
      // Generic starship chevron
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 2L19 21L12 17L5 21L12 2Z" />
        </svg>
      )
  }
}
