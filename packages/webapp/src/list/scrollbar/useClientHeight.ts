import { useState, useEffect } from 'react'

import { useClientRect } from '../../utils/useClientRect'

export const useClientHeight = ref => {
  const rect = useClientRect(ref)

  const [height, setHeight] = useState(rect?.height || 0)

  useEffect(() => setHeight(rect?.height || 0), [rect])

  return height
}