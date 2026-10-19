import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import {
  requireAuth,
  validateOrigin,
  parseRequestBody,
  stripHtml,
  type ProjectEntry,
  type ProjectBody,
  validateProjectBody,
} from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const FILENAME = 'projects'

type RouteContext = { params: { id: string } }

function parseId(raw: string): number | null {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

/** GET /api/projects/[id] — fetch a single project (public). */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const id = parseId(context.params.id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const projects = await readData<ProjectEntry[]>(FILENAME, [])
  const project = projects.find((p) => p.id === id)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json(project)
}

/** PUT /api/projects/[id] — update a project (auth + origin required). */
export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const id = parseId(context.params.id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
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
  const index = projects.findIndex((p) => p.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const updated: ProjectEntry = {
    id,
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

  projects[index] = updated
  await writeData(FILENAME, projects)

  return NextResponse.json(updated)
}

/** DELETE /api/projects/[id] — remove a project (auth + origin required). */
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const id = parseId(context.params.id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const projects = await readData<ProjectEntry[]>(FILENAME, [])
  const index = projects.findIndex((p) => p.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  projects.splice(index, 1)
  await writeData(FILENAME, projects)

  return new NextResponse(null, { status: 204 })
}
