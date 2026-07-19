"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Team = { id: string; name: string; points: number; logo?: string };

const demoTeams: Team[] = [
  { id: "1", name: "PSG", points: 92 },
  { id: "2", name: "BURIRAM UNITED", points: 86 },
  { id: "3", name: "WAG", points: 74 },
  { id: "4", name: "HEAVY", points: 61 },
];

const parseRows = (text: string): Team[] => text.split(/\r?\n/).map((line, index) => {
  const cells = line.split(/\t|,|;|\|/).map((cell) => cell.trim()).filter(Boolean);
  if (cells.length < 2) return null;
  const points = Number(cells.at(-1)?.replace(/[^0-9.-]/g, ""));
  const name = cells.length > 2 && /^\d+$/.test(cells[0]) ? cells.slice(1, -1).join(" ") : cells.slice(0, -1).join(" ");
  return name && Number.isFinite(points) ? { id: `${Date.now()}-${index}`, name, points } : null;
}).filter((team): team is Team => Boolean(team));

const fileUrl = (file?: File) => file ? URL.createObjectURL(file) : "";

export default function Home() {
  const [teams, setTeams] = useState<Team[]>(demoTeams);
  const [threshold, setThreshold] = useState(80);
  const [round, setRound] = useState("ROUND 6");
  const [paste, setPaste] = useState("PSG, 92\nBURIRAM UNITED, 86\nWAG, 74\nHEAVY, 61");
  const [overlay, setOverlay] = useState("");
  const [compact, setCompact] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("champion-rush-board") || "null");
      if (saved?.teams) setTeams(saved.teams);
      if (Number.isFinite(saved?.threshold)) setThreshold(saved.threshold);
      if (saved?.round) setRound(saved.round);
    } catch {}
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem("champion-rush-board", JSON.stringify({ teams, threshold, round }));
  }, [teams, threshold, round]);

  const ranked = useMemo(() => [...teams].sort((a, b) => b.points - a.points), [teams]);
  const champions = ranked.filter((team) => team.points >= threshold);

  function importText(text = paste) {
    const parsed = parseRows(text);
    if (parsed.length) setTeams(parsed);
  }

  function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const text = String(reader.result || ""); setPaste(text); importText(text); };
    reader.readAsText(file);
  }

  function setLogo(id: string, event: ChangeEvent<HTMLInputElement>) {
    const logo = fileUrl(event.target.files?.[0]);
    if (logo) setTeams((current) => current.map((team) => team.id === id ? { ...team, logo } : team));
  }

  function addTeam() {
    setTeams((current) => [...current, { id: crypto.randomUUID(), name: `TEAM ${current.length + 1}`, points: 0 }]);
  }

  return (
    <main>
      <header className="topbar">
        <div className="brandMark"><span>CR</span></div>
        <div><p className="eyebrow">FREE FIRE BROADCAST TOOL</p><h1>Champion Rush Control</h1></div>
        <div className="live"><i /> LIVE DATA</div>
      </header>

      <section className="hero">
        <div><p className="eyebrow gold">MATCH POINT TRACKER</p><h2>Biến bảng điểm thành khoảnh khắc <em>Champion Rush.</em></h2><p>Đặt ngưỡng điểm, thêm logo và theo dõi đội nào đã đủ điều kiện kích hoạt.</p></div>
        <div className="heroStat"><span>ĐÃ KÍCH HOẠT</span><strong>{champions.length}</strong><small>/ {teams.length} đội</small></div>
      </section>

      <div className="grid">
        <aside className="controls panel">
          <div className="panelTitle"><span>01</span><div><p>THIẾT LẬP</p><h3>Dữ liệu trận đấu</h3></div></div>
          <label>Tên vòng đấu<input value={round} onChange={(e) => setRound(e.target.value.toUpperCase())} /></label>
          <label className="threshold">Mốc Champion Rush <b>{threshold} điểm</b><input type="range" min="1" max="200" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} /><input type="number" min="1" value={threshold} onChange={(e) => setThreshold(Math.max(1, Number(e.target.value)))} /></label>
          <label>Dán dữ liệu từ Sheet<textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Tên team, điểm" /></label>
          <div className="buttonRow"><button className="primary" onClick={() => importText()}>Cập nhật bảng</button><label className="fileButton">Tải CSV<input type="file" accept=".csv,.tsv,.txt" onChange={importCsv} /></label></div>
          <div className="divider" />
          <label className="uploadBox"><span>OVERLAY TÙY CHỈNH</span><b>{overlay ? "Đã thêm overlay" : "Thêm overlay PNG"}</b><small>PNG trong suốt, khuyên dùng 1920 × 1080</small><input type="file" accept="image/png,image/webp" onChange={(e) => setOverlay(fileUrl(e.target.files?.[0]))} /></label>
          {overlay && <button className="ghost" onClick={() => setOverlay("")}>Bỏ overlay</button>}
        </aside>

        <section className="preview panel">
          <div className="previewHead"><div><p>02 · BROADCAST PREVIEW</p><h3>Xem trước bảng phát sóng</h3></div><button className="ghost" onClick={() => setCompact(!compact)}>{compact ? "Mở rộng" : "Thu gọn"}</button></div>
          <div className={`broadcast ${compact ? "compact" : ""}`}>
            {overlay && <img className="overlay" src={overlay} alt="Overlay tùy chỉnh" />}
            <div className="rushHeader"><span className="wing">◆</span><div><small>{round}</small><b>CHAMPION <i>RUSH</i></b></div><span className="wing">◆</span></div>
            <div className="board">
              {ranked.map((team, index) => {
                const reached = team.points >= threshold;
                return <article className={`teamRow ${reached ? "reached" : ""}`} key={team.id}>
                  <span className="rank">{String(index + 1).padStart(2, "0")}</span>
                  <label className="logoSlot">
                    {team.logo ? <img src={team.logo} alt={`Logo ${team.name}`} /> : <span>{team.name.slice(0, 2)}</span>}
                    <input type="file" accept="image/*" onChange={(e) => setLogo(team.id, e)} />
                  </label>
                  <div className="teamInfo"><input aria-label="Tên đội" value={team.name} onChange={(e) => setTeams((all) => all.map((t) => t.id === team.id ? { ...t, name: e.target.value.toUpperCase() } : t))} /><small>{reached ? "CHAMPION RUSH ACTIVE" : `${threshold - team.points} ĐIỂM NỮA`}</small></div>
                  <input className="points" aria-label="Điểm" type="number" value={team.points} onChange={(e) => setTeams((all) => all.map((t) => t.id === team.id ? { ...t, points: Number(e.target.value) } : t))} />
                  <div className="crown" title={reached ? "Đã kích hoạt Champion Rush" : "Chưa đạt mốc"}><span>♛</span></div>
                </article>;
              })}
            </div>
          </div>
          <div className="previewFoot"><span><i className="dot goldDot" /> Đạt mốc: {champions.length}</span><span><i className="dot" /> Đang đua: {teams.length - champions.length}</span><button onClick={addTeam}>+ Thêm đội</button></div>
        </section>
      </div>
    </main>
  );
}
