import { Link } from "react-router-dom";
import { IoMenu } from "react-icons/io5";
import { useState } from "react";
import logo from '/steam.svg'

const Sidebar = () => {

    const [menu, setMenu] = useState(false)

  return (
    <div className="p-6">
        {!menu && (
            <div className="m-4">
        <button onClick={() => setMenu(!menu)}>
            <IoMenu className="text-primary text-3xl"/>
        </button>
        </div>
        )}
        {menu && ( 
        <div className=" bg-primary h-full bg-opacity-80 rounded-2xl p-6">
        <button onClick={() => setMenu(!menu)}>
            <IoMenu className="text-primary-content text-3xl"/>
        </button>
        <div className="flex flex-col justify-center items-center mx-12">
        <img src={logo} className=" h-10 mt-4 mb-10"/>
        <div className="flex flex-col items-center space-y-5 text-primary-content">
            <Link to="/">Home</Link>
            <Link to="/">Meet the Team</Link>
        </div>
        </div>
        </div>
        )}
    </div>
  )
}

export default Sidebar