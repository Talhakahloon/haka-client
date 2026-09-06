import { useAuth } from '@/context/Auth'
import { Space } from 'antd'
// import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Navbar = () => {

    const { isAuth, dispatch } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        dispatch({ type: "SET_LOGOUT" })
        navigate("/auth/login")
    }

    return (
        <header>
            <nav className="navbar navbar-expand-lg bg-primary navbar-dark">
                <div className="container">
                    <Link to="/" className="navbar-brand">Todos</Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link to="/" className="nav-link">Home</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/dashboard" className="nav-link">My Todos</Link>
                            </li>
                        </ul>
                        <div className="d-flex">
                            <Space>
                                {!isAuth
                                    ? <>
                                        <Link to="/auth/login" className="btn btn-success">Login</Link>
                                        <Link to="/auth/register" className="btn btn-info">Register</Link>
                                    </>
                                    : <>
                                        <Link to="/dashboard" className="btn btn-info">Dashboard</Link>
                                        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                                    </>
                                }
                            </Space>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

export default Navbar