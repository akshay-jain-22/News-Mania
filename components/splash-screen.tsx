"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentText, setCurrentText] = useState(0)

  const texts = ["Welcome", "to the world", "of News!!!"]

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentText < texts.length - 1) {
        setCurrentText(currentText + 1)
      } else {
        // Wait a bit more then complete
        setTimeout(onComplete, 1000)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentText, onComplete])

  return (
    <motion.div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.h1
            key={currentText}
            className="text-4xl md:text-6xl lg:text-8xl font-bold text-white"
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 1.2 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
          >
            {texts[currentText]}
          </motion.h1>
        </AnimatePresence>

        {/* Animated dots */}
        <motion.div
          className="flex justify-center space-x-2 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>

        {/* Animated border */}
        <motion.div
          className="mt-12 w-64 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, delay: 1 }}
        />
      </div>

      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
