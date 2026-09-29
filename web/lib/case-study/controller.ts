/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
// @ts-nocheck is retained because this controller began as a large DOM port.
// It is now adapted for canonical routes, progressive enhancement, injected
// motion dependencies, scoped cleanup, accessible lightbox behavior, and
// transform-based reading progress. New React-facing code remains strict.

/**
 * ==========================================================================
 * CaseStudy: scrollytelling controller for the long-form project view
 * ==========================================================================
 *
 * Drives one `.cs-root` block: scroll-spy for the sticky rail and index,
 * reading progress, reveal-on-scroll, figure lightbox, and jump/top controls.
 *
 * The standalone page is the scroll container, so every measurement goes
 * through the helper methods rather than being scattered across handlers.
 *
 *   const cs = new CaseStudy(rootEl);   // start
 *   cs.destroy();                       // detach every listener
 *
 * Wayfinding is NOT its job any more. The active chapter and the reading
 * progress are published to `reading` (lib/case-study/reading-store), and
 * the sidebar, a different React tree, renders them.
 */

import { reading } from './reading-store';

export default class CaseStudy {
  _gsapCtx: any
  _gsap: any
  _ScrollTrigger: any
  _lightboxZoom: any
  _lightboxReturnFocus: any
  _lightboxCloseCleanup: any
  _scrollLock: any
  _tail: any
  _teardown: any
  _ticking: any
  _zoomers: any
  activeId: any
  container: any
  lightbox: any
  lightboxCaption: any
  lightboxImg: any
  root: any
  scrollTarget: any
  scroller: any
  sections: any
  slug: string

  constructor(root: any, motion?: { gsap: any; ScrollTrigger: any }) {
    this.root = root;
    // Every publish to `reading` names its document. CaseStudy.tsx already
    // stamps the slug here, so nothing new has to be threaded through.
    this.slug = root?.dataset?.caseStudy || '';
    this._gsap = motion?.gsap;
    this._ScrollTrigger = motion?.ScrollTrigger;
    if (!this.root || this.root._csBound) return;
    this.root._csBound = true;

    // The nearest scrolling ancestor; null means the page itself scrolls.
    // The OS window chrome is gone; the page itself is the scroller.
    this.container = null;
    this.scroller = this.container || document.scrollingElement || document.documentElement;
    this.scrollTarget = this.container || window;

    this.sections = Array.from(root.querySelectorAll('[data-cs-section]'));

    this.activeId = null;
    this._ticking = false;
    this._teardown = [];
    this._scrollLock = null;

    this._onScroll = this._onScroll.bind(this);
    this._onKeydown = this._onKeydown.bind(this);

    this._zoomers = [];

    this._bindScroll();
    this._bindResize();
    // Before _bindReveal: this inserts a wrapper around every figure image,
    // and GSAP measures the DOM when it initialises.
    this._bindZoom();
    this._bindReveal();
    this._bindControls();
    this._bindLightbox();

    this._update();
  }

  /* ====================================================================
   * Scroll container helpers
   * ================================================================= */

  get scrollTop() {
    return this.container ? this.container.scrollTop : (window.scrollY || 0);
  }

  get viewportHeight() {
    return this.container ? this.container.clientHeight : window.innerHeight;
  }

  get scrollHeight() {
    return this.container ? this.container.scrollHeight : this.scroller.scrollHeight;
  }

  /**
   * Offset of an element from the top of the scrollable content.
   * `base` lets a caller measuring several elements in one pass reuse a single
   * container rect instead of forcing a layout read per element.
   */
  _offsetTop(el, base) {
    if (!this.container) {
      return el.getBoundingClientRect().top + (window.scrollY || 0);
    }
    const containerTop = base !== undefined
      ? base
      : this.container.getBoundingClientRect().top;
    return el.getBoundingClientRect().top - containerTop + this.container.scrollTop;
  }

  _scrollTo(top) {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto' : 'smooth';
    if (this.container) {
      this.container.scrollTo({ top: top, behavior: behavior });
    } else {
      window.scrollTo({ top: top, behavior: behavior });
    }
  }

  /* ====================================================================
   * Scroll spy + progress
   * ================================================================= */

  _bindScroll() {
    this.scrollTarget.addEventListener('scroll', this._onScroll, { passive: true });
    this._teardown.push(() => {
      this.scrollTarget.removeEventListener('scroll', this._onScroll);
    });
  }

  _onScroll() {
    if (this._ticking) return;
    this._ticking = true;
    requestAnimationFrame(() => {
      this._ticking = false;
      this._update();
    });
  }

  _update() {
    this._updateProgress();
    this._updateActiveSection();
  }

  /**
   * Clearance below the last sentence: the canvas reserves padding at the
   * foot of every page, and `scrollHeight` counts it. Measuring against the
   * raw document meant the bar was still short of 100% when the reader had
   * run out of words — 1.4% on the shortest case study, ~1% on the longest.
   *
   * Invisible while progress lived in a thin sidebar rail. It stops being
   * invisible the moment the bar is always on screen, so it is measured out
   * here rather than tolerated. Cached, because this is a layout read and
   * _updateProgress runs on every animation frame of every scroll.
   */
  _measureTail() {
    const canvas = this.container || document.querySelector('main.canvas');
    const pad = canvas ? parseFloat(getComputedStyle(canvas).paddingBottom) : 0;
    this._tail = Number.isFinite(pad) ? pad : 0;
  }

  _updateProgress() {
    if (this._tail === undefined) this._measureTail();
    // Floor at one viewport: a document shorter than the clearance would
    // divide by a negative and pin the bar at 100% from the first frame.
    const max = Math.max(this.scrollHeight - this.viewportHeight - this._tail, 1);
    const pct = Math.min(Math.max(this.scrollTop / max, 0), 1);
    reading.setProgress(this.slug, pct);
  }

  _updateActiveSection() {
    if (!this.sections.length) return;

    // A section is "current" once its top passes the upper third of the view.
    // Before that line reaches the first section, the hero is the overview.
    const line = this.scrollTop + this.viewportHeight * 0.34;
    const base = this.container ? this.container.getBoundingClientRect().top : undefined;
    let active = this._offsetTop(this.sections[0], base) > line
      ? null
      : this.sections[0];

    for (const section of this.sections) {
      if (this._offsetTop(section, base) <= line) active = section;
      else break;
    }

    // At the very bottom, always land on the last section so the rail agrees
    // with what the reader can actually see.
    if (this.scrollTop + this.viewportHeight >= this.scrollHeight - 4) {
      active = this.sections[this.sections.length - 1];
    }

    const id = active?.dataset?.csSection ?? null;
    if (id === this.activeId) return;
    this.activeId = id;
    reading.setActive(this.slug, id);
  }

  /* ====================================================================
   * Sizing
   * ================================================================= */

  /**
   * Only a WIDTH change can move a trigger, because the layout is a single
   * column. On iOS every URL-bar show/hide fires `resize` with a new height;
   * refreshing on those meant recalculating every trigger several times a
   * second while the reader was mid-scroll, which is what made the text
   * judder. Heights are left to `svh` in CSS.
   */
  _bindResize() {
    let lastWidth = window.innerWidth;

    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      // The canvas reserves a different foot at each breakpoint, so the
      // cached clearance is only valid for the width that measured it.
      this._tail = undefined;
      if (this._gsapCtx && this._ScrollTrigger) this._ScrollTrigger.refresh();
    };

    window.addEventListener('resize', onResize);
    this._teardown.push(() => window.removeEventListener('resize', onResize));

    // Walkthrough enhancement and comparison controls can change article
    // height without a window resize. Keep downstream triggers in sync.
    if ('ResizeObserver' in window && this.root.classList.contains('cs-storytelling')) {
      let height = this.root.getBoundingClientRect().height;
      let frame = 0;
      const observer = new ResizeObserver(([entry]) => {
        if (Math.abs(entry.contentRect.height - height) < 1) return;
        height = entry.contentRect.height;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          this._ScrollTrigger?.refresh();
          this._update();
        });
      });
      observer.observe(this.root);
      this._teardown.push(() => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      });
    }
  }

  /* ====================================================================
   * Reveal on scroll
   * ================================================================= */

  _bindReveal() {
    const targets = this.root.querySelectorAll('.cs-reveal');
    if (!targets.length) return;
    if (this._gsap && this._ScrollTrigger) this._bindGsap();
    else this._bindObserverReveal();
  }

  /**
   * The tier below GSAP: a narrow viewport, or a reader who asked for less
   * motion. They still get told a new chapter started: a fade, no travel,
   * no scroll-linked work at all. "Reduced motion replaces, it never
   * removes" (MOTION-SYSTEM rule 8).
   *
   * Only elements BELOW the fold are hidden to begin with, so nothing that
   * is already on screen blinks when this attaches.
   */
  _bindObserverReveal() {
    if (!('IntersectionObserver' in window)) return;
    // Reduced-motion readers receive the complete, stable document.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = Array.from(this.root.querySelectorAll('.cs-reveal'));
    if (!targets.length) return;

    // Let IntersectionObserver perform the geometry work asynchronously.
    // Off-screen targets become pending in its first callback; visible content
    // never gets hidden after first paint, so there is no attach-time flash.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
          return;
        }
        entry.target.classList.add('cs-pending');
      });
    }, { rootMargin: '0px 0px -8% 0px' });

    targets.forEach((target) => io.observe(target));
    this._teardown.push(() => {
      io.disconnect();
      targets.forEach((target) => {
        target.classList.remove('cs-pending', 'is-in');
      });
    });
  }

  /* ====================================================================
   * GSAP scrollytelling
   * ================================================================= */

  /**
   * Scroll-linked motion, layered so the page reads as one continuous scene:
   *   - section headers rise in, then drift as the section leaves
   *   - body blocks arrive in a stagger rather than all at once
   *   - figures parallax gently against the text
   *   - the rail's big number drifts with its section's progress
   *
   * Everything is registered against the case study's own scroll container.
   */
  _bindGsap() {
    const gsap = this._gsap;
    const ST = this._ScrollTrigger;
    if (!gsap || !ST) return;
    const scroller = this.container || undefined;

    // A phone or tablet toolbar sliding away is not a layout change worth
    // recalculating 200 triggers for. Without this, iOS refreshes mid-scroll.
    ST.config({ ignoreMobileResize: true });

    const mm = gsap.matchMedia();

    mm.add({
      isDesktop: '(min-width: 900px)',
      canAnimate: '(prefers-reduced-motion: no-preference)',
      hasPointer: '(hover: hover)',
    }, (context) => {
      const { isDesktop, canAnimate, hasPointer } = context.conditions;
      if (!canAnimate || !isDesktop) {
        this.root.classList.remove('cs-anim-gsap');
        return;
      }

      // Hand control to GSAP: the CSS reveal transition would fight tweens.
      this.root.classList.add('cs-anim-gsap');

      // --- chapter openers ------------------------------------------------
      // A chapter change is an event, so it gets an event's worth of motion:
      // the rule wipes across, the numeral and label arrive on it, then the
      // lead follows. One timeline per chapter, with the
      // ScrollTrigger on the timeline, never on the child tweens.
      this.sections.forEach((section) => {
        const num = section.querySelector('.cs-section-marker-num');
        const label = section.querySelector('.cs-section-marker-label');
        const rule = section.querySelector('.cs-section-marker-rule');
        const fill = section.querySelector('.cs-section-marker-fill');
        const head = section.querySelector('.cs-section-head');

        const opener = gsap.timeline({
          scrollTrigger: { trigger: section, scroller, start: 'top 74%', once: true },
        });
        const REVEAL = { clearProps: 'opacity,visibility,transform', ease: 'portfolio-out' };
        if (rule) opener.from(rule, { ...REVEAL, scaleX: 0, duration: 0.72 }, 0);
        if (num) opener.from(num, { ...REVEAL, autoAlpha: 0, y: 16, duration: 0.5 }, 0.06);
        if (label) opener.from(label, { ...REVEAL, autoAlpha: 0, y: 10, duration: 0.46 }, 0.14);
        if (head) opener.from(head, { ...REVEAL, autoAlpha: 0, y: 18, duration: 0.52 }, 0.2);

        // The opener plays once; this keeps answering "where am I in this
        // chapter?" for as long as the chapter is on screen.
        if (fill) {
          gsap.fromTo(fill, { scaleX: 0 }, {
            scaleX: 1, ease: 'none',
            scrollTrigger: {
              trigger: section, scroller,
              start: 'top 62%', end: 'bottom 62%', scrub: 0.35,
            },
          });
        }
      });

      // Fade the explanation as each narrative beat arrives. Evidence and
      // interactive controls stay visible; never hide a whole long chapter.
      // Other project types retain their existing chapter-level entrances.
      const storyBodies = this.root.classList.contains('cs-storytelling')
        ? this.root.querySelectorAll('.cs-beat-context')
        : this.root.querySelectorAll('.cs-section-body');
      storyBodies.forEach((body) => {
        if (!body) return;
        gsap.from(body, {
          autoAlpha: 0,
          duration: 0.35,
          ease: 'portfolio-out',
          clearProps: 'opacity,visibility',
          scrollTrigger: { trigger: body, scroller, start: 'top 86%', once: true },
        });
      });

      // --- figures parallax against the text ------------------------------
      // Touch scrolling runs on its own thread with momentum; a scrubbed
      // image fights it. Pointer devices only.
      if (hasPointer && !this.root.classList.contains('cs-storytelling')) {
        this.root.querySelectorAll('.cs-figure-frame').forEach((frame) => {
          const img = frame.querySelector('.cs-figure-img');
          if (!img) return;
          gsap.fromTo(img, { yPercent: -2 }, {
            yPercent: 2, ease: 'none',
            scrollTrigger: { trigger: frame, scroller, start: 'top bottom', end: 'bottom top', scrub: 0.35 },
          });
        });
      }

      // The opening block is intentionally not owned by this async GSAP
      // controller. CaseStudyScroll handles it before paint on browsers that
      // need a native-transition fallback, preventing a visible flash before
      // these dynamically imported modules arrive.
    }, this.root);

    // Late-loading figures change the page height; recompute once they land.
    const imgs = Array.from(this.root.querySelectorAll('img')).filter((i) => !i.complete);
    let pending = imgs.length;
    const settle = () => { if (--pending <= 0) ST.refresh(); };
    imgs.forEach((i) => {
      i.addEventListener('load', settle, { once: true });
      i.addEventListener('error', settle, { once: true });
    });
    if (!pending) ST.refresh();

    this._gsapCtx = mm;
    this._teardown.push(() => {
      imgs.forEach((i) => {
        i.removeEventListener('load', settle);
        i.removeEventListener('error', settle);
      });
      mm.revert();
      this.root.classList.remove('cs-anim-gsap');
    });
  }

  /* ====================================================================
   * Controls: jump, top, and lightbox keyboard handling
   * ================================================================= */

  _bindControls() {
    const onClick = (e) => {
      // Chapter jumps are plain anchors in the sidebar. The browser handles
      // them, with scroll-margin-top keeping the headline off the top edge.
      const top = e.target.closest('[data-cs-top]');
      if (top && this.root.contains(top)) {
        e.preventDefault();
        this._scrollTo(0);
      }
    };

    this.root.addEventListener('click', onClick);
    this._teardown.push(() => this.root.removeEventListener('click', onClick));

    document.addEventListener('keydown', this._onKeydown);
    this._teardown.push(() => document.removeEventListener('keydown', this._onKeydown));
  }

  _onKeydown(e) {
    if (!document.body.contains(this.root)) return;

    // Zoom keys, but only while the lightbox is the thing on screen.
    if (this._lightboxZoom && this.lightbox && !this.lightbox.hidden) {
      if (e.key === '+' || e.key === '=') { e.preventDefault(); this._lightboxZoom.zoomIn(); return; }
      if (e.key === '-' || e.key === '_') { e.preventDefault(); this._lightboxZoom.zoomOut(); return; }
      if (e.key === '0') { e.preventDefault(); this._lightboxZoom.reset(); return; }
    }

    if (e.key !== 'Escape') return;

    // Escape is scoped to the modal-like lightbox. Navigation stays explicit.
    if (this.lightbox && !this.lightbox.hidden) {
      e.preventDefault();
      this.closeLightbox();
    }
  }

  /* ====================================================================
   * Zoom: inline figures and the lightbox
   * ================================================================= */

  /**
   * Make one image pannable and zoomable inside its frame.
   *
   * The transform goes on a wrapper rather than the <img>, because GSAP
   * animates the image's own transform for the parallax. Writing to the same
   * property from two places would make them overwrite each other.
   *
   * @param {HTMLElement} frame  clipping container
   * @param {object} opts  { wheelNeedsModifier, max, compact }
   */
  _makeZoomable(frame, opts = {}) {
    const img = frame.querySelector('img');
    if (!img || frame._zoomBound) return null;
    frame._zoomBound = true;

    const MIN = opts.min || 1;
    const MAX = opts.max || 6;
    const STEP = 1.35;

    // Wrap the image so zoom and parallax own separate transforms.
    const pane = document.createElement('div');
    pane.className = 'cs-zoom-pane';
    img.parentNode.insertBefore(pane, img);
    pane.appendChild(img);

    // Inline figures render their toolbar in the server HTML so the affordance
    // is never missing while this controller loads. The lightbox creates the
    // same compact toolbar on demand. Both live inside the image frame.
    let ui = frame.querySelector('[data-inline-zoom-ui]');
    const ownsUi = !ui;
    if (!ui) {
      ui = document.createElement('div');
      ui.className = 'cs-zoom-ui';
      ui.innerHTML = `
        <button type="button" class="cs-zoom-btn" data-zoom-act="out" aria-label="Zoom out" title="Zoom out">&minus;</button>
        <button type="button" class="cs-zoom-reset cs-zoom-level" data-zoom-act="reset" data-zoom-level aria-label="Reset zoom" title="Reset zoom">100%</button>
        <button type="button" class="cs-zoom-btn" data-zoom-act="in" aria-label="Zoom in" title="Zoom in">+</button>
        <span class="cs-zoom-hint"></span>`;
      frame.appendChild(ui);
    }
    const levelEl = ui.querySelector('[data-zoom-level]');
    const hintEl = ui.querySelector('.cs-zoom-hint');
    // The pointer hint only means something once there is somewhere to drag
    // to, so it stays tied to `is-active`. The touch hint is an instruction
    // for a gesture with no visible control, so it stays put.
    if (hintEl) hintEl.textContent = opts.hint || 'drag to move';
    if (opts.persistHint && hintEl) ui.classList.add('has-hint');

    const state = { scale: 1, x: 0, y: 0, drag: null, moved: false };
    // Compact toolbar for the small gallery thumbnails.
    if (opts.compact) ui.classList.add('is-compact');

    const clampPan = () => {
      // Keep the image covering the frame: at scale s the image can travel at
      // most (s-1)/2 of the frame in each direction before an edge pulls in.
      const r = frame.getBoundingClientRect();
      const maxX = Math.max(0, (r.width * state.scale - r.width) / 2);
      const maxY = Math.max(0, (r.height * state.scale - r.height) / 2);
      state.x = Math.min(maxX, Math.max(-maxX, state.x));
      state.y = Math.min(maxY, Math.max(-maxY, state.y));
    };

    const apply = (animate, measure = true) => {
      if (measure) clampPan();
      pane.style.transition = animate ? 'transform 0.18s cubic-bezier(0.16,1,0.3,1)' : 'none';
      pane.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
      levelEl.textContent = Math.round(state.scale * 100) + '%';
      const zoomed = state.scale > 1.001;
      frame.classList.toggle('is-zoomed', zoomed);
      ui.classList.toggle('is-active', zoomed);
      // Nothing to zoom out of, nothing to reset, nothing to drag, at 1x.
      ui.querySelector('[data-zoom-act="out"]').disabled = !zoomed;
      ui.querySelector('[data-zoom-act="reset"]').disabled = !zoomed;
      ui.querySelector('[data-zoom-act="in"]').disabled = state.scale >= MAX - 0.001;
    };

    /** Zoom about a point given in client coordinates (or the centre). */
    const zoomTo = (next, clientX, clientY, animate = true) => {
      const target = Math.min(MAX, Math.max(MIN, next));
      if (Math.abs(target - state.scale) < 0.001) return;
      const r = frame.getBoundingClientRect();
      const cx = clientX === undefined ? r.left + r.width / 2 : clientX;
      const cy = clientY === undefined ? r.top + r.height / 2 : clientY;
      // Keep the point under the cursor fixed while the scale changes.
      const px = cx - r.left - r.width / 2 - state.x;
      const py = cy - r.top - r.height / 2 - state.y;
      const ratio = target / state.scale;
      state.x -= px * (ratio - 1);
      state.y -= py * (ratio - 1);
      state.scale = target;
      apply(animate);
    };

    const reset = () => { state.scale = 1; state.x = 0; state.y = 0; apply(true); };

    // ----- controls -----
    const onUiClick = (e) => {
      const btn = e.target.closest('[data-zoom-act]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const act = btn.dataset.zoomAct;
      if (act === 'in') zoomTo(state.scale * STEP);
      else if (act === 'out') zoomTo(state.scale / STEP);
      else reset();
    };
    ui.addEventListener('click', onUiClick);

    // ----- wheel -----
    // Inline figures require a modifier so the wheel still scrolls the page;
    // in the lightbox there is nothing behind to scroll, so plain wheel zooms.
    const onWheel = (e) => {
      if (opts.wheelNeedsModifier && !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomTo(state.scale * (e.deltaY < 0 ? STEP : 1 / STEP), e.clientX, e.clientY, false);
    };
    frame.addEventListener('wheel', onWheel, { passive: false });

    // ----- touch: pinch to zoom, double tap to toggle -----
    // The frame declares `touch-action: none`, so these are the only gestures
    // on it and none of them are competing with the page. Two fingers scale
    // about the point between them and drag with it; one finger falls through
    // to the pan handler below, which already refuses to move at 1x.
    const touches = new Map();
    let pinch = null;
    let lastTap = 0;

    const midpoint = () => {
      const [a, b] = [...touches.values()];
      return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        d: Math.hypot(a.x - b.x, a.y - b.y),
      };
    };

    const onTouchDown = (e) => {
      if (e.pointerType !== 'touch') return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 1) state.moved = false;
      if (touches.size === 2) {
        const m = midpoint();
        // Everything is measured from the moment the second finger lands, so
        // the gesture cannot accumulate rounding drift across a long pinch.
        pinch = { d: m.d || 1, scale: state.scale, cx: m.x, cy: m.y, x: state.x, y: state.y };
        state.moved = true;
      }
    };

    const onTouchMove = (e) => {
      if (e.pointerType !== 'touch' || !touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!pinch || touches.size < 2) return;
      e.preventDefault();
      const m = midpoint();
      const target = Math.min(MAX, Math.max(MIN, pinch.scale * (m.d / pinch.d)));
      const r = frame.getBoundingClientRect();
      const px = pinch.cx - r.left - r.width / 2 - pinch.x;
      const py = pinch.cy - r.top - r.height / 2 - pinch.y;
      const ratio = target / pinch.scale;
      state.x = pinch.x - px * (ratio - 1) + (m.x - pinch.cx);
      state.y = pinch.y - py * (ratio - 1) + (m.y - pinch.cy);
      state.scale = target;
      apply(false);
    };

    const onTouchUp = (e) => {
      if (e.pointerType !== 'touch') return;
      touches.delete(e.pointerId);
      if (touches.size < 2) pinch = null;
      if (e.type !== 'pointerup' || touches.size > 0) return;
      // Double tap is what a double click is, for the hand that has no
      // second button. A tap that panned or pinched is not a tap.
      const now = Date.now();
      if (!state.moved && now - lastTap < 320) {
        lastTap = 0;
        if (state.scale > 1.001) reset();
        else zoomTo(2.5, e.clientX, e.clientY);
      } else {
        lastTap = now;
      }
    };

    frame.addEventListener('pointerdown', onTouchDown);
    frame.addEventListener('pointermove', onTouchMove, { passive: false });
    frame.addEventListener('pointerup', onTouchUp);
    frame.addEventListener('pointercancel', onTouchUp);

    // ----- drag to pan -----
    // Move/up are bound on window rather than using setPointerCapture: capture
    // on the frame silently swallowed the move stream, and window listeners
    // also keep the drag alive when the cursor leaves the frame mid-gesture.
    const onPointerMove = (e) => {
      if (!state.drag || pinch) return;
      const dx = e.clientX - state.drag.x;
      const dy = e.clientY - state.drag.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) state.moved = true;
      state.x = state.drag.ox + dx;
      state.y = state.drag.oy + dy;
      apply(false);
    };
    const onPointerUp = () => {
      if (!state.drag) return;
      state.drag = null;
      frame.classList.remove('is-panning');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
    const onPointerDown = (e) => {
      if (state.scale <= 1.001 || e.button !== 0) return;
      if (e.target.closest('[data-zoom-act], .cs-figure-zoom')) return;
      e.preventDefault();
      state.drag = { x: e.clientX, y: e.clientY, ox: state.x, oy: state.y };
      state.moved = false;
      frame.classList.add('is-panning');
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    };
    frame.addEventListener('pointerdown', onPointerDown);

    // ----- double click toggles -----
    const onDblClick = (e) => {
      if (e.target.closest('[data-zoom-act], .cs-figure-zoom')) return;
      e.preventDefault();
      e.stopPropagation();
      if (state.scale > 1.001) reset();
      else zoomTo(2.5, e.clientX, e.clientY);
    };
    frame.addEventListener('dblclick', onDblClick);

    const controller = {
      frame,
      reset,
      zoomIn: () => zoomTo(state.scale * STEP),
      zoomOut: () => zoomTo(state.scale / STEP),
      get scale() { return state.scale; },
      /** True when a pan actually moved; used to suppress the click-to-open. */
      get dragged() { return state.moved; },
      destroy() {
        ui.removeEventListener('click', onUiClick);
        frame.removeEventListener('wheel', onWheel);
        frame.removeEventListener('pointerdown', onTouchDown);
        frame.removeEventListener('pointermove', onTouchMove);
        frame.removeEventListener('pointerup', onTouchUp);
        frame.removeEventListener('pointercancel', onTouchUp);
        frame.removeEventListener('pointerdown', onPointerDown);
        onPointerUp();   // drops any window listeners left by an active drag
        frame.removeEventListener('dblclick', onDblClick);
        if (ownsUi) {
          ui.remove();
        } else {
          ui.classList.remove('is-active', 'has-hint');
          levelEl.textContent = '100%';
          ui.querySelector('[data-zoom-act="out"]').disabled = true;
          ui.querySelector('[data-zoom-act="reset"]').disabled = true;
          ui.querySelector('[data-zoom-act="in"]').disabled = false;
        }
        if (pane.parentNode) {
          pane.parentNode.insertBefore(img, pane);
          pane.remove();
        }
        frame._zoomBound = false;
      },
    };
    // Scale 1 with a zero offset is already clamped. Avoid a synchronous
    // layout read while progressively enhancing a newly visible figure.
    apply(false, false);
    this._zoomers.push(controller);
    return controller;
  }

  /** Attach inline zoom to every server-rendered figure toolbar. */
  _bindZoom() {
    const frames = Array.from(
      this.root.querySelectorAll('.cs-figure-frame')
    );
    const bind = (frame) => {
      this._makeZoomable(frame, {
        wheelNeedsModifier: true,
        max: 5,
        compact: true,
      });
    };
    frames.forEach(bind);

    this._teardown.push(() => {
      this._zoomers.forEach((zoomer) => zoomer.destroy());
      this._zoomers = [];
    });
  }

  /* ====================================================================
   * Figure lightbox
   * ================================================================= */

  _bindLightbox() {
    this.lightbox = this.root.querySelector('[data-cs-lightbox]');
    if (!this.lightbox) return;

    this.lightboxImg = this.lightbox.querySelector('[data-cs-lightbox-img]');
    this.lightboxCaption = this.lightbox.querySelector('[data-cs-lightbox-caption]');

    // The overlay must cover the *visible frame*, not the document. Left inside
    // .cs-root it would stretch over the full ~18,000px of scrollable content
    // and centre the image thousands of pixels off-screen, leaving an empty
    // overlay. So re-home it on the element that actually bounds the viewport.
    const host = this.root.closest('.os-window')
              || this.root.closest('.mobile-window-overlay')
              || document.body;

    host.appendChild(this.lightbox);
    this.lightbox.classList.toggle('is-fixed', host === document.body);
    this._teardown.push(() => {
      if (this.lightbox && this.lightbox.parentNode) {
        this.lightbox.parentNode.removeChild(this.lightbox);
      }
    });

    // Opening is delegated from the content; closing is bound to the overlay
    // itself, which no longer lives inside .cs-root.
    const onOpen = (e) => {
      const trigger = e.target.closest('.cs-figure-img, .cs-figure-zoom');
      if (!trigger || !this.root.contains(trigger)) return;
      const frame = trigger.closest('.cs-figure-frame');
      const img = frame && frame.querySelector('.cs-figure-img');
      if (!img) return;

      // The expand button always opens. Clicking the image itself only opens
      // while it sits at 1×. Once zoomed, a click is the end of a pan.
      if (!e.target.closest('.cs-figure-zoom')) {
        const z = this._zoomers.find((c) => c.frame === frame);
        if (z && (z.scale > 1.001 || z.dragged)) return;
      }

      e.preventDefault();
      this.openLightbox(img.dataset.zoom || img.src, img.dataset.zoomCaption || '', {
        w: img.naturalWidth,
        h: img.naturalHeight,
      });
    };

    const onClose = (e) => {
      if (e.target.closest('.cs-lightbox-close') || e.target === this.lightbox) {
        this.closeLightbox();
      }
    };

    this.root.addEventListener('click', onOpen);
    this.lightbox.addEventListener('click', onClose);
    this._teardown.push(() => {
      this.root.removeEventListener('click', onOpen);
      this.lightbox.removeEventListener('click', onClose);
    });
  }

  /**
   * The page must not scroll behind an open figure.
   *
   * Measured on a phone before this existed: opening a figure at scrollY
   * 2669 and flicking left the reader at 2600 once it closed, looking at a
   * different paragraph than the one they had opened the picture from. On a
   * long case study a few flicks put them chapters away.
   *
   * `overflow: hidden` on the documentElement rather than a
   * `position: fixed` body: the latter is the older trick and it drops the
   * scroll position, which then has to be restored by hand and jumps by a
   * pixel or two every time. Safari has honoured this since 16.
   *
   * The gutter compensation is for pointer platforms only. Removing the
   * scrollbar reflows the document under the overlay, and the reader sees
   * the whole page twitch sideways as the picture opens.
   */
  _lockScroll() {
    if (this._scrollLock) return;
    const root = document.documentElement;
    const gutter = window.innerWidth - root.clientWidth;
    this._scrollLock = {
      overflow: root.style.overflow,
      paddingRight: root.style.paddingRight,
    };
    root.style.overflow = 'hidden';
    if (gutter > 0) root.style.paddingRight = `${gutter}px`;
  }

  _unlockScroll() {
    if (!this._scrollLock) return;
    const root = document.documentElement;
    root.style.overflow = this._scrollLock.overflow;
    root.style.paddingRight = this._scrollLock.paddingRight;
    this._scrollLock = null;
  }

  /**
   * Give the overlay the picture's proportions.
   *
   * The phone stage reads `--lightbox-ratio` (see case-study.css). The
   * figure that was clicked has usually already decoded, so its own
   * dimensions arrive with the click and the overlay opens the right shape;
   * the load listener is the fallback for one that has not.
   */
  _setLightboxRatio(ratio) {
    const write = (w, h) => {
      if (!w || !h) return false;
      this.lightbox.style.setProperty('--lightbox-ratio', `${w} / ${h}`);
      return true;
    };
    if (ratio && write(ratio.w, ratio.h)) return;
    const img = this.lightboxImg;
    if (img.complete && write(img.naturalWidth, img.naturalHeight)) return;
    const wanted = img.src;
    img.addEventListener('load', () => {
      if (img.src === wanted) write(img.naturalWidth, img.naturalHeight);
    }, { once: true });
  }

  openLightbox(src, caption, ratio) {
    if (!this.lightbox) return;
    this._lightboxCloseCleanup?.();
    this._lightboxCloseCleanup = null;
    this._lightboxReturnFocus = document.activeElement;
    this.lightboxImg.src = src;
    this.lightboxImg.alt = caption || '';
    this.lightboxCaption.textContent = caption || '';
    this.lightbox.hidden = false;
    this._setLightboxRatio(ratio);
    this._lockScroll();
    // Commit the hidden state first so the CSS transition has a real origin.
    void this.lightbox.offsetWidth;
    this.lightbox.classList.add('is-open');
    requestAnimationFrame(() => {
      this.lightbox.querySelector('.cs-lightbox-close')?.focus();
    });

    if (this._lightboxZoom) {
      this._lightboxZoom.destroy();
      this._zoomers = this._zoomers.filter((z) => z !== this._lightboxZoom);
      this._lightboxZoom = null;
    }
    const stage = this.lightbox.querySelector('.cs-lightbox-stage');
    if (stage) {
      const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      this._lightboxZoom = this._makeZoomable(stage, {
        wheelNeedsModifier: false,
        max: 8,
        // On touch this is the only place the gesture is named, and it has to
        // be readable before the reader has tried anything, so it does not
        // wait for `is-active` the way the pointer hint does.
        hint: coarse ? 'pinch or double tap to zoom' : undefined,
        persistHint: coarse,
      });
    }
  }

  _finishLightboxClose() {
    if (!this.lightbox) return;
    this._lightboxCloseCleanup?.();
    this._lightboxCloseCleanup = null;
    if (this._lightboxZoom) {
      this._lightboxZoom.destroy();
      this._zoomers = this._zoomers.filter((z) => z !== this._lightboxZoom);
      this._lightboxZoom = null;
    }
    this.lightbox.classList.remove('is-open');
    this.lightbox.hidden = true;
    this.lightboxImg.src = '';
    // _finishLightboxClose is the one path every close reaches, the
    // immediate one in destroy() included, so the lock cannot outlive the
    // overlay and leave the site unscrollable.
    this._unlockScroll();
    if (this._lightboxReturnFocus && document.body.contains(this._lightboxReturnFocus)) {
      this._lightboxReturnFocus.focus();
    }
    this._lightboxReturnFocus = null;
  }

  closeLightbox(immediate = false) {
    if (!this.lightbox || this.lightbox.hidden) return;
    if (immediate) {
      this._finishLightboxClose();
      return;
    }

    this._lightboxCloseCleanup?.();
    this.lightbox.classList.remove('is-open');

    const finish = () => this._finishLightboxClose();
    const onEnd = (event) => {
      if (event.target === this.lightbox && event.propertyName === 'opacity') {
        finish();
      }
    };
    const timer = window.setTimeout(finish, 320);
    this.lightbox.addEventListener('transitionend', onEnd);
    this._lightboxCloseCleanup = () => {
      window.clearTimeout(timer);
      this.lightbox?.removeEventListener('transitionend', onEnd);
    };
  }

  /* ====================================================================
   * Teardown
   * ================================================================= */

  destroy() {
    if (this.lightbox && !this.lightbox.hidden) this.closeLightbox(true);
    // The constructor bails early on a double-mount, so _teardown may not exist.
    (this._teardown || []).forEach((fn) => {
      try { fn(); } catch { /* listener already gone */ }
    });
    this._teardown = [];
    reading.reset();
    if (this.root) this.root._csBound = false;
  }
}

/**
 * Boot every un-initialised `.cs-root` inside `scope`, tearing down the
 * previous instance first. Safe to call repeatedly.
 */
