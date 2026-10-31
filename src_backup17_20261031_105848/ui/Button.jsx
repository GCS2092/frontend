import { motion } from 'motion/react'
export default function Button({ variant = 'primary', children, ...props }) {
  return (
    <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
      className={`ui-btn ui-btn-${variant}`} {...props}>
      {children}
    </motion.button>
  )
}
