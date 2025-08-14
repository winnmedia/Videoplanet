import { Route, Routes } from 'react-router-dom'
import Home from 'page/Home'
import Login from 'page/User/Login'
import Signup from 'page/User/Signup'
import ResetPw from 'page/User/ResetPw'
import ProjectCreate from 'page/Cms/ProjectCreate'
import ProjectEdit from 'page/Cms/ProjectEdit'
import ProjectView from 'page/Cms/ProjectView'
import Calendar from 'page/Cms/Calendar'
import Feedback from 'page/Cms/Feedback'
import Elearning from 'page/Cms/Elearning'
import CmsHome from 'page/Cms/CmsHome'
import EmailCheck from 'page/User/EmailCheck'
import FeedbackAll from 'page/Cms/FeedbackAll'
import Privacy from 'page/Privacy'
import Terms from 'page/Terms'

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
        <div>
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
