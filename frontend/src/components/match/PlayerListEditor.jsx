import { useState } from "react";

export default function PlayerListEditor({
  players,
  setPlayers,
  teamLabel,
}) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  const selectedCount = players.filter((p) => p.selected !== false).length;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim() || !number) return;

    const numberVal = parseInt(number, 10);
    if (players.some((p) => p.number === numberVal)) {
      alert("Ya existe un jugador con ese dorsal.");
      return;
    }

    const isSelected = selectedCount < 16;
    const isGk = [1, 12, 16].includes(numberVal);

    setPlayers((prev) => [
      ...prev,
      { name: name.trim(), number: numberVal, selected: isSelected, is_goalkeeper: isGk },
    ]);

    setName("");
    setNumber("");
  };

  const handleRemove = (index) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleSelect = (index) => {
    setPlayers((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, selected: p.selected === false ? true : false } : p
      )
    );
  };

  const handleToggleGoalkeeper = (index) => {
    setPlayers((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, is_goalkeeper: !p.is_goalkeeper } : p
      )
    );
  };

  return (
    <div className="player-list-editor">

      <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Jugadores — {teamLabel}</span>
        <span style={{ fontSize: "0.85rem", color: selectedCount > 16 ? "var(--accent-danger)" : "var(--text-muted)" }}>
          Convocados: {selectedCount}/16
        </span>
      </h4>

      {players.length > 0 && (
        <div className="player-table">
          <div className="player-table-header">
            <span className="col-select" style={{ width: 35, display: "inline-block" }}></span>
            <span className="col-number">#</span>
            <span className="col-name" style={{ width: "60%" }}>Nombre</span>
            <span className="col-role" style={{ width: "20%", textAlign: "center" }}>Rol</span>
            <span className="col-action"></span>
          </div>

          {players.map((player, index) => {
            const isSelected = player.selected !== false;
            const isGk = player.is_goalkeeper === true || player.is_goalkeeper === "true";
            return (
              <div
                key={index}
                className="player-table-row"
                style={{ opacity: isSelected ? 1 : 0.5, transition: "0.2s" }}
              >
                <span className="col-select" style={{ width: 35, display: "inline-flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(index)}
                    disabled={!isSelected && selectedCount >= 16}
                    style={{
                      cursor: !isSelected && selectedCount >= 16 ? "not-allowed" : "pointer",
                      width: 16,
                      height: 16,
                    }}
                  />
                </span>
                <span className="col-number">{player.number}</span>
                <span className="col-name" style={{ width: "60%" }}>{player.name}</span>
                <span
                  className="col-role"
                  style={{
                    width: "20%",
                    textAlign: "center",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={() => handleToggleGoalkeeper(index)}
                  title="Haz clic para cambiar rol"
                >
                  {isGk ? "Portero" : "Jugador"}
                </span>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemove(index)}
                  title="Eliminar jugador"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {players.length === 0 && (
        <p className="empty-players">
          No hay jugadores añadidos. Añade manualmente o sube un PDF del acta.
        </p>
      )}

      <form className="add-player-form" onSubmit={handleAdd}>
        <input
          className="input-field input-small"
          type="number"
          min="0"
          max="99"
          placeholder="#"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />

        <input
          className="input-field"
          type="text"
          placeholder="Nombre del jugador"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button type="submit" className="btn btn-primary btn-sm">
          Añadir
        </button>
      </form>
    </div>
  );
}

