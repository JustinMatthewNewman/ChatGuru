import { type Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { Chat } from '@/components/chat'

export const runtime = 'edge'
export const preferredRegion = 'home'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {

  return {
    title: 'Chat'
  }
}

export default async function ChatPage({ params }: ChatPageProps) {


  return <Chat id={"100"} initialMessages={[]} />
}
