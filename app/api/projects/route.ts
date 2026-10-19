import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import {
  requireAuth,
  validateOrigin,
  parseRequestBody,
  generateId,
  stripHtml,
  type ProjectEntry,
  type ProjectBody,
  validateProjectBody,
} from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const FILENAME = 'projects'

/** GET /api/projects — list all projects (public). */
export async function GET(): Promise<NextResponse> {
  const projects = await readData<ProjectEntry[]>(FILENAME, [])
  return NextResponse.json(projects)
}

/** POST /api/projects — create a new project (auth + origin required). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const body = await parseRequestBody<ProjectBody>(request)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = validateProjectBody(body)
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 },
    )
  }

  const projects = await readData<ProjectEntry[]>(FILENAME, [])
  const newId = generateId(projects)

  const newProject: ProjectEntry = {
    id: newId,
    title: stripHtml(body.title!),
    description: stripHtml(body.description ?? ''),
    problem: stripHtml(body.problem!),
    solution: stripHtml(body.solution!),
    impact: stripHtml(body.impact!),
    tech: body.tech!.map((t) => stripHtml(t)),
    github: stripHtml(body.github ?? ''),
    live: stripHtml(body.live ?? ''),
    video: body.video
      ? {
          type: body.video.type,
          url: stripHtml(body.video.url),
          thumbnail: stripHtml(body.video.thumbnail ?? ''),
        }
      : undefined,
    badge: stripHtml(body.badge ?? ''),
    badgeColor: stripHtml(body.badgeColor ?? '#00D4FF'),
    category: stripHtml(body.category!),
  }

  projects.push(newProject)
  await writeData(FILENAME, projects)

  return NextResponse.json(newProject, { status: 201 })
}
