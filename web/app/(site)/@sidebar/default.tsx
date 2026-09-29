import { Sidebar } from '@/components/sidebar/Sidebar'

/**
 * The sidebar for every route that is not a case study. `default.tsx` is
 * what a parallel slot falls back to when no segment matches, the 404
 * included, so this is the column the whole site normally wears.
 */
export default function SidebarSlot() {
  return <Sidebar />
}
