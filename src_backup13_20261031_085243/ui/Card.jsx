import { motion } from 'motion/react'
export default function Card({ children, delay = 0, className = '', ...props }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }} className={`ui-card ${className}`} {...props}>
      {children}
    </motion.div>
  )
}
