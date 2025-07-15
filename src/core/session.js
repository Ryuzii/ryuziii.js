// Handles Discord Gateway session state
class SessionManager {
  constructor() {
    this.sessionId = null;
    this.sequence = null;
  }

  updateSequence(seq) {
    this.sequence = seq;
  }

  setSessionId(id) {
    this.sessionId = id;
  }

  getSessionInfo() {
    return { sessionId: this.sessionId, sequence: this.sequence };
  }
}

module.exports = SessionManager; 