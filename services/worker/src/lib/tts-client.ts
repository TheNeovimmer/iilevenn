/**
 * TTS Service HTTP client.
 *
 * Calls POST /v1/synthesize on the Python TTS service (Kokoro).
 * Handles retries, timeouts, and error parsing.
 */

export interface SynthesizeInput {
  text: string
  voice_id: string
  language?: string
  output_format?: string
  speed?: number
}

export interface SynthesizeResult {
  audioBuffer: Buffer
  durationMs: number | null
  sampleRate: number | null
  engine: string | null
  voiceId: string | null
}

class TtsServiceError extends Error {
  statusCode: number
  retriable: boolean

  constructor(message: string, opts: { statusCode: number; retriable: boolean }) {
    super(message)
    this.name = 'TtsServiceError'
    this.statusCode = opts.statusCode
    this.retriable = opts.retriable
  }
}

const BASE_URL = process.env.TTS_SERVICE_URL || 'http://localhost:8000'
const TIMEOUT_MS = Number(process.env.TTS_REQUEST_TIMEOUT_MS || 60000)
const MAX_RETRIES = Number(process.env.TTS_REQUEST_RETRIES || 2)

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseIntHeader(headers: Headers, name: string): number | null {
  const value = headers.get(name)
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as Record<string, unknown>
    if (typeof json.detail === 'string') return json.detail
    if (json.message) return json.message as string
  } catch {
    // Fallback below
  }
  return response.statusText || 'TTS service request failed'
}

export async function synthesizeSpeech(input: SynthesizeInput): Promise<SynthesizeResult> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(`${BASE_URL}/v1/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      })

      if (!response.ok) {
        const message = await parseErrorMessage(response)
        const retriable = response.status >= 500 || response.status === 429
        throw new TtsServiceError(message, {
          statusCode: response.status,
          retriable,
        })
      }

      const buffer = Buffer.from(await response.arrayBuffer())

      return {
        audioBuffer: buffer,
        durationMs: parseIntHeader(response.headers, 'x-duration-ms'),
        sampleRate: parseIntHeader(response.headers, 'x-sample-rate'),
        engine: response.headers.get('x-engine'),
        voiceId: response.headers.get('x-voice-id'),
      }
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError'
      const serviceErr = err instanceof TtsServiceError ? err : null
      const retriable = serviceErr ? serviceErr.retriable : isAbort

      lastError = err instanceof Error ? err : new Error('Unknown TTS client error')

      if (!retriable || attempt === MAX_RETRIES) {
        break
      }

      await sleep(300 * (attempt + 1))
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError ?? new Error('TTS service request failed')
}
