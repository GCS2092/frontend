import { motion } from 'motion/react'
export default function PageTransition({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      {children}
    </motion.div>
  )
}
