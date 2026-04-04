import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Gift, Trash2, ShieldAlert, Sparkles, Send, XCircle } from 'lucide-react';

const API_URL = 'http://localhost:3333/api';

function App() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      console.log("A buscar participantes...");
      const res = await axios.get(`${API_URL}/participants`);
      setParticipants(res.data);
    } catch (e) {
      console.error("Backend offline ou erro de rede.");
    }
  };

  const addParticipant = async () => {
    if (!name || !email) return;
    console.log("A adicionar participante:", name);
    await axios.post(`${API_URL}/participants`, { name, email });
    setName(''); setEmail('');
    fetchParticipants();
  };

  const removeParticipant = async (id: string) => {
    console.log("A tentar remover participante ID:", id);
    try {
      await axios.delete(`${API_URL}/participants/${id}`);
      fetchParticipants();
    } catch (e) {
      console.error("Falha ao remover.");
    }
  };

  const runDraw = async () => {
    console.log("A iniciar sorteio...");
    const res = await axios.post(`${API_URL}/draw`);
    if (res.data.error) {
       alert("Erro no sorteio: " + res.data.error);
    } else {
       setResults(res.data);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">
           <Sparkles className="icon-sparkle" /> Amigo Secreto Premium
        </h1>
        <p className="subtitle">Lançamento de sorteios simplificado.</p>
      </header>

      <main className="main-grid">
        <section className="glass-card">
          <h2 className="card-title">
            <UserPlus size={20} /> Registro
          </h2>
          <div className="form-group">
            <input 
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Nome" className="input-field"
            />
            <input 
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" className="input-field"
            />
            <button onClick={addParticipant} className="btn btn-add">
              Salvar <Send size={16} />
            </button>
          </div>
        </section>

        <section className="glass-card">
          <h2 className="card-title">
            <span>Lista ({participants.length})</span>
          </h2>
          <div className="list-container">
            {participants.length === 0 && <p className="empty-msg">Ninguém cadastrado.</p>}
            {participants.map(p => (
              <div key={p.id} className="list-item">
                <div className="item-info">
                  <span className="item-name">{p.name}</span>
                  <span className="item-email">{p.email}</span>
                </div>
                <button 
                  className="action-btn-remove" 
                  onClick={() => removeParticipant(p.id)}
                  title="Remover participante"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <button 
            disabled={participants.length < 3}
            onClick={runDraw}
            className="btn btn-draw"
          >
            <Gift size={20} /> Sortear Agora
          </button>
        </section>
      </main>

      {results.length > 0 && (
        <section className="results-container glass-card">
           <div className="results-header">
             <h2 className="results-title">🎉 Resultado do Sorteio</h2>
             <button onClick={() => setResults([])} className="btn-clear">
                Limpar <XCircle size={16} />
             </button>
           </div>
           <div className="results-grid">
              {results.map(r => (
                <div key={r.participantId} className="result-tag">
                  <strong>{participants.find(p => p.id === r.participantId)?.name}</strong> 
                  <span className="arrow">➔</span> 
                  <strong>{participants.find(p => p.id === r.drawnFriendId)?.name}</strong>
                </div>
              ))}
           </div>
        </section>
      )}
    </div>
  );
}

export default App;
