  // ── State ─────────────────────────────────────────────────────────────────
  const OBFUSCATED_TOKENS = [
    'TUxZfDI2Mjc1MzI0MjQ4NzU4MDZ8NzgxOWQ2M2JlZTgxNzlhMDgzY2RkNzZlMjA1NTc5Njc=',
    'TUxZfDI2NjYyMTg5OTIzNDA0MzAyfGE0NmQwM2U5ZGVmYmM3ZjYwNWEyYjA1MzA2ZjlkZmYy',
    'TUxZfDI3Nzc4OTUzNDc1MDQwNzYwfGI3ODZiODk1ODgyYWVlOTQxY2NjNTkyMTI0MTA0NDkw',
    'TUxZfDI3MDcwMjUzMDg1OTQxNzg5fDJhMDg4MThkM2Y2YTNmZmYyZjgwYTEzMWQ5MmEzOTdh',
    'TUxZfDI3MjI2NTQ4MDU2OTQ5NTIyfDkwYWQ1ZGNkYTBiYjI3MjVhYzk5MGFmMTY1Y2E3NTAw',
    'TUxZfDI3NTM0NzE0OTk2MTIwNjcyfDViOWNjNjlkMzQxYmYxYzg5ODIxNjJjOGE2NzdjZjFi',
    'TUxZfDI3MDI1NDk4NzYzNzU4MjgxfDkxMDc4NDc1ZGNjNzg4NzBhYWI2ODMyOGEyZjE1N2U1',
    'TUxZfDI3NDMxNDQ3NjU2NTUwMjQ2fDdiNzgxZjJhODM0NGRlZWFkNmFjYmY0ZGM4ZWNiOGIy',
    'TUxZfDI3MDQyMDg5NDg1NDgzODUxfDBkYjg5ZmE5OTgyOTA1MmY5MWQ5ZWY4MWI3ZTMzOTQ4',
    'TUxZfDI3MTkzMDgyNDczNjQ5NDM2fDNkN2RhNzE1NjFhNDI1N2UxNjk4ZWI1ZjI0NjcwMTAy'
  ];
  const DEFAULT_TOKENS = OBFUSCATED_TOKENS.map(t => atob(t));
  let tokenIndex = 0;
  function nextToken() {
    const token = DEFAULT_TOKENS[tokenIndex % DEFAULT_TOKENS.length];
    tokenIndex++;
    return token;
  }
  let mlyToken = localStorage.getItem('mapillary_client_token') || DEFAULT_TOKENS[0];
  let mlyViewer     = null;
  let guessMap      = null;
  let resultMap     = null;
  let guessMarker   = null;
  let resultLine    = null;
  let isMapInteracting = false;
  let currentRound  = 1;
  let totalScore    = 0;
  let gameLocations = [];
  let currentLoc    = null;
  let hasGuessed    = false;
  let gameActive    = false;
  let currentMode   = 'Mixed';

  // Lấy danh sách địa điểm theo chế độ, Xuyên Việt sẽ giới hạn HN, SG, ĐN tối đa 10
  function getModePool(mode) {
    if (mode !== 'Mixed') {
      return LOCATIONS.filter(l => l.city === mode);
    }
    const hn = shuffleLocations(LOCATIONS.filter(l => l.city === 'Hanoi')).slice(0, 10);
    const sg = shuffleLocations(LOCATIONS.filter(l => l.city === 'Saigon')).slice(0, 10);
    const dn = shuffleLocations(LOCATIONS.filter(l => l.city === 'DaNang')).slice(0, 10);
    const others = LOCATIONS.filter(l => !['Hanoi', 'Saigon', 'DaNang'].includes(l.city));
    return [...hn, ...sg, ...dn, ...others];
  }
  const activeFetches = new Map();

  const CITY_MAX_DISTANCES = {
    'Hanoi': 50,
    'Saigon': 50,
    'DaNang': 30,
    'DaLat': 30,
    'HoiAn': 20,
    'VungTau': 30,
    'NhaTrang': 30,
    'SaPa': 20,
    'Mixed': 1300
  };
  let retryAction = null;

  // ── Endless Mode State ─────────────────────────────────────────────────────
  let isEndless         = false;
  let endlessStreak     = 0;   // streak hiện tại
  let endlessLives      = ENDLESS_LIVES; // mạng còn lại
  let endlessBestStreak = 0;   // streak cao nhất trong session này
  let endlessRounds     = 0;   // số vòng đã chơi

  // ── Multiplayer State ─────────────────────────────────────────────────────
  let isMultiplayer = false;
  let peer = null;
  let peerConnection = null;
  let isHost = false;
  let myMultiScore = 0;
  let oppMultiScore = 0;
  let oppGuessData = null; 
  let myGuessTemp = null;
  let currentImageId = null;
  let heartbeatInterval = null;

  // ── Timer State ───────────────────────────────────────────────────────────
  let timerInterval = null;
  let timeLeft      = 180;
  let timerActive   = false;
  let currentGameSessionId = 0;



  function sendPeerMessage(data) {
      if (peerConnection && peerConnection.open) {
          try {
              peerConnection.send(data);
          } catch (e) {
              console.error("Lỗi gửi dữ liệu:", e);
          }
      } else {
          console.warn("Kết nối chưa mở, không thể gửi:", data);
      }
  }

