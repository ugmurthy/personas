import clsx from "clsx";
import Theme from '../components/Theme';
import { Link } from "@remix-run/react";

// eslint-disable-next-line react/prop-types
function NavBar({bg,appName="MY App"}) {
  //const {user} = useRouteLoaderData('root');
  const className = clsx("navbar",bg)
  return (
    <div className={className}>
  <div className="flex-1">
    <Link className="btn btn-ghost text-xl" to="/">{appName}</Link>
  </div>
  <div className="flex-none gap-2">
   
    <div className="form-control">
      <input name="search" type="text" placeholder="Search" className="input input-bordered w-24 md:w-auto" />
    </div>
    <Theme />
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar"> 
        <div className="w-10 rounded-full ring-2 ring-white" >
          <img alt="Tailwind CSS Navbar component" src="/avatar.png" />
        </div>
      </div>
      <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
        <li>
          <Link className="justify-between">
            Profile
          </Link>
        </li>
        <li><Link>Settings</Link></li>
        <li><Link to='/logout'>Logout</Link></li>
      </ul>
    </div>
  </div>
</div>
  )
}

export default NavBar