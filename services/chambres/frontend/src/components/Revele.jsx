import { useEffect, useRef, useState } from "react";

export default function Revele({ children, delai = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setVisible(true);
          observateur.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`revele ${visible ? "visible" : ""}`}
      style={{ transitionDelay: `${delai}ms` }}
    >
      {children}
    </div>
  );
}