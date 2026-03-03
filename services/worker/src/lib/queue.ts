import amqplib from 'amqplib'

const TTS_QUEUE = 'tts_jobs'

let connection: Awaited<ReturnType<typeof amqplib.connect>> | null = null
let channel: Awaited<
  ReturnType<Awaited<ReturnType<typeof amqplib.connect>>['createChannel']>
> | null = null

async function getChannel() {
  if (channel) return channel

  const url = process.env.RABBITMQ_URL
  if (!url) throw new Error('RABBITMQ_URL environment variable is required')

  connection = await amqplib.connect(url)
  channel = await connection.createChannel()

  // Durable queue survives broker restarts
  await channel.assertQueue(TTS_QUEUE, { durable: true })

  // Process one job at a time
  await channel.prefetch(1)

  return channel
}

export async function publishJob(message: Record<string, unknown>) {
  const ch = await getChannel()
  ch.sendToQueue(TTS_QUEUE, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  })
}

export async function consumeJobs(handler: (message: Record<string, unknown>) => Promise<void>) {
  const ch = await getChannel()

  await ch.consume(TTS_QUEUE, async (msg) => {
    if (!msg) return

    try {
      const data = JSON.parse(msg.content.toString())
      await handler(data)
      ch.ack(msg)
    } catch (err) {
      console.error('Job processing failed:', err)
      // Don't requeue — failed jobs stay failed
      ch.nack(msg, false, false)
    }
  })

  console.log(`[queue] Consuming from "${TTS_QUEUE}"`)
}

export async function closeQueue() {
  if (channel) await channel.close()
  if (connection) await connection.close()
  channel = null
  connection = null
}
