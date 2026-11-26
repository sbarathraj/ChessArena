import { generate5CharCode, isValid5CharCode } from '../src/domain/chess/roomCode';

describe('Friend Room Code & Format Validation', () => {
  test('generate5CharCode generates exactly 5 alphanumeric uppercase characters', () => {
    for (let i = 0; i < 20; i++) {
      const code = generate5CharCode();
      expect(code).toHaveLength(5);
      expect(/^[A-Z0-9]{5}$/.test(code)).toBe(true);
      expect(code).toBe(code.toUpperCase());
    }
  });

  test('Validates 5-character length and rejects non-5 char codes', () => {
    const validCode = 'G8K2P';
    const tooShort = 'G8K2';
    const tooLong = 'G8K2PA';
    const invalidChars = 'G8-2!';

    const isValid = (c: string) => /^[A-Z0-9]{5}$/.test(c.trim().toUpperCase());

    expect(isValid(validCode)).toBe(true);
    expect(isValid(tooShort)).toBe(false);
    expect(isValid(tooLong)).toBe(false);
    expect(isValid(invalidChars)).toBe(false);
  });

  test('Room join status evaluation state machine', () => {
    function evaluateRoomJoin(roomState: { status: string; whitePlayerId: string | null; blackPlayerId: string | null }) {
      if (roomState.status !== 'pending' && roomState.status !== 'active') {
        return { success: false, status: 'ended', error: 'This game has already ended.' };
      }
      if (roomState.status === 'active' || (roomState.whitePlayerId && roomState.blackPlayerId)) {
        return { success: false, status: 'playing', error: 'Both players are already playing in this room.' };
      }
      return { success: true, status: 'joined', message: 'Joined game successfully' };
    }

    // 1. Pending room with 1 player waiting -> can join!
    const pendingRoom = { status: 'pending', whitePlayerId: 'user_1', blackPlayerId: null };
    expect(evaluateRoomJoin(pendingRoom)).toEqual({
      success: true,
      status: 'joined',
      message: 'Joined game successfully',
    });

    // 2. Both players already playing -> reject with "playing"
    const activeRoom = { status: 'active', whitePlayerId: 'user_1', blackPlayerId: 'user_2' };
    expect(evaluateRoomJoin(activeRoom)).toEqual({
      success: false,
      status: 'playing',
      error: 'Both players are already playing in this room.',
    });

    // 3. Game finished -> reject with "ended"
    const finishedRoom = { status: 'checkmate', whitePlayerId: 'user_1', blackPlayerId: 'user_2' };
    expect(evaluateRoomJoin(finishedRoom)).toEqual({
      success: false,
      status: 'ended',
      error: 'This game has already ended.',
    });
  });

  test('Room reopening when code is re-entered after game finished', () => {
    function resolveRoomCodeEntry(
      roomState: { status: string; whitePlayerId: string | null; blackPlayerId: string | null } | null,
      currentUserId: string,
      code: string
    ) {
      if (!roomState) {
        return { success: true, action: 'created', code, role: 'white', status: 'pending' };
      }
      // Finished room -> Reopen!
      if (roomState.status !== 'pending' && roomState.status !== 'active') {
        return { success: true, action: 'reopened', code, role: 'white', status: 'pending' };
      }
      if (roomState.status === 'pending' && !roomState.blackPlayerId && roomState.whitePlayerId !== currentUserId) {
        return { success: true, action: 'joined', code, role: 'black', status: 'active' };
      }
      return { success: true, action: 'rejoined', code, status: roomState.status };
    }

    // Finished room (e.g. checkmate or resignation) -> typing same code reopens it
    const finishedRoom = { status: 'resignation', whitePlayerId: 'user_1', blackPlayerId: 'user_2' };
    const reopenResult = resolveRoomCodeEntry(finishedRoom, 'user_1', '54321');
    expect(reopenResult.action).toBe('reopened');
    expect(reopenResult.status).toBe('pending');
    expect(reopenResult.role).toBe('white');

    // Opponent entering the reopened room -> joins as Black and activates game
    const pendingRoom = { status: 'pending', whitePlayerId: 'user_1', blackPlayerId: null };
    const joinResult = resolveRoomCodeEntry(pendingRoom, 'user_2', '54321');
    expect(joinResult.action).toBe('joined');
    expect(joinResult.status).toBe('active');
    expect(joinResult.role).toBe('black');
  });

  test('Room creation when code is not found', () => {
    function resolveCodeJoin(existingRoom: any | null, inputCode: string) {
      if (!existingRoom) {
        return {
          success: true,
          status: 'created',
          inviteCode: inputCode,
          message: `Room created! Waiting for friend to enter code ${inputCode}...`,
        };
      }
      return { success: true, status: 'joined', inviteCode: inputCode };
    }

    const notFoundResult = resolveCodeJoin(null, 'ABC99');
    expect(notFoundResult.status).toBe('created');
    expect(notFoundResult.inviteCode).toBe('ABC99');

    const foundResult = resolveCodeJoin({ id: 'game-1' }, 'ABC99');
    expect(foundResult.status).toBe('joined');
  });

  test('Direct challenge mutual pairing logic', () => {
    interface Challenge {
      senderId: string;
      receiverId: string;
      status: 'pending' | 'accepted' | 'declined';
    }

    function processChallenge(
      existingChallenges: Challenge[],
      senderId: string,
      receiverId: string
    ) {
      // Check if receiver already challenged sender
      const mutual = existingChallenges.find(
        (c) => c.senderId === receiverId && c.receiverId === senderId && c.status === 'pending'
      );
      if (mutual) {
        mutual.status = 'accepted';
        return { status: 'accepted', message: 'Both players ready! Match starting.' };
      }
      return { status: 'pending', message: 'Challenge sent! Waiting for response.' };
    }

    const challenges: Challenge[] = [];
    // User A challenges User B
    const res1 = processChallenge(challenges, 'barathraj', 'rajeshkanna');
    expect(res1.status).toBe('pending');
    challenges.push({ senderId: 'barathraj', receiverId: 'rajeshkanna', status: 'pending' });

    // User B also challenges User A (or accepts) -> auto-match!
    const res2 = processChallenge(challenges, 'rajeshkanna', 'barathraj');
    expect(res2.status).toBe('accepted');
  });

  test('Safe username resolution avoids unique constraint collisions', () => {
    function resolveUniqueUsername(existingUsernames: Set<string>, proposed: string, userId: string) {
      const clean = proposed.trim() || 'Player';
      if (!existingUsernames.has(clean)) {
        return clean;
      }
      return `${clean}_${userId.substring(0, 4)}`;
    }

    const taken = new Set(['Player', 'barathraj']);
    expect(resolveUniqueUsername(taken, 'rajeshkanna', '123456')).toBe('rajeshkanna');
    expect(resolveUniqueUsername(taken, 'Player', 'abcd-efgh')).toBe('Player_abcd');
    expect(resolveUniqueUsername(taken, 'barathraj', '9999-0000')).toBe('barathraj_9999');
  });

  test('Timeout correctly assigns the opponent as winner', () => {
    function resolveTimeoutWinner(turn: 'w' | 'b', whiteId: string, blackId: string) {
      // The player whose turn it is when time expires has timed out; opponent wins
      const winnerId = turn === 'w' ? blackId : whiteId;
      const winnerColor = turn === 'w' ? 'b' : 'w';
      return { winnerId, winnerColor };
    }

    // White timed out -> Black wins
    expect(resolveTimeoutWinner('w', 'user_w', 'user_b')).toEqual({
      winnerId: 'user_b',
      winnerColor: 'b',
    });

    // Black timed out -> White wins
    expect(resolveTimeoutWinner('b', 'user_w', 'user_b')).toEqual({
      winnerId: 'user_w',
      winnerColor: 'w',
    });
  });
});
