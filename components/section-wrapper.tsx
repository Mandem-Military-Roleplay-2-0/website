"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { cn } from "@/lib/utils"

interface SectionWrapperProps {
  children: React.ReactNode
  className?: string
  variant?: "light" | "medium" | "dark" | "darker" | "darkest"
  delay?: number
}

const variantClasses = {
  light: "bg-yellow-light text-yellow-darkest",
  medium: "bg-yellow-medium text-yellow-darkest",
  dark: "bg-yellow-dark text-yellow-light",
  darker: "bg-yellow-darker text-yellow-light",
  darkest: "bg-yellow-darkest text-yellow-light",
}

export function SectionWrapper({ children, className = "", variant = "darkest", delay = 0 }: SectionWrapperProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
        delay: delay,
      }}
      className={cn("relative py-16 md:py-24", variantClasses[variant], className)}
    >
      {children}
    </motion.section>
  )
}
