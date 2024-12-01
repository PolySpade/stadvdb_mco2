import Landing from '../pages/Landing'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './Layout'
import About from '../pages/About'

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                path: "", 
                element: <Landing />
            },
            {
                path: "about",
                element: <About />
            }
        ]
    },


])

const AppRoutes = () => {
    return <RouterProvider router={router}/>
}

export default AppRoutes