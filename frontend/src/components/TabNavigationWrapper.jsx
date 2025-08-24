import React, { useState } from 'react'
import { Play, BookOpen } from 'lucide-react'
import TestListPage from '../pages/TestListPage'
import LessonListPage from '../pages/LessonListPage'

const TabNavigationWrapper = () => {
  const [activeTab, setActiveTab] = useState('test') // 'test' or 'lessons'

  const tabs = [
    {
      id: 'test',
      label: 'Thi thử',
      icon: Play,
      component: TestListPage
    },
    {
      id: 'lessons', 
      label: 'Danh sách bài thi',
      icon: BookOpen,
      component: LessonListPage
    }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || TestListPage

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-center transition-all duration-200 relative ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <Icon className={`w-5 h-5 ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <span className={`text-xs font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {tab.label}
                    </span>
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pb-20">
        <ActiveComponent />
      </div>
    </div>
  )
}

export default TabNavigationWrapper
