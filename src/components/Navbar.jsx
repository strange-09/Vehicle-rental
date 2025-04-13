import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
import { FaCar, FaMotorcycle, FaBars, FaTimes, FaUser, FaCalendarAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../firebase/auth';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const { user, isAdmin } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    closeMenu(); // Close menu if open
    try {
      await signOutUser();
      navigate('/'); // Redirect to home page after successful logout
    } catch (error) {
      console.error('Failed to log out:', error);
      // Optionally display an error message to the user
    }
  };

  const isActive = (path) => {
    // Handle '/' specifically to avoid matching sub-routes like '/cars'
    if (path === '/') {
      return location.pathname === '/' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600';
    }
    return location.pathname.startsWith(path) ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600';
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <div className="flex items-center">
              {/* Using Tailwind classes directly for colors */}
              <FaCar className="text-blue-600 text-2xl" /> 
              <FaMotorcycle className="text-green-500 text-2xl ml-1" /> 
            </div>
            <span className="text-xl font-bold text-gray-800">RideRental</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link to="/" className={`${isActive('/')} transition-colors duration-300 text-sm lg:text-base`}>
              Home
            </Link>
            <Link to="/cars" className={`${isActive('/cars')} transition-colors duration-300 text-sm lg:text-base`}>
              Cars
            </Link>
            <Link to="/bikes" className={`${isActive('/bikes')} transition-colors duration-300 text-sm lg:text-base`}>
              Bikes
            </Link>
            <Link to="/about" className={`${isActive('/about')} transition-colors duration-300 text-sm lg:text-base`}>
              About
            </Link>
            <Link to="/contact" className={`${isActive('/contact')} transition-colors duration-300 text-sm lg:text-base`}>
              Contact
            </Link>
            {user ? (
              <>
                <Link to="/my-bookings" className={`${isActive('/my-bookings')} transition-colors duration-300 flex items-center text-sm lg:text-base`}>
                  <FaCalendarAlt className="mr-1" />
                  My Bookings
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`${isActive('/admin')} transition-colors duration-300 flex items-center text-sm lg:text-base`}
                  >
                    Admin
                  </Link>
                )}
                <button 
                  onClick={handleLogout} // Use the updated handler
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-300 flex items-center text-sm lg:text-base"
                >
                  <FaUser className="mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`${isActive('/login')} transition-colors duration-300 text-sm lg:text-base`}>
                  Login
                </Link>
                <Link to="/register" className={`${isActive('/register')} transition-colors duration-300 text-sm lg:text-base bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700`}>
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <FaTimes className="text-2xl" />
              ) : (
                <FaBars className="text-2xl" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3 pt-3">
              <Link
                to="/"
                className={`${isActive('/')} block px-3 py-2 rounded hover:bg-gray-100`}
                onClick={closeMenu}
              >
                Home
              </Link>
              <Link
                to="/cars"
                className={`${isActive('/cars')} block px-3 py-2 rounded hover:bg-gray-100`}
                onClick={closeMenu}
              >
                Cars
              </Link>
              <Link
                to="/bikes"
                className={`${isActive('/bikes')} block px-3 py-2 rounded hover:bg-gray-100`}
                onClick={closeMenu}
              >
                Bikes
              </Link>
              <Link
                to="/about"
                className={`${isActive('/about')} block px-3 py-2 rounded hover:bg-gray-100`}
                onClick={closeMenu}
              >
                About
              </Link>
              <Link
                to="/contact"
                className={`${isActive('/contact')} block px-3 py-2 rounded hover:bg-gray-100`}
                onClick={closeMenu}
              >
                Contact
              </Link>
              
              <hr className="my-2"/>

              {user ? (
                <>
                  <Link
                    to="/my-bookings"
                    className={`${isActive('/my-bookings')} block px-3 py-2 rounded hover:bg-gray-100 flex items-center`}
                    onClick={closeMenu}
                  >
                    <FaCalendarAlt className="mr-2" />
                    My Bookings
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={`${isActive('/admin')} block px-3 py-2 rounded hover:bg-gray-100 flex items-center`}
                      onClick={closeMenu}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout} // Use the updated handler
                    className="text-red-600 hover:text-red-800 block px-3 py-2 rounded hover:bg-red-50 flex items-center w-full text-left"
                  >
                    <FaUser className="mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`${isActive('/login')} block px-3 py-2 rounded hover:bg-gray-100`}
                    onClick={closeMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className={`${isActive('/register')} block px-3 py-2 rounded hover:bg-gray-100`}
                    onClick={closeMenu}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
