
import Navbar from "../components/Navbar";

function Sejours() {
  return (
    <>
      <Navbar />
      <div className="page-header">
        <h1>Gestion des séjours</h1>
        <p>Suivre les arrivées et les départs des clients.</p>
      </div>

      <div className="content-card">
        <h3>Liste des séjours</h3>
        <p>Aucun séjour affiché pour le moment.</p>
      </div>
    </>
  );
}

export default Sejours;
