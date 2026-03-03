'use client'

/** Tokenize pretty-printed JSON string and return JSX with syntax highlighting (for dark background). */
export default function ColorizedJson({ jsonString }) {
  if (!jsonString || typeof jsonString !== 'string') return null
  const tokens = []
  const re = /("(?:[^"\\]|\\.)*")|(-?\d+\.?\d*)|(true|false|null)|([{}\[\],:])|(\s+)/g
  let m
  while ((m = re.exec(jsonString)) !== null) {
    if (m[1]) tokens.push({ t: 'string', v: m[1] })
    else if (m[2]) tokens.push({ t: 'number', v: m[2] })
    else if (m[3]) tokens.push({ t: 'literal', v: m[3] })
    else if (m[4]) tokens.push({ t: 'punct', v: m[4] })
    else if (m[5]) tokens.push({ t: 'space', v: m[5] })
  }
  const keyClass = 'text-sky-300'
  const stringClass = 'text-emerald-400'
  const numberClass = 'text-amber-400'
  const literalClass = 'text-violet-400'
  const punctClass = 'text-gray-500'
  const spaceClass = 'text-gray-600'
  const parts = []
  let i = 0
  while (i < tokens.length) {
    const tok = tokens[i]
    if (tok.t === 'string') {
      const next = tokens[i + 1]
      const isKey = next && next.t === 'punct' && next.v === ':'
      parts.push(<span key={i} className={isKey ? keyClass : stringClass}>{tok.v}</span>)
    } else if (tok.t === 'number') parts.push(<span key={i} className={numberClass}>{tok.v}</span>)
    else if (tok.t === 'literal') parts.push(<span key={i} className={literalClass}>{tok.v}</span>)
    else if (tok.t === 'punct') parts.push(<span key={i} className={punctClass}>{tok.v}</span>)
    else if (tok.t === 'space') parts.push(<span key={i} className={spaceClass}>{tok.v.replace(/ /g, '\u00A0')}</span>)
    i++
  }
  return <>{parts}</>
}
