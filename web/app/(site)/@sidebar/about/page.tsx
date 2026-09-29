import { Sidebar } from '@/components/sidebar/Sidebar'

/**
 * Explicit, even though `default.tsx` renders the same thing.
 *
 * On a SOFT navigation a parallel slot that matches nothing keeps whatever
 * it was showing; it does not fall back to `default.tsx`. Without this
 * file, walking out of a case study leaves the reader column behind.
 */
export default function SidebarSlot() {
  return <Sidebar />
}
