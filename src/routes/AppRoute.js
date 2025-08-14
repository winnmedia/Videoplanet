'use client'

import { Route, Routes } from 'react-router-dom'
import dynamic from 'next/dynamic'

// Dynamic imports for code splitting
const Home = dynamic(() => import('../pages/Home'), { ssr: false })
const Login = dynamic(() => import('../pages/User/Login'), { ssr: false })
const Signup = dynamic(() => import('../pages/User/Signup'), { ssr: false })
const ResetPw = dynamic(() => import('../pages/User/ResetPw'), { ssr: false })
const ProjectCreate = dynamic(() => import('../pages/Cms/ProjectCreate'), { ssr: false })
const ProjectEdit = dynamic(() => import('../pages/Cms/ProjectEdit'), { ssr: false })
const ProjectView = dynamic(() => import('../pages/Cms/ProjectView'), { ssr: false })
const Calendar = dynamic(() => import('../pages/Cms/Calendar'), { ssr: false })
const Feedback = dynamic(() => import('../pages/Cms/Feedback'), { ssr: false })
const Elearning = dynamic(() => import('../pages/Cms/Elearning'), { ssr: false })
const CmsHome = dynamic(() => import('../pages/Cms/CmsHome'), { ssr: false })
const EmailCheck = dynamic(() => import('../pages/User/EmailCheck'), { ssr: false })
const FeedbackAll = dynamic(() => import('../pages/Cms/FeedbackAll'), { ssr: false })
const Privacy = dynamic(() => import('../pages/Privacy'), { ssr: false })
const Terms = dynamic(() => import('../pages/Terms'), { ssr: false })

export default function AppRoute() {
  const routes = [
    { path: '/', component: <Home /> },
    { path: '/Privacy', component: <Privacy /> },
    { path: '/Terms', component: <Terms /> },
    { path: '/Login', component: <Login /> },
    { path: '/Signup', component: <Signup /> },
    { path: '/ResetPw', component: <ResetPw /> },
    { path: '/Calendar', component: <Calendar /> },
    { path: '/ProjectCreate', component: <ProjectCreate /> },
    { path: '/ProjectEdit/:project_id', component: <ProjectEdit /> },
    { path: '/ProjectView/:project_id', component: <ProjectView /> },
    { path: '/CmsHome', component: <CmsHome /> },
    { path: '/Feedback/:project_id', component: <Feedback /> },
    { path: '/Elearning', component: <Elearning /> },
    { path: '/EmailCheck', component: <EmailCheck /> },
    { path: '/FeedbackAll', component: <FeedbackAll /> },
    {
      path: '*',
      element: (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          페이지를 찾을 수 없습니다. <br />
          URL을 확인해주세요.
        </div>
      ),
    },
  ]
  
  return (
    <Routes>
      {routes.map((route, index) => (
        <Route key={index} path={route.path} element={route.component} />
      ))}
    </Routes>
  )
}