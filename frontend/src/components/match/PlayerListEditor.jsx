import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function PlayerListEditor({
  players,
  setPlayers,
  teamLabel,
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  const selectedCount = players.filter((p) => p.selected !== false).length;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim() || !number) return;

    const numberVal = parseInt(number, 10);
    if (players.some((p) => p.number === numberVal)) {
      alert(t("create_match.dorsal_exists"));
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
        <span>{t("create_match.players_label", { team: teamLabel })}</span>
        <span style={{ fontSize: "0.85rem", color: selectedCount > 16 ? "var(--accent-danger)" : "var(--text-muted)" }}>
          {t("create_match.called_up", { count: selectedCount })}
        </span>
      </h4>

      {players.length > 0 && (
        <div className="player-table">
          <div className="player-table-header">
            <span className="col-select" style={{ width: 35, display: "inline-block" }}></span>
            <span className="col-number">{t("create_match.col_number")}</span>
            <span className="col-name" style={{ width: "60%" }}>{t("create_match.col_name")}</span>
            <span className="col-role" style={{ width: "20%", textAlign: "center" }}>{t("create_match.col_role")}</span>
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
                  title={t("create_match.role_toggle_title")}
                >
                  {isGk ? t("create_match.goalkeeper") : t("create_match.field_player")}
                </span>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemove(index)}
                  title={t("create_match.remove_player_title")}
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
          {t("create_match.empty_players")}
        </p>
      )}

      <form className="add-player-form" onSubmit={handleAdd}>
        <input
          className="input-field input-small"
          type="number"
          min="0"
          max="99"
          placeholder={t("create_match.dorsal_placeholder")}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />

        <input
          className="input-field"
          type="text"
          placeholder={t("create_match.player_name_placeholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button type="submit" className="btn btn-primary btn-sm">
          {t("create_match.add")}
        </button>
      </form>
    </div>
  );
}

