import { useState } from 'react'

type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
type Validator = (value: string) => boolean

const useInput = (initialValue: any, validator?: Validator) => {
  const [inputs, set_inputs] = useState(initialValue)
  
  const onChange = (event: ChangeEvent) => {
    const { name, value } = event.target
    let willUpdate = true
    
    if (typeof validator === 'function' && name !== 'description') {
      willUpdate = validator(value)
    }
    
    if (willUpdate) {
      set_inputs({
        ...inputs,
        [name]: value,
      })
    }
  }
  
  return { inputs, onChange, set_inputs }
}

export default useInput