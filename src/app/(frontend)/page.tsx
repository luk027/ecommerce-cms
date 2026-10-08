import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-between overflow-hidden bg-black px-6 py-11 font-sans text-lg leading-8 text-white sm:px-11">
      <div className="flex grow flex-col items-center justify-center">
        <picture>
          <source srcSet="https://raw.githubusercontent.com/payloadcms/payload/3.x/packages/ui/src/assets/payload-favicon.svg" />
          <Image
            alt="Payload Logo"
            height={65}
            src="https://raw.githubusercontent.com/payloadcms/payload/3.x/packages/ui/src/assets/payload-favicon.svg"
            width={65}
          />
        </picture>
        {!user && (
          <h1 className="my-6 text-center text-4xl leading-tight font-bold sm:my-10 sm:text-5xl lg:text-6xl">
            Welcome to your new project.
          </h1>
        )}
        {user && (
          <h1 className="my-6 text-center text-4xl leading-tight font-bold sm:my-10 sm:text-5xl lg:text-6xl">
            Welcome back, {user.email}
          </h1>
        )}
        <div className="flex items-center gap-3">
          <a
            className="rounded border border-white bg-white px-2 py-1 text-black no-underline"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            target="_blank"
          >
            Go to admin panel
          </a>
          <a
            className="rounded border border-white bg-black px-2 py-1 text-white no-underline"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
        </div>
      </div>
    </main>
  )
}
