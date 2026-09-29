'use client'
import { useSiteConfig } from './SiteConfig'
import { TransitionLink } from '@/components/navigation/RouteTransition'
export function AnalyticsStamp({text,year,className}:{text?:string;year:number;className:string}){const {analyticsPublic}=useSiteConfig();return analyticsPublic?<TransitionLink href="/analytics" className={className} aria-label="View public website analytics">{text??`View Analytics · ©${year}`}</TransitionLink>:<span className={className}>©{year}</span>}
