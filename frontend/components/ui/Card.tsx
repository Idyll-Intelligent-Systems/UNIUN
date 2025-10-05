export function Card({ children, className = '' }: any) {
  return (
    <div className={`rounded-xl overflow-hidden border border-gray-800 bg-gradient-to-b from-[#07070a] to-[#0b0b0f] ${className}`}>
      {children}
    </div>
  )
}

export default Card
