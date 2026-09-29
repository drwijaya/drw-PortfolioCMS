/** Shared spatial navigation for game-owned controls. Native dialogs keep browser focus. */
export const controlSelector = 'button:not(:disabled),a[href],select:not(:disabled),input:not(:disabled):not([type=hidden]),summary'
export function availableControls(root: HTMLElement | null): HTMLElement[] {
  const scope=root?.querySelector<HTMLElement>('[data-game-modal]')||root
  return Array.from(scope?.querySelectorAll<HTMLElement>(controlSelector) || []).filter(element => {
    const style = getComputedStyle(element)
    return element.getClientRects().length > 0 && style.visibility !== 'hidden' && style.display !== 'none' && !element.closest('[inert],[hidden]')
  })
}
export function controlLabel(element?: HTMLElement) {
  if (!element) return 'Choose'
  const input = element as HTMLInputElement
  return element.getAttribute('aria-label') || input.labels?.[0]?.textContent?.trim() || element.textContent?.trim().replace(/\s+/g,' ').slice(0,60) || 'Choose'
}
export function adjustControl(element: HTMLElement, step: number) {
  if (element instanceof HTMLSelectElement) {
    const options = Array.from(element.options).filter(option => !option.disabled)
    const at = options.findIndex(option => option.value === element.value)
    element.value = options[Math.max(0,Math.min(options.length-1,at+step))]?.value ?? element.value
    element.dispatchEvent(new Event('change',{bubbles:true})); return true
  }
  if (element instanceof HTMLInputElement && element.type === 'range') {
    const value = Math.max(Number(element.min || 0),Math.min(Number(element.max || 100),Number(element.value)+step*Number(element.step === 'any' ? 1 : element.step || 5)))
    // Use the native setter so React sees the change rather than its value tracker.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set?.call(element,String(value))
    element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));return true
  }
  return false
}
export function neighbor(items: HTMLElement[], current: HTMLElement, x: number, y: number) {
  const direction = x ? x > 0 ? 'right' : 'left' : y > 0 ? 'down' : 'up'
  const explicit = current.getAttribute(`data-nav-${direction}`)
  if (explicit) return items.find(item => item.dataset.focusId === explicit) || current
  const a = current.getBoundingClientRect(), ax=a.x+a.width/2, ay=a.y+a.height/2
  let score=Infinity, result=current
  for (const item of items) {
    if(item===current) continue
    const b=item.getBoundingClientRect(), dx=b.x+b.width/2-ax,dy=b.y+b.height/2-ay
    const forward=x?dx*x:dy*y, cross=x?Math.abs(dy):Math.abs(dx)
    if(forward<1) continue
    const overlap=x?b.top<a.bottom&&b.bottom>a.top:b.left<a.right&&b.right>a.left
    const candidate=forward+cross*3+(overlap?0:1000)
    if(candidate<score){score=candidate;result=item}
  }
  return result
}
export function focusControl(element: HTMLElement, root: HTMLElement) {
  root.querySelectorAll('[data-game-focus]').forEach(node=>node.removeAttribute('data-game-focus'))
  element.setAttribute('data-game-focus',''); element.focus({preventScroll:true})
  let parent=element.parentElement
  while(parent && root.contains(parent)) {
    if(parent.scrollHeight>parent.clientHeight && /auto|scroll/.test(getComputedStyle(parent).overflowY)) {
      const box=parent.getBoundingClientRect(), item=element.getBoundingClientRect(), scale=box.height/parent.offsetHeight||1
      if(item.bottom>box.bottom) parent.scrollTop+=(item.bottom-box.bottom)/scale+4
      if(item.top<box.top) parent.scrollTop-=(box.top-item.top)/scale+4
    }
    parent=parent.parentElement
  }
}
