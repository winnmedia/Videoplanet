'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { checkSession } from '@/lib/utils'

axios.defaults.withCredentials = true
axios.defaults.timeout = 30000

interface UseAxiosState {
  loading: boolean
  error: any
  data: any
}

interface UseAxiosOptions {
  url?: string
  method?: string
  data?: any
  [key: string]: any
}

const useAxios = (opts: UseAxiosOptions, axiosInstance = axios) => {
  const router = useRouter()
  const [state, setState] = useState<UseAxiosState>({
    loading: true,
    error: null,
    data: null,
  })
  const [trigger, setTrigger] = useState(0)
  
  const refetch = () => {
    setState({
      ...state,
      loading: true,
    })
    setTrigger(Date.now())
  }
  
  const fetchData = useCallback(() => {
    axiosInstance(opts)
      .then((data) => {
        setState({
          ...state,
          loading: false,
          data,
        })
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message === 'NEED_ACCESS_TOKEN'
        ) {
          if (checkSession()) {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('VGID')
            }
          }
          router.push('/login')
        } else {
          if (error.response && error.response.data) {
            if (typeof window !== 'undefined') {
              window.alert(error.response.data.message)
            }
          }
          setState({
            ...state,
            loading: false,
            error,
          })
        }
      })
  }, [opts, axiosInstance, router, state])
  
  useEffect(() => {
    if (!opts.url) {
      return
    }
    fetchData()
  }, [trigger])
  
  return { ...state, refetch }
}

export default useAxios