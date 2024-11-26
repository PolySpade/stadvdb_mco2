import Landing from '../pages/Landing'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './Layout'

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                path: "", 
                element: <Landing />
            }
        ]
    }


])

const AppRoutes = () => {
    return <RouterProvider router={router}/>
}

export default AppRoutes