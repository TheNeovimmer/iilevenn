const API_URL = process.env.NEXT_PUBLIC_API_URL

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<ApiResponse<T>> {
  const { token, ...init } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  return res.json()
}

export async function uploadFile<T>(
  path: string,
  file: File,
  token?: string,
): Promise<ApiResponse<T>> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })

  return res.json()
}

export function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}
