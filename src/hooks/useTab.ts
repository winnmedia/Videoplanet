import { useState } from 'react'

const useTab = (initialTab: number = 0, allTabs?: any[]) => {
  const [currentTab, setCurrentTab] = useState(initialTab)
  
  const changeTab = (index: number) => {
    setCurrentTab(index)
  }
  
  const changeItem = (index: number) => {
    setCurrentTab(index)
  }
  
  const currentItem = allTabs ? allTabs[currentTab] : null
  
  return { currentTab, changeTab, currentItem, changeItem }
}

export default useTab