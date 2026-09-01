/* ------------------------------------------------------------------ */
/*  Animation primitives — single source of truth for all motion      */
/*  Built on Framer Motion with LazyMotion for tree-shaking           */
/* ------------------------------------------------------------------ */
import { createContext, useContext, useMemo } from 'react';
import {
  LazyMotion,
  domAnimation,
  m,
  AnimatePresence,
  useReducedMotion,
  useInView,
} from 'framer-motion';
import { useRef } from 'react';

/* ------------------------------------------------------------------ */
/*  Animation tokens — consistent timing across the app               */
/* ------------------------------------------------------------------ */
export const duration = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
};

export const ease = {
  out: [0.16, 1, 0.3, 1],       // ease-out-expo — entrances
  inOut: [0.4, 0, 0.2, 1],      // ease-in-out — state transitions
};

const stagger = {
  fast: 0.05,
  normal: 0.08,
  slow: 0.12,
};

/* ------------------------------------------------------------------ */
/*  Shared variants                                                   */
/* ------------------------------------------------------------------ */
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

export const slideDown = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

/* ------------------------------------------------------------------ */
/*  Reduced-motion context                                            */
/* ------------------------------------------------------------------ */
const ReducedMotionCtx = createContext(false);

export function useIsReducedMotion() {
  return useContext(ReducedMotionCtx);
}

/* ------------------------------------------------------------------ */
/*  MotionProvider — wraps the app                                    */
/* ------------------------------------------------------------------ */
export function MotionProvider({ children }) {
  const prefersReduced = useReducedMotion();
  const value = useMemo(() => !!prefersReduced, [prefersReduced]);

  return (
    <LazyMotion features={domAnimation} strict>
      <ReducedMotionCtx.Provider value={value}>
        {children}
      </ReducedMotionCtx.Provider>
    </LazyMotion>
  );
}

/* ------------------------------------------------------------------ */
/*  FadeIn — page/section entrance                                    */
/*  Wraps content in a fade + translate-up animation                  */
/* ------------------------------------------------------------------ */
export function FadeIn({
  children,
  delay = 0,
  duration: dur = duration.normal,
  className = '',
  as = 'div',
  ...rest
}) {
  const reduced = useIsReducedMotion();
  const Tag = m[as] || m.div;

  if (reduced) {
    const StaticTag = as;
    return <StaticTag className={className} {...rest}>{children}</StaticTag>;
  }

  return (
    <Tag
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ duration: dur, ease: ease.out, delay }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  StaggerList — staggers children entrance                          */
/* ------------------------------------------------------------------ */
export function StaggerList({
  children,
  staggerSpeed = 'normal',
  delay = 0,
  className = '',
  as = 'div',
  ...rest
}) {
  const reduced = useIsReducedMotion();
  const Tag = m[as] || m.div;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger[staggerSpeed] || stagger.normal,
        delayChildren: delay,
      },
    },
  };

  if (reduced) {
    const StaticTag = as;
    return <StaticTag className={className} {...rest}>{children}</StaticTag>;
  }

  return (
    <Tag
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  StaggerItem — child of StaggerList                                */
/* ------------------------------------------------------------------ */
export function StaggerItem({
  children,
  className = '',
  as = 'div',
  ...rest
}) {
  const reduced = useIsReducedMotion();
  const Tag = m[as] || m.div;

  if (reduced) {
    const StaticTag = as;
    return <StaticTag className={className} {...rest}>{children}</StaticTag>;
  }

  return (
    <Tag
      variants={fadeUp}
      transition={{ duration: duration.normal, ease: ease.out }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  ScrollReveal — viewport-triggered reveal                          */
/* ------------------------------------------------------------------ */
export function ScrollReveal({
  children,
  delay = 0,
  className = '',
  threshold = 0.15,
  once = true,
  as = 'div',
  ...rest
}) {
  const reduced = useIsReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: threshold, once });
  const Tag = m[as] || m.div;

  if (reduced) {
    const StaticTag = as;
    return <StaticTag ref={ref} className={className} {...rest}>{children}</StaticTag>;
  }

  return (
    <Tag
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ duration: duration.slow, ease: ease.out, delay }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  AnimatedAlert — Alert with enter/exit animation                   */
/* ------------------------------------------------------------------ */
export function AnimatedPresenceWrapper({ children, show, className = '' }) {
  const reduced = useIsReducedMotion();

  if (reduced) {
    return show ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence mode="wait">
      {show && (
        <m.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: duration.normal, ease: ease.out }}
          className={className}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  AnimatedTabContent — fade between tab contents                    */
/* ------------------------------------------------------------------ */
export function AnimatedTabContent({ activeKey, children, className = '' }) {
  const reduced = useIsReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={activeKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: duration.fast * 2, ease: ease.inOut }}
        className={className}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

/* Re-export what pages need from framer-motion */
export { m, AnimatePresence };
