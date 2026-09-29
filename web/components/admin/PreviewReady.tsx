'use client';
import {useEffect} from 'react';
export function PreviewReady(){useEffect(()=>{window.parent.postMessage('cms-preview-ready',window.location.origin)},[]);return null}
