/**
 * @param {{
 *   categories: Array<{id:string,name:string,color:string}>,
 *   active: string|null,
 *   onChange: (id:string|null) => void,
 *   onManage: () => void,
 * }} props
 */
export default function CategoryFilter({ categories, active, onChange, onManage }) {
  if (categories.length === 0) {
    return (
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={onManage}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Agregar categoría
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mb-5">
      {/* "All" pill */}
      <button
        onClick={() => onChange(null)}
        className={`
          text-xs px-3 py-1.5 rounded-full border font-medium transition-all
          ${active === null
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }
        `}
      >
        Todas
      </button>

      {/* Category pills */}
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`
            text-xs px-3 py-1.5 rounded-full border font-medium transition-all
            ${active === cat.id
              ? 'text-white border-transparent shadow-sm'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }
          `}
          style={active === cat.id
            ? { backgroundColor: cat.color, borderColor: cat.color }
            : {}
          }
        >
          {active !== cat.id && (
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
              style={{ backgroundColor: cat.color }}
            />
          )}
          {cat.name}
        </button>
      ))}

      {/* Manage button */}
      <button
        onClick={onManage}
        className="text-xs text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-1 ml-1"
        title="Gestionar categorías"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
      </button>
    </div>
  )
}
