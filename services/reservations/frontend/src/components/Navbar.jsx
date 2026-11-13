
import { Bell, UserCircle } from "lucide-react";

function Navbar() {
  return (
    <header className="navbar">
      <div>
        <h3>Espace de gestion</h3>
        <p>Bienvenue dans RiadManager</p>
      </div>

      <div className="navbar-user">
        <Bell size={21} />
        <UserCircle size={30} />
        <span>Administrateur</span>
      </div>
    </header>
  );
}

export default Navbar;
