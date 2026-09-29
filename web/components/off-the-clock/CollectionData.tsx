'use client'
import { createContext,useContext } from 'react'
import { rooms } from '@/content/off-the-clock'
const CollectionContext=createContext(rooms)
export function CollectionData({value,children}:{value:typeof rooms;children:React.ReactNode}){return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>}
export function useRooms(){return useContext(CollectionContext)}
