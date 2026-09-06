import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/Auth'

const PrivateRoute = ({ children }) => {
    const { isAuth } = useAuth()

    if (!isAuth) {
        return <Navigate to="/auth/login" replace />
    }

    return children
}

export default PrivateRoute
