import { permanentRedirect } from 'next/navigation'

export default function LegacyProjectsIndex() {
  permanentRedirect('/works')
}
