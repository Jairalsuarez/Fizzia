import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { y: 14, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 110, damping: 16 },
  },
}

export function PaymentSummary({ title, paymentMethod, items, total, children, className = '' }) {
  return (
    <div className={`w-full rounded-2xl border border-dark-700 bg-dark-900 text-white shadow-sm ${className}`}>
      <div className="border-b border-dark-800 p-5">
        <h3 className="text-xl font-bold leading-tight text-white">{title}</h3>
      </div>
      <div className="p-5">
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
            <span className="text-sm text-dark-400">Metodo de pago</span>
            <div className="flex min-w-0 items-center gap-2 text-right">
              {paymentMethod?.icon}
              <span className="truncate font-semibold text-white">{paymentMethod?.name || '-'}</span>
            </div>
          </motion.div>

          {items.map((item, index) => (
            <motion.div
              variants={itemVariants}
              key={`${item.label}-${index}`}
              className="flex items-start justify-between gap-4"
            >
              <span className="text-sm text-dark-400">{item.label}</span>
              <span className={`min-w-0 text-right font-semibold text-white ${item.valueClassName || ''}`}>
                {item.value}
              </span>
            </motion.div>
          ))}

          <motion.div variants={itemVariants}>
            <div className="border-t border-dashed border-dark-700" />
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center justify-between gap-4 pt-1">
            <span className="text-lg font-bold text-white">{total.label}</span>
            <span className="text-lg font-bold text-fizzia-300">{total.value}</span>
          </motion.div>

          {children && (
            <motion.div variants={itemVariants} className="pt-2">
              {children}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
