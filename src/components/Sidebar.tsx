import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import logo from '../assets/logo_black_name.svg';
interface SidebarProps {
  activeMenuItem: string;
  setActiveMenuItem: (menuItem: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMenuItem, setActiveMenuItem }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);   

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Logo" className="mx-auto" />

        </div>
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.email?.charAt(0).toUpperCase() || ''} 
          </div>
          
          <div className="user-info">
            <div className="user-email">{user?.firstname || 'Welcome'}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className={activeMenuItem === 'applications' ? 'active' : ''}>
              <button onClick={() => setActiveMenuItem('applications')}>
                {/* <span className="menu-icon">📄</span> */}
                Applications
              </button>
            </li>
            <li className={activeMenuItem === 'servicing' ? 'active' : ''}>
              <button onClick={() => setActiveMenuItem('servicing')}>
               {/* <span className="menu-icon">💰</span> */}
                Servicing
              </button>
            </li>
            <li className={activeMenuItem === 'settings' ? 'active' : ''}>
              <button onClick={() => setActiveMenuItem('settings')}>
                {/* <span className="menu-icon">⚙️</span> */}
                Settings
              </button>
            </li>
            <li>
              <button onClick={handleLogout}>
                {/* <span className="menu-icon">🚪</span> */}
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    );
};

export default Sidebar;