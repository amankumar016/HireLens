import { useEffect, useState, useRef } from "react";
import { animate } from "motion/react";

interface AnimatedScoreProps {
  value: number;
}

export default function AnimatedScore({ value }: AnimatedScoreProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef<number | null>(null);

  useEffect(() => {
    // If it's the first render, we can start counting from 0
    // If it's a subsequent update, we count from the previous value
    const startValue = prevValueRef.current !== null ? prevValueRef.current : 0;
    
    const controls = animate(startValue, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      }
    });

    prevValueRef.current = value;

    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}</span>;
}
