import { useState } from 'react'
import { Icon } from '../ui/Icon'

const faqsLeft = [
  {
    question: 'En qué moneda se paga?',
    answer: 'Trabajamos principalmente en dólares americanos. Si estás en Ecuador, también podemos coordinar pagos locales de forma sencilla.',
  },
  {
    question: 'Cómo se paga?',
    answer: 'Normalmente se trabaja con un anticipo para empezar y pagos por avance. Si el proyecto es pequeño, se puede acordar una forma más simple.',
  },
  {
    question: 'Cuánto tiempo puede durar el trabajo?',
    answer: 'Depende del tamaño. Una landing puede tomar pocos días; un sistema con usuarios, inventario o pagos puede tomar varias semanas.',
  },
  {
    question: 'Se trabaja por día o por proyecto?',
    answer: 'Podemos trabajar por proyecto cerrado o por días/horas si necesitas apoyo continuo. Se conversa y se llega a un acuerdo justo para ambos.',
  },
]

const faqsRight = [
  {
    question: 'Tengo que tener todo claro antes de escribir?',
    answer: 'No. Puedes llegar con una idea general. Te ayudamos a ordenar funciones, prioridades y lo que realmente vale la pena construir primero.',
  },
  {
    question: 'Puedo pedir cambios durante el proceso?',
    answer: 'Sí. Los cambios pequeños se ajustan en el camino. Si aparece algo grande que no estaba en el alcance, se cotiza aparte antes de hacerlo.',
  },
  {
    question: 'Qué pasa después de entregar?',
    answer: 'Te explicamos cómo usar lo entregado y podemos seguir con soporte, mejoras o mantenimiento si quieres quedarte tranquilo.',
  },
  {
    question: 'Hacen solo páginas o también sistemas?',
    answer: 'Hacemos páginas, tiendas, sistemas internos, paneles administrativos, inventarios y aplicaciones a medida según el negocio.',
  },
]

function FAQItem({ faq, index, openIndex, onToggle }) {
  const isOpen = openIndex === index

  return (
    <div
      className={`group rounded-2xl border px-5 py-4 transition-colors duration-200 ${
        isOpen
          ? 'border-fizzia-500/35 bg-dark-900'
          : 'border-dark-800 bg-dark-900/70'
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(isOpen ? null : index)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 text-left text-base font-black text-white"
        aria-expanded={isOpen}
      >
        {faq.question}
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-950 text-dark-400 transition-all duration-200 ${
          isOpen ? 'rotate-180 text-fizzia-300' : ''
        }`}>
          <Icon name="expand_more" size={18} />
        </span>
      </button>
      {isOpen && (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-dark-300">
          {faq.answer}
        </p>
      )}
    </div>
  )
}

function FAQColumn({ items, offset, openIndex, onToggle }) {
  return (
    <div className="space-y-3">
      {items.map((faq, index) => (
        <FAQItem
          key={faq.question}
          faq={faq}
          index={offset + index}
          openIndex={openIndex}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="contacto" className="relative overflow-hidden bg-dark-950 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-fizzia-400">
            Preguntas frecuentes
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">
            Antes de empezar
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FAQColumn items={faqsLeft} offset={0} openIndex={openIndex} onToggle={setOpenIndex} />
          <FAQColumn items={faqsRight} offset={faqsLeft.length} openIndex={openIndex} onToggle={setOpenIndex} />
        </div>
      </div>
    </section>
  )
}
