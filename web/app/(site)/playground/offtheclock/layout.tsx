import { CollectionData } from '@/components/off-the-clock/CollectionData'
import { collectionRooms } from '@/lib/cms/collections'
export default async function OffClockLayout({children}:{children:React.ReactNode}){return <CollectionData value={await collectionRooms()}>{children}</CollectionData>}
