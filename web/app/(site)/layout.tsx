import { SiteConfig, type MenuItem } from '@/components/cms/SiteConfig'
import { MENU } from '@/components/sidebar/nav-items'
import { readDocument,siteSettings } from '@/lib/cms/read'
import { CursorProvider } from '@/components/cursor/CursorProvider'
import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker'
import { MobileDock } from '@/components/mobile/MobileDock'
import { MobileHeader } from '@/components/mobile/MobileHeader'
import { RouteTransitionProvider } from '@/components/navigation/RouteTransition'
export default async function SiteLayout({children,sidebar}:{children:React.ReactNode;sidebar:React.ReactNode}){
 const [navigation,settings]=await Promise.all([readDocument('navigation','main'),siteSettings()])
 const items=(navigation?.data.items as MenuItem[]|undefined)??MENU.map(i=>({id:i.tab,label:i.label,href:i.href,visible:true,location:'main' as const}))
 return <SiteConfig items={items} analyticsEnabled={settings?.analyticsEnabled!==false} analyticsPublic={settings?.analyticsPublic!==false}>{settings?.analyticsEnabled!==false&&<AnalyticsTracker/>}<CursorProvider><RouteTransitionProvider><div className="shell">{sidebar}<main className="canvas">{children}</main><MobileHeader/><MobileDock/></div></RouteTransitionProvider></CursorProvider></SiteConfig>
}
