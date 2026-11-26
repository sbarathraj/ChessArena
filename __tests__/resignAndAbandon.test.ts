describe('Resign & Abandonment Handling', () => {
  interface GameState {
    status: 'active' | 'resignation' | 'abandoned' | 'timeout' | 'checkmate';
    termination?: 'resignation' | 'abandonment' | 'time_forfeit' | 'normal';
    whitePlayerId: string;
    blackPlayerId: string;
    winnerId: string | null;
  }

  function evaluateOnlineGameOver(
    state: GameState,
    currentUserId: string,
    orientation: 'w' | 'b'
  ): { isOver: boolean; winner: 'w' | 'b' | 'draw'; description: string; termination: string } {
    let winner: 'w' | 'b' | 'draw' = 'draw';
    let termination = state.termination || state.status;
    let description = 'Game finished.';

    if (state.winnerId) {
      winner = state.winnerId === state.whitePlayerId ? 'w' : 'b';
    } else if (state.status === 'resignation' || state.status === 'abandoned') {
      winner = orientation === 'w' ? 'b' : 'w';
    }

    if (state.status === 'resignation' || state.termination === 'resignation') {
      description = winner === orientation ? 'Opponent resigned. You win!' : 'You resigned. Opponent wins!';
    } else if (state.status === 'abandoned' || state.termination === 'abandonment') {
      description = winner === orientation ? 'Opponent left the match. You win!' : 'You left the match. Opponent wins!';
    } else if (state.status === 'timeout' || state.termination === 'time_forfeit') {
      description = winner === orientation ? 'Opponent ran out of time. You win!' : 'You ran out of time. Opponent wins!';
    }

    return {
      isOver: state.status !== 'active',
      winner,
      description,
      termination,
    };
  }

  const whiteUserId = 'user-white-111';
  const blackUserId = 'user-black-222';

  test('When White resigns, Black is declared winner with appropriate descriptions', () => {
    const state: GameState = {
      status: 'resignation',
      termination: 'resignation',
      whitePlayerId: whiteUserId,
      blackPlayerId: blackUserId,
      winnerId: blackUserId,
    };

    // For White player (the one who resigned)
    const whiteView = evaluateOnlineGameOver(state, whiteUserId, 'w');
    expect(whiteView.isOver).toBe(true);
    expect(whiteView.winner).toBe('b');
    expect(whiteView.description).toBe('You resigned. Opponent wins!');

    // For Black player (the winner)
    const blackView = evaluateOnlineGameOver(state, blackUserId, 'b');
    expect(blackView.isOver).toBe(true);
    expect(blackView.winner).toBe('b');
    expect(blackView.description).toBe('Opponent resigned. You win!');
  });

  test('When Black leaves / abandons, White is declared winner with abandonment reason', () => {
    const state: GameState = {
      status: 'abandoned',
      termination: 'abandonment',
      whitePlayerId: whiteUserId,
      blackPlayerId: blackUserId,
      winnerId: whiteUserId,
    };

    // For White player (the winner)
    const whiteView = evaluateOnlineGameOver(state, whiteUserId, 'w');
    expect(whiteView.isOver).toBe(true);
    expect(whiteView.winner).toBe('w');
    expect(whiteView.description).toBe('Opponent left the match. You win!');

    // For Black player (the leaver)
    const blackView = evaluateOnlineGameOver(state, blackUserId, 'b');
    expect(blackView.isOver).toBe(true);
    expect(blackView.winner).toBe('w');
    expect(blackView.description).toBe('You left the match. Opponent wins!');
  });
});
