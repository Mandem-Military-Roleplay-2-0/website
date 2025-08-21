"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: "up" | "left" | "right" | "scale"
}

const animations = {
  up: { y: 40, opacity: 0 },
  left: { x: -40, opacity: 0 },
  right: { x: 40, opacity: 0 },
  scale: { scale: 0.9, opacity: 0 },
}

export function AnimatedCard({ children, className = "", delay = 0, direction = "up" }: AnimatedCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial={animations[direction]}
      animate={isInView ? { x: 0, y: 0, scale: 1, opacity: 1 } : animations[direction]}
      transition={{
        duration: 0.6,
        ease: "easeOut",
        delay: delay,
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
    >
      <Card
        className={cn(
          "h-full transition-all duration-300 hover:shadow-xl border-border/50 bg-card/80 backdrop-blur-sm",
          className,
        )}
      >
        {children}
      </Card>
    </motion.div>
  )
}
